import { Injectable } from '@nestjs/common';
import { randomInt } from 'node:crypto';
import { Errors } from '../common/errors';
import type { AuthUser, TenantScope } from '../common/request';
import { DatabaseContext, type Tx } from '../database/database-context.service';
import { Prisma } from '../generated/prisma/client';
import { hasActiveEntitlement } from '../learning/access';
import { hasRole } from '../tenancy/roles';
import type { CertificateDto, CourseProgressDto, VerificationDto } from './certificates.dto';

/** 31 characters without look-alikes (0/O, 1/I/L); 16 of them carry about 79 bits. */
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 16;
const CODE_PATTERN = /^[A-HJKMNP-Z2-9]{16}$/;

export function generateCertificateCode(random: (max: number) => number = randomInt): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i += 1) code += ALPHABET[random(ALPHABET.length)];
  return code;
}

/** Accepts the grouped display form (ABCD-EFGH-JKMN-PQRS) and lower case. */
export function normalizeCertificateCode(input: string): string | null {
  const code = input.toUpperCase().replace(/[\s-]/g, '');
  return CODE_PATTERN.test(code) ? code : null;
}

type CertificateRow = {
  id: string;
  courseId: string;
  code: string;
  holderName: string;
  courseTitle: string;
  instructorName: string | null;
  issuedAt: Date;
  revokedAt: Date | null;
  revokeReason: string | null;
};

const certificateSelect = {
  id: true,
  courseId: true,
  code: true,
  holderName: true,
  courseTitle: true,
  instructorName: true,
  issuedAt: true,
  revokedAt: true,
  revokeReason: true,
} satisfies Prisma.CertificateSelect;

const toDto = (certificate: CertificateRow, schoolName: string): CertificateDto => ({
  ...certificate,
  schoolName,
  status: certificate.revokedAt ? 'REVOKED' : 'VALID',
});

/**
 * Lesson completion, the course completion rule, and certificates (FR-PLAYER-402, FR-CERT-601/602).
 *
 * A course is complete when every required lesson of the published version is complete (text lessons by the
 * learner's confirmation, video and audio lessons once 90% has been played), every approved mock exam has a
 * passing result, and every required published assignment is graded PASSED. Practice quizzes never block
 * completion. The certificate is issued the first time the rule holds and is returned unchanged afterwards.
 */
@Injectable()
export class CertificatesService {
  constructor(private readonly db: DatabaseContext) {}

  /** Records that the learner finished a text lesson they can open. Repeating it changes nothing. */
  async completeLesson(scope: TenantScope, user: AuthUser, courseId: string, lessonId: string): Promise<CourseProgressDto> {
    const ctx = { tenantId: scope.tenantId, userId: user.userId };
    await this.db.run(ctx, async (tx) => {
      const lesson = await this.publishedLesson(tx, scope.tenantId, courseId, lessonId);
      if (!(await hasActiveEntitlement(tx, scope.tenantId, user.userId, courseId))) throw Errors.notEntitled();
      // Uploaded video and audio complete by playing them; text, documents, and YouTube or Drive lessons,
      // whose players Oxinov cannot observe, are marked complete by the learner (ADR-028 point 6).
      if (!completedByHand(lesson)) {
        throw Errors.conflict('Video and audio lessons are completed by playing them.');
      }
      await tx.lessonCompletion.createMany({
        data: [{ tenantId: scope.tenantId, userId: user.userId, courseId, lessonLineageId: lesson.lineageId }],
        skipDuplicates: true,
      });
    });
    return this.progress(scope, user, courseId);
  }

  /** Progress against the completion rule; issues the certificate when the rule first holds. */
  async progress(scope: TenantScope, user: AuthUser, courseId: string): Promise<CourseProgressDto> {
    const ctx = { tenantId: scope.tenantId, userId: user.userId };
    const result = await this.db.run(ctx, async (tx) => {
      if (!(await hasActiveEntitlement(tx, scope.tenantId, user.userId, courseId))) throw Errors.notEntitled();
      const progress = await this.evaluate(tx, scope.tenantId, user.userId, courseId);
      const existing = await tx.certificate.findFirst({
        where: { tenantId: scope.tenantId, userId: user.userId, courseId },
        select: certificateSelect,
      });
      return { progress, existing };
    });
    if (result.existing || !result.progress.complete) {
      const school = await this.schoolName(scope.tenantId, user.userId);
      return { ...result.progress, certificate: result.existing ? toDto(result.existing, school) : null };
    }
    return { ...result.progress, certificate: await this.issue(scope, user, courseId) };
  }

  async mine(scope: TenantScope, user: AuthUser): Promise<CertificateDto[]> {
    return this.db.run({ tenantId: scope.tenantId, userId: user.userId }, async (tx) => {
      const [rows, school] = await Promise.all([
        tx.certificate.findMany({
          where: { tenantId: scope.tenantId, userId: user.userId },
          orderBy: { issuedAt: 'desc' },
          select: certificateSelect,
        }),
        this.tenantName(tx, scope.tenantId),
      ]);
      return rows.map((row) => toDto(row, school));
    });
  }

  /** A certificate of the caller's, or any in the school for its administrators. */
  async byCode(scope: TenantScope, user: AuthUser, rawCode: string): Promise<CertificateDto> {
    const code = normalizeCertificateCode(rawCode);
    if (!code) throw Errors.notFound('Certificate');
    return this.db.run({ tenantId: scope.tenantId, userId: user.userId }, async (tx) => {
      const row = await tx.certificate.findFirst({
        where: { tenantId: scope.tenantId, code, ...(hasRole(scope.role, 'ADMIN') ? {} : { userId: user.userId }) },
        select: certificateSelect,
      });
      if (!row) throw Errors.notFound('Certificate');
      return toDto(row, await this.tenantName(tx, scope.tenantId));
    });
  }

  /** Administrators list a course's certificates to find one to revoke. */
  async forCourse(scope: TenantScope, user: AuthUser, courseId: string): Promise<CertificateDto[]> {
    if (!hasRole(scope.role, 'ADMIN')) throw Errors.forbidden('Only school administrators can list certificates.');
    return this.db.run({ tenantId: scope.tenantId, userId: user.userId }, async (tx) => {
      const [rows, school] = await Promise.all([
        tx.certificate.findMany({ where: { tenantId: scope.tenantId, courseId }, orderBy: { issuedAt: 'desc' }, select: certificateSelect }),
        this.tenantName(tx, scope.tenantId),
      ]);
      return rows.map((row) => toDto(row, school));
    });
  }

  /** FR-CERT-602: administrators revoke with a recorded reason; verification shows it at once. */
  async revoke(scope: TenantScope, user: AuthUser, rawCode: string, reason: string): Promise<CertificateDto> {
    if (!hasRole(scope.role, 'ADMIN')) throw Errors.forbidden('Only school administrators can revoke certificates.');
    const code = normalizeCertificateCode(rawCode);
    if (!code) throw Errors.notFound('Certificate');
    return this.db.run({ tenantId: scope.tenantId, userId: user.userId }, async (tx) => {
      const row = await tx.certificate.findFirst({ where: { tenantId: scope.tenantId, code }, select: certificateSelect });
      if (!row) throw Errors.notFound('Certificate');
      if (row.revokedAt) return toDto(row, await this.tenantName(tx, scope.tenantId));
      const now = new Date();
      const updated = await tx.certificate.update({
        where: { id: row.id },
        data: { revokedAt: now, revokeReason: reason, revokedByUserId: user.userId },
        select: certificateSelect,
      });
      await tx.certificateVerification.update({ where: { code }, data: { revokedAt: now } });
      await tx.auditEvent.create({
        data: {
          tenantId: scope.tenantId,
          actorUserId: user.userId,
          action: 'certificate.revoked',
          targetType: 'certificate',
          targetId: row.id,
          metadata: { courseId: row.courseId, reason },
        },
      });
      return toDto(updated, await this.tenantName(tx, scope.tenantId));
    });
  }

  /** Public verification: only holder name, course, school, issue date, and validity (FR-CERT-602). */
  async verify(rawCode: string): Promise<VerificationDto> {
    const code = normalizeCertificateCode(rawCode);
    if (!code) throw Errors.notFound('Certificate');
    const row = await this.db.run({}, (tx) => tx.certificateVerification.findUnique({ where: { code } }));
    if (!row) throw Errors.notFound('Certificate');
    return {
      code: row.code,
      holderName: row.holderName,
      courseTitle: row.courseTitle,
      schoolName: row.schoolName,
      issuedAt: row.issuedAt,
      status: row.revokedAt ? 'REVOKED' : 'VALID',
    };
  }

  private async issue(scope: TenantScope, user: AuthUser, courseId: string, attempt = 0): Promise<CertificateDto> {
    const ctx = { tenantId: scope.tenantId, userId: user.userId };
    try {
      return await this.db.run(ctx, async (tx) => {
        // Re-check inside the issuing transaction; a concurrent request may have issued it already.
        const existing = await tx.certificate.findFirst({
          where: { tenantId: scope.tenantId, userId: user.userId, courseId },
          select: certificateSelect,
        });
        const school = await this.tenantName(tx, scope.tenantId);
        if (existing) return toDto(existing, school);
        const course = await tx.course.findFirstOrThrow({
          where: { id: courseId, tenantId: scope.tenantId },
          select: { createdBy: { select: { displayName: true } }, publishedVersion: { select: { title: true } } },
        });
        const holder = await tx.userProfile.findUniqueOrThrow({ where: { id: user.userId }, select: { displayName: true } });
        const created = await tx.certificate.create({
          data: {
            tenantId: scope.tenantId,
            userId: user.userId,
            courseId,
            code: generateCertificateCode(),
            holderName: (holder.displayName?.trim() || 'Oxinov learner').slice(0, 120),
            courseTitle: (course.publishedVersion?.title ?? 'Course').slice(0, 200),
            instructorName: course.createdBy.displayName?.trim().slice(0, 120) || null,
          },
          select: certificateSelect,
        });
        await tx.certificateVerification.create({
          data: {
            code: created.code,
            holderName: created.holderName,
            courseTitle: created.courseTitle,
            schoolName: school.slice(0, 120),
            issuedAt: created.issuedAt,
          },
        });
        await tx.auditEvent.create({
          data: {
            tenantId: scope.tenantId,
            actorUserId: user.userId,
            action: 'certificate.issued',
            targetType: 'certificate',
            targetId: created.id,
            metadata: { courseId },
          },
        });
        return toDto(created, school);
      });
    } catch (error) {
      // A concurrent request issued it first (one per learner and course), or a code collision: try again.
      if (attempt < 3 && error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return this.issue(scope, user, courseId, attempt + 1);
      }
      throw error;
    }
  }

  private async evaluate(tx: Tx, tenantId: string, userId: string, courseId: string) {
    const course = await tx.course.findFirst({
      where: { id: courseId, tenantId, status: 'PUBLISHED' },
      select: {
        publishedVersion: {
          select: { sections: { select: { lessons: { select: { id: true, title: true, kind: true, isRequired: true, lineageId: true, mediaAssetId: true, externalSource: true } } } } },
        },
      },
    });
    if (!course?.publishedVersion) throw Errors.notFound('Course');
    const lessons = course.publishedVersion.sections.flatMap((section) => section.lessons);

    const [completions, media, exams, assignments] = await Promise.all([
      tx.lessonCompletion.findMany({ where: { tenantId, userId, courseId }, select: { lessonLineageId: true } }),
      tx.mediaProgress.findMany({
        where: { tenantId, userId, completedAt: { not: null }, mediaAssetId: { in: lessons.flatMap((l) => (l.mediaAssetId ? [l.mediaAssetId] : [])) } },
        select: { mediaAssetId: true },
      }),
      tx.examBlueprint.findMany({
        where: { tenantId, courseId, kind: 'MOCK', status: 'APPROVED' },
        select: {
          id: true,
          title: true,
          attempts: { where: { userId }, select: { results: { orderBy: { revision: 'desc' }, take: 1, select: { passed: true } } } },
        },
      }),
      tx.assignment.findMany({
        where: { tenantId, courseId, isRequired: true, status: { in: ['PUBLISHED', 'CLOSED'] } },
        select: { id: true, title: true, submissions: { where: { userId }, select: { status: true } } },
      }),
    ]);
    const doneLineages = new Set(completions.map((c) => c.lessonLineageId));
    const doneMedia = new Set(media.map((m) => m.mediaAssetId));
    const lessonDone = (lesson: (typeof lessons)[number]) =>
      completedByHand(lesson) ? doneLineages.has(lesson.lineageId) : lesson.mediaAssetId !== null && doneMedia.has(lesson.mediaAssetId);

    const lessonItems = lessons.map((lesson) => ({ id: lesson.id, title: lesson.title, kind: lesson.kind, required: lesson.isRequired, completed: lessonDone(lesson) }));
    const examItems = exams.map((exam) => ({ id: exam.id, title: exam.title, passed: exam.attempts.some((a) => a.results[0]?.passed === true) }));
    const assignmentItems = assignments.map((a) => ({ id: a.id, title: a.title, passed: a.submissions.some((s) => s.status === 'PASSED') }));
    const required = lessonItems.filter((l) => l.required);
    const complete =
      required.every((l) => l.completed) && examItems.every((e) => e.passed) && assignmentItems.every((a) => a.passed) && lessons.length > 0;
    return {
      courseId,
      complete,
      requiredLessons: required.length,
      completedRequiredLessons: required.filter((l) => l.completed).length,
      lessons: lessonItems,
      exams: examItems,
      assignments: assignmentItems,
    };
  }

  private async publishedLesson(tx: Tx, tenantId: string, courseId: string, lessonId: string) {
    const course = await tx.course.findFirst({
      where: { id: courseId, tenantId, status: 'PUBLISHED' },
      select: { publishedVersionId: true },
    });
    if (!course?.publishedVersionId) throw Errors.notFound('Course');
    const lesson = await tx.lesson.findFirst({
      where: { id: lessonId, tenantId, section: { courseVersionId: course.publishedVersionId } },
      select: { kind: true, lineageId: true, externalSource: true },
    });
    if (!lesson) throw Errors.notFound('Lesson');
    return lesson;
  }

  private async schoolName(tenantId: string, userId: string): Promise<string> {
    return this.db.run({ tenantId, userId }, (tx) => this.tenantName(tx, tenantId));
  }

  private async tenantName(tx: Tx, tenantId: string): Promise<string> {
    const tenant = await tx.tenant.findUnique({ where: { id: tenantId }, select: { name: true } });
    return tenant?.name ?? 'Oxinov';
  }
}

/**
 * Text and document lessons, and lessons played from YouTube or Google Drive (whose playback Oxinov cannot
 * observe), are marked complete by the learner; Oxinov-hosted video and audio complete by playing them.
 */
function completedByHand(lesson: { kind: string; externalSource: string | null }): boolean {
  return lesson.kind === 'TEXT' || lesson.kind === 'DOCUMENT' || lesson.externalSource !== null;
}
