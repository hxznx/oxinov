import { Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { DomainError, Errors } from '../common/errors';
import type { AuthUser, TenantScope } from '../common/request';
import { DatabaseContext, type Tx } from '../database/database-context.service';
import type { Prisma } from '../generated/prisma/client';
import { hasActiveEntitlement } from '../learning/access';
import { safeFileName } from '../media/media-rules';
import { ObjectStorage } from '../media/object-storage';
import { hasRole } from '../tenancy/roles';
import type {
  AssignmentDto,
  AssignmentInputDto,
  DraftInputDto,
  FileUploadDto,
  GradeInputDto,
  MySubmissionDto,
  RevisionDto,
  SubmissionDetailDto,
  SubmissionSummaryDto,
  UploadTicketDto,
} from './assignments.dto';
import { safeSubmissionUrl, submissionFileProblem, submissionLooksLike } from './submission-files';

type AssignmentRow = Prisma.AssignmentGetPayload<object>;
type RevisionRow = Prisma.SubmissionRevisionGetPayload<object>;
type SubmissionRow = Prisma.AssignmentSubmissionGetPayload<object>;

const invalid = (message: string) => new DomainError('VALIDATION_FAILED', 400, message);
const EDITABLE: ReadonlySet<string> = new Set(['DRAFT', 'REVISION_REQUESTED']);

/**
 * Assignments (FR-ASSESS-503). Teachers of a course create assignments and grade submissions; learners with
 * course access keep a private draft (text, link, file), submit it before the deadline (or late, if allowed),
 * and may resubmit when a revision is requested. Every submitted revision and its feedback is kept. Row-level
 * security keeps each learner's work visible only to them and to the tenant's teaching staff.
 */
@Injectable()
export class AssignmentsService {
  constructor(
    private readonly db: DatabaseContext,
    private readonly storage: ObjectStorage,
  ) {}

  // ---- Teachers ------------------------------------------------------------------------------------

  manageList(scope: TenantScope, user: AuthUser, courseId: string): Promise<AssignmentDto[]> {
    return this.run(scope, user, async (tx) => {
      await this.ownedCourse(tx, scope, user, courseId);
      const assignments = await tx.assignment.findMany({ where: { tenantId: scope.tenantId, courseId }, orderBy: { createdAt: 'asc' } });
      const counts = await tx.assignmentSubmission.groupBy({
        by: ['assignmentId', 'status'],
        where: { tenantId: scope.tenantId, assignmentId: { in: assignments.map((a) => a.id) }, revisionCount: { gt: 0 } },
        _count: true,
      });
      return assignments.map((assignment) => {
        const rows = counts.filter((row) => row.assignmentId === assignment.id);
        return {
          ...this.toDto(assignment),
          counts: {
            submitted: rows.reduce((sum, row) => sum + row._count, 0),
            toGrade: rows.filter((row) => row.status === 'SUBMITTED').reduce((sum, row) => sum + row._count, 0),
          },
        };
      });
    });
  }

  create(scope: TenantScope, user: AuthUser, courseId: string, input: AssignmentInputDto): Promise<AssignmentDto> {
    return this.run(scope, user, async (tx) => {
      await this.ownedCourse(tx, scope, user, courseId);
      const assignment = await tx.assignment.create({
        data: { tenantId: scope.tenantId, courseId, createdByUserId: user.userId, ...this.settings(input, true) },
      });
      await this.audit(tx, scope, user, 'assignment.created', 'assignment', assignment.id);
      return this.toDto(assignment);
    });
  }

  update(scope: TenantScope, user: AuthUser, assignmentId: string, input: AssignmentInputDto): Promise<AssignmentDto> {
    return this.run(scope, user, async (tx) => {
      const assignment = await this.ownedAssignment(tx, scope, user, assignmentId);
      return this.toDto(await tx.assignment.update({ where: { id: assignment.id }, data: this.settings(input, false) }));
    });
  }

  setStatus(scope: TenantScope, user: AuthUser, assignmentId: string, status: 'PUBLISHED' | 'CLOSED'): Promise<AssignmentDto> {
    return this.run(scope, user, async (tx) => {
      const assignment = await this.ownedAssignment(tx, scope, user, assignmentId);
      const updated = await tx.assignment.update({ where: { id: assignment.id }, data: { status } });
      await this.audit(tx, scope, user, status === 'PUBLISHED' ? 'assignment.published' : 'assignment.closed', 'assignment', assignment.id);
      return this.toDto(updated);
    });
  }

  submissions(scope: TenantScope, user: AuthUser, assignmentId: string): Promise<SubmissionSummaryDto[]> {
    return this.run(scope, user, async (tx) => {
      const assignment = await this.ownedAssignment(tx, scope, user, assignmentId);
      const rows = await tx.assignmentSubmission.findMany({
        where: { tenantId: scope.tenantId, assignmentId: assignment.id, revisionCount: { gt: 0 } },
        include: { user: { select: { displayName: true, email: true } }, revisions: { orderBy: { revision: 'desc' }, take: 1, select: { late: true } } },
        orderBy: { lastSubmittedAt: 'asc' },
      });
      return rows.map((row) => ({
        id: row.id,
        learner: { name: row.user.displayName, email: row.user.email },
        status: row.status,
        revisions: row.revisionCount,
        lastSubmittedAt: row.lastSubmittedAt,
        late: row.revisions[0]?.late ?? false,
      }));
    });
  }

  submission(scope: TenantScope, user: AuthUser, submissionId: string): Promise<SubmissionDetailDto> {
    return this.run(scope, user, async (tx) => {
      const { submission, assignment } = await this.gradableSubmission(tx, scope, user, submissionId);
      const learner = await tx.userProfile.findUniqueOrThrow({ where: { id: submission.userId }, select: { displayName: true, email: true } });
      const revisions = await tx.submissionRevision.findMany({ where: { tenantId: scope.tenantId, submissionId: submission.id }, orderBy: { revision: 'desc' } });
      return {
        id: submission.id,
        assignment: this.toDto(assignment),
        learner: { name: learner.displayName, email: learner.email },
        status: submission.status,
        revisions: await Promise.all(revisions.map((revision) => this.revisionDto(revision))),
      };
    });
  }

  /** Records the decision on the latest revision: passed, not passed, or please revise. */
  grade(scope: TenantScope, user: AuthUser, submissionId: string, input: GradeInputDto): Promise<SubmissionDetailDto> {
    return this.run(scope, user, async (tx) => {
      const { submission, assignment } = await this.gradableSubmission(tx, scope, user, submissionId);
      if (submission.status !== 'SUBMITTED') throw Errors.conflict('This submission is not waiting for grading.');
      if (input.score != null && (assignment.maxPoints === null || input.score > assignment.maxPoints)) {
        throw invalid(assignment.maxPoints === null ? 'This assignment is not scored with points.' : `The score can be at most ${assignment.maxPoints}.`);
      }
      if (input.outcome === 'REVISION_REQUESTED' && !input.feedback?.trim()) throw invalid('Tell the learner what to revise.');
      const latest = await tx.submissionRevision.findFirstOrThrow({ where: { tenantId: scope.tenantId, submissionId: submission.id }, orderBy: { revision: 'desc' } });
      await tx.submissionRevision.update({
        where: { id: latest.id },
        data: { outcome: input.outcome, feedback: input.feedback?.trim() || null, score: input.score ?? null, gradedByUserId: user.userId, gradedAt: new Date() },
      });
      await tx.assignmentSubmission.update({ where: { id: submission.id }, data: { status: input.outcome } });
      await this.audit(tx, scope, user, 'assignment.graded', 'assignment_submission', submission.id, { outcome: input.outcome, revision: latest.revision });
      return this.submissionDetail(tx, scope, submission.id, assignment);
    });
  }

  // ---- Learners ------------------------------------------------------------------------------------

  /** Published and closed assignments of a course the caller can access, with their own status. */
  learnerList(scope: TenantScope, user: AuthUser, courseId: string): Promise<AssignmentDto[]> {
    return this.run(scope, user, async (tx) => {
      await this.assertCourseAccess(tx, scope, user, courseId);
      const assignments = await tx.assignment.findMany({
        where: { tenantId: scope.tenantId, courseId, status: { in: ['PUBLISHED', 'CLOSED'] } },
        include: { submissions: { where: { userId: user.userId }, select: { status: true, revisionCount: true } } },
        orderBy: { createdAt: 'asc' },
      });
      return assignments.map(({ submissions, ...assignment }) => ({ ...this.toDto(assignment), myStatus: submissions[0]?.status ?? null }));
    });
  }

  mine(scope: TenantScope, user: AuthUser, assignmentId: string): Promise<MySubmissionDto> {
    return this.run(scope, user, async (tx) => {
      const assignment = await this.learnerAssignment(tx, scope, user, assignmentId);
      const submission = await this.findMine(tx, scope, user, assignment.id);
      return this.mineDto(tx, scope, assignment, submission);
    });
  }

  saveDraft(scope: TenantScope, user: AuthUser, assignmentId: string, input: DraftInputDto): Promise<MySubmissionDto> {
    return this.editMine(scope, user, assignmentId, async (tx, _assignment, submission) => {
      const url = input.url === undefined ? undefined : input.url === null || input.url.trim() === '' ? null : safeSubmissionUrl(input.url);
      if (url === null && input.url && input.url.trim() !== '') throw invalid('Enter a link that starts with https://');
      await tx.assignmentSubmission.update({
        where: { id: submission.id },
        data: { ...(input.text !== undefined ? { draftText: input.text } : {}), ...(url !== undefined ? { draftUrl: url } : {}) },
      });
    });
  }

  /** Step 1 of a file upload: a signed URL for exactly this file; the draft changes only after the check. */
  async startUpload(scope: TenantScope, user: AuthUser, assignmentId: string, input: FileUploadDto): Promise<UploadTicketDto> {
    if (!this.storage.enabled) throw Errors.mediaUnavailable();
    let ticket: UploadTicketDto | undefined;
    await this.editMine(scope, user, assignmentId, async (tx, assignment, submission) => {
      if (!assignment.acceptFile) throw Errors.conflict('This assignment does not take files.');
      const problem = submissionFileProblem(input.contentType, input.sizeBytes, assignment.maxFileMb);
      if (problem) throw Errors.mediaInvalid(problem);
      const fileName = safeFileName(input.fileName);
      const key = `tenants/${scope.tenantId}/submissions/${submission.id}/${randomBytes(8).toString('hex')}/${fileName}`;
      await tx.assignmentSubmission.update({
        where: { id: submission.id },
        data: { pendingFileKey: key, pendingFileName: fileName, pendingType: input.contentType, pendingSizeBytes: BigInt(input.sizeBytes) },
      });
      ticket = { uploadUrl: await this.storage.presignUpload(key, input.contentType, input.sizeBytes), headers: { 'Content-Type': input.contentType } };
    });
    return ticket!;
  }

  /** Step 2: checks the stored file, then makes it the draft file (replacing any earlier draft file). */
  async finishUpload(scope: TenantScope, user: AuthUser, assignmentId: string): Promise<MySubmissionDto> {
    if (!this.storage.enabled) throw Errors.mediaUnavailable();
    let obsolete: string | null = null;
    const result = await this.editMine(scope, user, assignmentId, async (tx, _assignment, submission) => {
      if (!submission.pendingFileKey || !submission.pendingType || submission.pendingSizeBytes == null) throw Errors.mediaNotUploaded();
      const stored = await this.storage.head(submission.pendingFileKey);
      if (!stored) throw Errors.mediaNotUploaded();
      const clear = { pendingFileKey: null, pendingFileName: null, pendingType: null, pendingSizeBytes: null };
      const valid =
        stored.sizeBytes === Number(submission.pendingSizeBytes) &&
        submissionLooksLike(submission.pendingType, await this.storage.prefix(submission.pendingFileKey));
      if (!valid) {
        await this.storage.remove(submission.pendingFileKey).catch(() => undefined);
        await tx.assignmentSubmission.update({ where: { id: submission.id }, data: clear });
        throw Errors.mediaInvalid('This file does not match its type. Save it again as a PDF, Word, image, text, ZIP, or audio file.');
      }
      obsolete = submission.draftFileKey;
      await tx.assignmentSubmission.update({
        where: { id: submission.id },
        data: {
          ...clear,
          draftFileKey: submission.pendingFileKey,
          draftFileName: submission.pendingFileName,
          draftContentType: submission.pendingType,
          draftSizeBytes: submission.pendingSizeBytes,
        },
      });
    });
    if (obsolete) await this.storage.remove(obsolete).catch(() => undefined);
    return result;
  }

  async removeDraftFile(scope: TenantScope, user: AuthUser, assignmentId: string): Promise<MySubmissionDto> {
    let obsolete: string | null = null;
    const result = await this.editMine(scope, user, assignmentId, async (tx, _assignment, submission) => {
      obsolete = submission.draftFileKey;
      await tx.assignmentSubmission.update({
        where: { id: submission.id },
        data: { draftFileKey: null, draftFileName: null, draftContentType: null, draftSizeBytes: null },
      });
    });
    if (obsolete && this.storage.enabled) await this.storage.remove(obsolete).catch(() => undefined);
    return result;
  }

  /** Turns the draft into a new revision for the teacher (FR-ASSESS-503 deadline and late policy). */
  submit(scope: TenantScope, user: AuthUser, assignmentId: string): Promise<MySubmissionDto> {
    return this.editMine(scope, user, assignmentId, async (tx, assignment, submission) => {
      const now = new Date();
      const late = assignment.dueAt !== null && now > assignment.dueAt;
      if (late && !assignment.allowLate) throw Errors.conflict('The deadline has passed and this assignment does not accept late work.');
      const text = assignment.acceptText ? submission.draftText.trim() : '';
      const url = assignment.acceptUrl ? submission.draftUrl : null;
      const file = assignment.acceptFile ? submission.draftFileKey : null;
      if (!text && !url && !file) throw Errors.conflict('Add your answer, a link, or a file before submitting.');

      const revision = submission.revisionCount + 1;
      await tx.submissionRevision.create({
        data: {
          tenantId: scope.tenantId,
          submissionId: submission.id,
          userId: user.userId,
          revision,
          text,
          url,
          fileKey: file,
          fileName: file ? submission.draftFileName : null,
          contentType: file ? submission.draftContentType : null,
          sizeBytes: file ? submission.draftSizeBytes : null,
          submittedAt: now,
          late,
        },
      });
      // The draft starts from the submitted work, but the file now belongs to the revision.
      await tx.assignmentSubmission.update({
        where: { id: submission.id },
        data: {
          status: 'SUBMITTED',
          revisionCount: revision,
          lastSubmittedAt: now,
          draftFileKey: null,
          draftFileName: null,
          draftContentType: null,
          draftSizeBytes: null,
        },
      });
      await this.audit(tx, scope, user, 'assignment.submitted', 'assignment_submission', submission.id, { revision, late });
    });
  }

  // ---- Helpers -------------------------------------------------------------------------------------

  private run<T>(scope: TenantScope, user: AuthUser, work: (tx: Tx) => Promise<T>): Promise<T> {
    return this.db.run({ tenantId: scope.tenantId, userId: user.userId }, work);
  }

  private async ownedCourse(tx: Tx, scope: TenantScope, user: AuthUser, courseId: string) {
    if (!hasRole(scope.role, 'INSTRUCTOR')) throw Errors.forbidden();
    const course = await tx.course.findFirst({ where: { id: courseId, tenantId: scope.tenantId }, select: { id: true, createdByUserId: true } });
    if (!course) throw Errors.notFound('Course');
    if (!hasRole(scope.role, 'ADMIN') && course.createdByUserId !== user.userId) throw Errors.forbidden('You can manage assignments only in your own courses.');
    return course;
  }

  private async ownedAssignment(tx: Tx, scope: TenantScope, user: AuthUser, assignmentId: string): Promise<AssignmentRow> {
    const assignment = await tx.assignment.findFirst({ where: { id: assignmentId, tenantId: scope.tenantId } });
    if (!assignment) throw Errors.notFound('Assignment');
    await this.ownedCourse(tx, scope, user, assignment.courseId);
    return assignment;
  }

  private async gradableSubmission(tx: Tx, scope: TenantScope, user: AuthUser, submissionId: string) {
    const submission = await tx.assignmentSubmission.findFirst({ where: { id: submissionId, tenantId: scope.tenantId, revisionCount: { gt: 0 } } });
    if (!submission) throw Errors.notFound('Submission');
    const assignment = await this.ownedAssignment(tx, scope, user, submission.assignmentId);
    return { submission, assignment };
  }

  /** Learners need the course: an active entitlement, or teaching the course. */
  private async assertCourseAccess(tx: Tx, scope: TenantScope, user: AuthUser, courseId: string): Promise<void> {
    const course = await tx.course.findFirst({ where: { id: courseId, tenantId: scope.tenantId }, select: { id: true, createdByUserId: true } });
    if (!course) throw Errors.notFound('Course');
    const staff = hasRole(scope.role, 'ADMIN') || (hasRole(scope.role, 'INSTRUCTOR') && course.createdByUserId === user.userId);
    if (!staff && !(await hasActiveEntitlement(tx, scope.tenantId, user.userId, courseId))) throw Errors.notEntitled();
  }

  private async learnerAssignment(tx: Tx, scope: TenantScope, user: AuthUser, assignmentId: string): Promise<AssignmentRow> {
    const assignment = await tx.assignment.findFirst({ where: { id: assignmentId, tenantId: scope.tenantId, status: { in: ['PUBLISHED', 'CLOSED'] } } });
    if (!assignment) throw Errors.notFound('Assignment');
    await this.assertCourseAccess(tx, scope, user, assignment.courseId);
    return assignment;
  }

  private findMine(tx: Tx, scope: TenantScope, user: AuthUser, assignmentId: string) {
    return tx.assignmentSubmission.findUnique({ where: { tenantId_assignmentId_userId: { tenantId: scope.tenantId, assignmentId, userId: user.userId } } });
  }

  /** Runs a learner change on their own submission, creating it on first use; open assignments only. */
  private editMine(
    scope: TenantScope,
    user: AuthUser,
    assignmentId: string,
    work: (tx: Tx, assignment: AssignmentRow, submission: SubmissionRow) => Promise<void>,
  ): Promise<MySubmissionDto> {
    return this.run(scope, user, async (tx) => {
      const assignment = await this.learnerAssignment(tx, scope, user, assignmentId);
      if (assignment.status !== 'PUBLISHED') throw Errors.conflict('This assignment is closed.');
      const submission =
        (await this.findMine(tx, scope, user, assignment.id)) ??
        (await tx.assignmentSubmission.create({ data: { tenantId: scope.tenantId, assignmentId: assignment.id, userId: user.userId } }));
      if (!EDITABLE.has(submission.status)) {
        throw Errors.conflict(submission.status === 'SUBMITTED' ? 'Your work is waiting for the teacher. You can change it if a revision is requested.' : 'This assignment has been graded.');
      }
      await work(tx, assignment, submission);
      return this.mineDto(tx, scope, assignment, await this.findMine(tx, scope, user, assignment.id));
    });
  }

  private async mineDto(tx: Tx, scope: TenantScope, assignment: AssignmentRow, submission: SubmissionRow | null): Promise<MySubmissionDto> {
    const revisions = submission
      ? await tx.submissionRevision.findMany({ where: { tenantId: scope.tenantId, submissionId: submission.id }, orderBy: { revision: 'desc' } })
      : [];
    const status = submission?.status ?? 'DRAFT';
    return {
      assignment: this.toDto(assignment),
      status,
      canEdit: assignment.status === 'PUBLISHED' && EDITABLE.has(status),
      draft: {
        text: submission?.draftText ?? '',
        url: submission?.draftUrl ?? null,
        file: submission?.draftFileKey ? { name: submission.draftFileName ?? 'file', sizeBytes: Number(submission.draftSizeBytes ?? 0) } : null,
      },
      revisions: await Promise.all(revisions.map((revision) => this.revisionDto(revision))),
    };
  }

  private async submissionDetail(tx: Tx, scope: TenantScope, submissionId: string, assignment: AssignmentRow): Promise<SubmissionDetailDto> {
    const submission = await tx.assignmentSubmission.findUniqueOrThrow({ where: { id: submissionId }, include: { user: { select: { displayName: true, email: true } } } });
    const revisions = await tx.submissionRevision.findMany({ where: { tenantId: scope.tenantId, submissionId }, orderBy: { revision: 'desc' } });
    return {
      id: submission.id,
      assignment: this.toDto(assignment),
      learner: { name: submission.user.displayName, email: submission.user.email },
      status: submission.status,
      revisions: await Promise.all(revisions.map((revision) => this.revisionDto(revision))),
    };
  }

  private async revisionDto(revision: RevisionRow): Promise<RevisionDto> {
    return {
      revision: revision.revision,
      text: revision.text,
      url: revision.url,
      file: revision.fileKey
        ? {
            name: revision.fileName ?? 'file',
            sizeBytes: Number(revision.sizeBytes ?? 0),
            downloadUrl: this.storage.enabled ? await this.storage.presignDownload(revision.fileKey, revision.fileName ?? 'file') : null,
          }
        : null,
      submittedAt: revision.submittedAt,
      late: revision.late,
      outcome: revision.outcome,
      feedback: revision.feedback,
      score: revision.score,
      gradedAt: revision.gradedAt,
    };
  }

  private settings(input: AssignmentInputDto, creating: boolean) {
    const accepts = {
      acceptFile: input.acceptFile ?? (creating ? true : undefined),
      acceptUrl: input.acceptUrl ?? (creating ? false : undefined),
      acceptText: input.acceptText ?? (creating ? true : undefined),
    };
    if (accepts.acceptFile === false && accepts.acceptUrl === false && accepts.acceptText === false) {
      throw invalid('Accept at least one kind of answer: text, a link, or a file.');
    }
    return {
      title: input.title.trim(),
      ...(input.instructions !== undefined ? { instructions: input.instructions } : {}),
      ...(input.dueAt !== undefined ? { dueAt: input.dueAt ? new Date(input.dueAt) : null } : {}),
      ...(input.allowLate !== undefined ? { allowLate: input.allowLate } : {}),
      ...Object.fromEntries(Object.entries(accepts).filter(([, value]) => value !== undefined)),
      ...(input.maxFileMb !== undefined ? { maxFileMb: input.maxFileMb } : {}),
      ...(input.maxPoints !== undefined ? { maxPoints: input.maxPoints } : {}),
      ...(input.isRequired !== undefined ? { isRequired: input.isRequired } : {}),
    };
  }

  private toDto(assignment: AssignmentRow): AssignmentDto {
    return {
      id: assignment.id,
      courseId: assignment.courseId,
      title: assignment.title,
      instructions: assignment.instructions,
      status: assignment.status,
      dueAt: assignment.dueAt,
      allowLate: assignment.allowLate,
      acceptFile: assignment.acceptFile,
      acceptUrl: assignment.acceptUrl,
      acceptText: assignment.acceptText,
      maxFileMb: assignment.maxFileMb,
      maxPoints: assignment.maxPoints,
      isRequired: assignment.isRequired,
    };
  }

  private audit(tx: Tx, scope: TenantScope, user: AuthUser, action: string, targetType: string, targetId: string, metadata: Record<string, string | number | boolean> = {}) {
    return tx.auditEvent.create({ data: { tenantId: scope.tenantId, actorUserId: user.userId, action, targetType, targetId, metadata } });
  }
}
