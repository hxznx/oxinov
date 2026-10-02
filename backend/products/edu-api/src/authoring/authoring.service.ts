import { Injectable } from '@nestjs/common';
import { randomBytes, randomUUID } from 'node:crypto';
import { DomainError, Errors } from '../common/errors';
import type { AuthUser, TenantScope } from '../common/request';
import { DatabaseContext, type Tx } from '../database/database-context.service';
import { safeFileName } from '../media/media-rules';
import { ObjectStorage } from '../media/object-storage';
import { hasRole } from '../tenancy/roles';
import { parseBulkLinks } from './bulk-links';
import { authorUrl, parseExternal, sourceProblem, type ExternalRef } from './external-content';
import { resourceFileProblem, resourceLooksLike } from './resource-files';
import type {
  AuthoredCourseDto,
  BulkLessonsDto,
  BulkLessonsResultDto,
  CreateLessonDto,
  DraftDto,
  ReorderDto,
  ResourceInputDto,
  ResourceUploadDto,
  ResourceUploadTicketDto,
  DuplicateCourseDto,
  DuplicatedCourseDto,
  UpdateDraftDto,
  UpdateLessonDto,
} from './authoring.dto';

type EditableCourse = { id: string; createdByUserId: string; status: string; priceMinor: number; currency: string; publishedVersionId: string | null };
type DraftVersion = { id: string; status: string; version: number };

const courseSelect = { id: true, createdByUserId: true, status: true, priceMinor: true, currency: true, publishedVersionId: true } as const;

const invalidResource = (message: string) => new DomainError('VALIDATION_FAILED', 400, message);

const invalidOrder = () =>
  new DomainError('VALIDATION_FAILED', 400, 'The new order must list every chapter and lesson of the draft exactly once.');

/**
 * Course authoring (FR-COURSE-201/203). Authors change a separate draft version while learners keep the
 * published one. Instructors edit only their own courses; administrators edit, approve, and reject any
 * course in their tenant. Approval swaps the published version in one transaction.
 */
@Injectable()
export class AuthoringService {
  constructor(
    private readonly db: DatabaseContext,
    private readonly storage: ObjectStorage,
  ) {}

  /** Courses the caller may edit, with the state of any open draft. */
  listCourses(scope: TenantScope, user: AuthUser): Promise<AuthoredCourseDto[]> {
    const admin = hasRole(scope.role, 'ADMIN');
    return this.db.run(this.ctx(scope, user), async (tx) => {
      const courses = await tx.course.findMany({
        where: { tenantId: scope.tenantId, ...(admin ? {} : { createdByUserId: user.userId }) },
        select: {
          id: true,
          status: true,
          createdByUserId: true,
          updatedAt: true,
          versions: { orderBy: { version: 'desc' }, take: 1, select: { title: true, status: true, updatedAt: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: 200,
      });
      return courses.map((course) => {
        const latest = course.versions[0];
        const open = latest && (latest.status === 'DRAFT' || latest.status === 'IN_REVIEW');
        return {
          courseId: course.id,
          title: latest?.title ?? 'Untitled course',
          courseStatus: course.status,
          draftStatus: open ? latest.status : null,
          mine: course.createdByUserId === user.userId,
          updatedAt: latest && latest.updatedAt > course.updatedAt ? latest.updatedAt : course.updatedAt,
        };
      });
    });
  }

  getDraft(scope: TenantScope, user: AuthUser, courseId: string): Promise<DraftDto> {
    return this.db.run(this.ctx(scope, user), async (tx) => {
      const course = await this.editableCourse(tx, scope, user, courseId);
      const draft = await this.openDraft(tx, scope.tenantId, courseId);
      if (!draft) throw Errors.notFound('Draft');
      return this.view(tx, scope, course, draft.id);
    });
  }

  /** Opens the course for editing: returns the open draft, or copies the published version into a new one. */
  startDraft(scope: TenantScope, user: AuthUser, courseId: string): Promise<{ draft: DraftDto; created: boolean }> {
    return this.db.run(this.ctx(scope, user), async (tx) => {
      const course = await this.editableCourse(tx, scope, user, courseId);
      const existing = await this.openDraft(tx, scope.tenantId, courseId);
      if (existing) return { draft: await this.view(tx, scope, course, existing.id), created: false };

      const source = await tx.courseVersion.findFirst({
        where: { tenantId: scope.tenantId, courseId, ...(course.publishedVersionId ? { id: course.publishedVersionId } : {}) },
        orderBy: { version: 'desc' },
        include: {
          sections: { orderBy: { position: 'asc' }, include: { lessons: { orderBy: { position: 'asc' }, include: { resources: true } } } },
        },
      });
      if (!source) throw Errors.notFound('Course');
      const latest = await tx.courseVersion.aggregate({ where: { tenantId: scope.tenantId, courseId }, _max: { version: true } });

      const draft = await tx.courseVersion.create({
        data: {
          tenantId: scope.tenantId,
          courseId,
          version: (latest._max.version ?? 0) + 1,
          status: 'DRAFT',
          title: source.title,
          summary: source.summary,
          description: source.description,
          language: source.language,
          outcomes: source.outcomes,
        },
      });
      for (const section of source.sections) {
        const copy = await tx.section.create({
          data: { tenantId: scope.tenantId, courseVersionId: draft.id, title: section.title, position: section.position },
        });
        if (section.lessons.length > 0) {
          const copies = section.lessons.map((lesson) => ({ lesson, id: randomUUID() }));
          await tx.lesson.createMany({
            data: copies.map(({ lesson, id }) => ({
              id,
              tenantId: scope.tenantId,
              sectionId: copy.id,
              title: lesson.title,
              kind: lesson.kind,
              position: lesson.position,
              bodyMarkdown: lesson.bodyMarkdown,
              isPreview: lesson.isPreview,
              isRequired: lesson.isRequired,
              durationSec: lesson.durationSec,
              mediaAssetId: lesson.mediaAssetId,
              externalSource: lesson.externalSource,
              externalId: lesson.externalId,
              // Same lesson in a new version: learner notes follow it.
              lineageId: lesson.lineageId,
            })),
          });
          const resources = copies.flatMap(({ lesson, id }) =>
            lesson.resources.map((resource) => ({
              tenantId: scope.tenantId,
              lessonId: id,
              kind: resource.kind,
              title: resource.title,
              resourceFileId: resource.resourceFileId,
              url: resource.url,
              position: resource.position,
            })),
          );
          if (resources.length > 0) await tx.lessonResource.createMany({ data: resources });
        }
      }
      await this.audit(tx, scope, user, 'course.draft.started', courseId, { version: draft.version });
      return { draft: await this.view(tx, scope, course, draft.id), created: true };
    });
  }

  updateDraft(scope: TenantScope, user: AuthUser, courseId: string, input: UpdateDraftDto): Promise<DraftDto> {
    return this.edit(scope, user, courseId, async (tx, course, draft) => {
      const { priceMinor, currency, ...details } = input;
      if (Object.keys(details).length > 0) await tx.courseVersion.update({ where: { id: draft.id }, data: details });
      if (priceMinor !== undefined || currency !== undefined) {
        await tx.course.update({
          where: { id: course.id },
          data: { ...(priceMinor !== undefined ? { priceMinor } : {}), ...(currency !== undefined ? { currency } : {}) },
        });
      }
    });
  }

  addSection(scope: TenantScope, user: AuthUser, courseId: string, title: string): Promise<DraftDto> {
    return this.edit(scope, user, courseId, async (tx, _course, draft) => {
      const last = await tx.section.aggregate({ where: { tenantId: scope.tenantId, courseVersionId: draft.id }, _max: { position: true } });
      await tx.section.create({
        data: { tenantId: scope.tenantId, courseVersionId: draft.id, title, position: (last._max.position ?? 0) + 1 },
      });
    });
  }

  renameSection(scope: TenantScope, user: AuthUser, courseId: string, sectionId: string, title: string): Promise<DraftDto> {
    return this.edit(scope, user, courseId, async (tx, _course, draft) => {
      await this.draftSection(tx, scope.tenantId, draft.id, sectionId);
      await tx.section.update({ where: { id: sectionId }, data: { title } });
    });
  }

  /** Removes a chapter and its lessons from the draft; the published version is untouched. */
  deleteSection(scope: TenantScope, user: AuthUser, courseId: string, sectionId: string): Promise<DraftDto> {
    return this.edit(scope, user, courseId, async (tx, _course, draft) => {
      await this.draftSection(tx, scope.tenantId, draft.id, sectionId);
      await tx.lesson.deleteMany({ where: { tenantId: scope.tenantId, sectionId } });
      await tx.section.delete({ where: { id: sectionId } });
      const rest = await tx.section.findMany({ where: { tenantId: scope.tenantId, courseVersionId: draft.id }, orderBy: { position: 'asc' }, select: { id: true } });
      await this.renumber(tx, 'section', rest.map((section) => section.id));
    });
  }

  addLesson(scope: TenantScope, user: AuthUser, courseId: string, sectionId: string, input: CreateLessonDto): Promise<DraftDto> {
    return this.edit(scope, user, courseId, async (tx, _course, draft) => {
      await this.draftSection(tx, scope.tenantId, draft.id, sectionId);
      const kind = input.kind ?? 'TEXT';
      if (input.mediaId && input.externalUrl) throw Errors.contentLinkInvalid('Choose an uploaded file or a YouTube or Drive link, not both.');
      if (input.mediaId) await this.readyMedia(tx, scope.tenantId, input.mediaId, kind);
      const external = input.externalUrl ? externalFor(kind, input.externalUrl) : null;
      const last = await tx.lesson.aggregate({ where: { tenantId: scope.tenantId, sectionId }, _max: { position: true } });
      await tx.lesson.create({
        data: {
          tenantId: scope.tenantId,
          sectionId,
          title: input.title,
          kind,
          mediaAssetId: input.mediaId ?? null,
          externalSource: external?.source ?? null,
          externalId: external?.id ?? null,
          position: (last._max.position ?? 0) + 1,
          bodyMarkdown: input.bodyMarkdown ?? '',
          isPreview: input.isPreview ?? false,
          isRequired: input.isRequired ?? true,
          durationSec: input.durationSec ?? null,
        },
      });
    });
  }

  /**
   * Pasted links become lessons at the end of a chapter, in order (FR-COURSE-209). Lines without a YouTube or
   * Google Drive link are refused with their reason; the valid ones are still created.
   */
  async addLessonsFromLinks(scope: TenantScope, user: AuthUser, courseId: string, sectionId: string, input: BulkLessonsDto): Promise<BulkLessonsResultDto> {
    let created = 0;
    let refused: BulkLessonsResultDto['refused'] = [];
    const draft = await this.edit(scope, user, courseId, async (tx, _course, current) => {
      await this.draftSection(tx, scope.tenantId, current.id, sectionId);
      const last = await tx.lesson.aggregate({ where: { tenantId: scope.tenantId, sectionId }, _max: { position: true } });
      const count = await tx.lesson.count({ where: { tenantId: scope.tenantId, section: { courseVersionId: current.id } } });
      const parsed = parseBulkLinks(input.text, input.driveKind ?? 'DOCUMENT', count + 1);
      refused = parsed.refused;
      const start = last._max.position ?? 0;
      if (parsed.lessons.length > 0) {
        await tx.lesson.createMany({
          data: parsed.lessons.map((lesson, index) => ({
            tenantId: scope.tenantId,
            sectionId,
            title: lesson.title,
            kind: lesson.kind,
            externalSource: lesson.external.source,
            externalId: lesson.external.id,
            position: start + index + 1,
          })),
        });
      }
      created = parsed.lessons.length;
      await this.audit(tx, scope, user, 'course.lessons.pasted', courseId, { created, refused: refused.length });
    });
    return { draft, created, refused };
  }

  /**
   * A copy of an offering to start a new one from (FR-COURSE-209): a new DRAFT course with the same chapters,
   * lessons, materials, kind, and category, and none of the original's learners, payments, reviews,
   * certificates, or plans. Copies the open draft when there is one, otherwise the published version.
   */
  duplicate(scope: TenantScope, user: AuthUser, courseId: string, input: DuplicateCourseDto): Promise<DuplicatedCourseDto> {
    return this.db.run(this.ctx(scope, user), async (tx) => {
      const course = await this.editableCourse(tx, scope, user, courseId);
      const original = await tx.course.findUniqueOrThrow({ where: { id: course.id }, select: { slug: true, programId: true, kind: true, category: true } });
      const open = await this.openDraft(tx, scope.tenantId, courseId);
      const source = await tx.courseVersion.findFirst({
        where: { tenantId: scope.tenantId, courseId, ...(open ? { id: open.id } : course.publishedVersionId ? { id: course.publishedVersionId } : {}) },
        orderBy: { version: 'desc' },
        include: { sections: { orderBy: { position: 'asc' }, include: { lessons: { orderBy: { position: 'asc' }, include: { resources: true } } } } },
      });
      if (!source) throw Errors.notFound('Course');
      const slug = await this.freeSlug(tx, scope.tenantId, `${original.slug.slice(0, 100)}-copy`);
      const title = (input.title?.trim() || `${source.title} (copy)`).slice(0, 200);
      const copy = await tx.course.create({
        data: {
          tenantId: scope.tenantId,
          programId: original.programId,
          slug,
          priceMinor: course.priceMinor,
          currency: course.currency,
          kind: original.kind,
          category: original.category,
          createdByUserId: user.userId,
        },
      });
      const version = await tx.courseVersion.create({
        data: {
          tenantId: scope.tenantId,
          courseId: copy.id,
          version: 1,
          title,
          summary: source.summary,
          description: source.description,
          language: source.language,
          outcomes: source.outcomes,
        },
      });
      for (const section of source.sections) {
        const newSection = await tx.section.create({ data: { tenantId: scope.tenantId, courseVersionId: version.id, title: section.title, position: section.position } });
        for (const lesson of section.lessons) {
          // A new offering: new lesson identities, so nothing from the original's learners follows.
          const newLesson = await tx.lesson.create({
            data: {
              tenantId: scope.tenantId,
              sectionId: newSection.id,
              title: lesson.title,
              kind: lesson.kind,
              position: lesson.position,
              bodyMarkdown: lesson.bodyMarkdown,
              isPreview: lesson.isPreview,
              isRequired: lesson.isRequired,
              durationSec: lesson.durationSec,
              mediaAssetId: lesson.mediaAssetId,
              externalSource: lesson.externalSource,
              externalId: lesson.externalId,
            },
          });
          if (lesson.resources.length > 0) {
            await tx.lessonResource.createMany({
              data: lesson.resources.map((resource) => ({
                tenantId: scope.tenantId,
                lessonId: newLesson.id,
                kind: resource.kind,
                title: resource.title,
                resourceFileId: resource.resourceFileId,
                url: resource.url,
                position: resource.position,
              })),
            });
          }
        }
      }
      await tx.auditEvent.create({
        data: { tenantId: scope.tenantId, actorUserId: user.userId, action: 'course.duplicated', targetType: 'course', targetId: copy.id, metadata: { from: courseId } },
      });
      return { courseId: copy.id, slug, title };
    });
  }

  updateLesson(scope: TenantScope, user: AuthUser, courseId: string, lessonId: string, input: UpdateLessonDto): Promise<DraftDto> {
    return this.edit(scope, user, courseId, async (tx, _course, draft) => {
      const lesson = await this.draftLesson(tx, scope.tenantId, draft.id, lessonId);
      const { mediaId, externalUrl, ...fields } = input;
      if (mediaId && externalUrl) throw Errors.contentLinkInvalid('Choose an uploaded file or a YouTube or Drive link, not both.');
      if (mediaId) await this.readyMedia(tx, scope.tenantId, mediaId, lesson.kind);
      const external = externalUrl ? externalFor(lesson.kind, externalUrl) : null;
      await tx.lesson.update({
        where: { id: lessonId },
        data: {
          ...fields,
          ...(mediaId !== undefined ? { mediaAssetId: mediaId } : {}),
          // A link replaces an uploaded file and an uploaded file replaces a link (one source per lesson).
          ...(mediaId ? { externalSource: null, externalId: null } : {}),
          ...(externalUrl !== undefined ? { externalSource: external?.source ?? null, externalId: external?.id ?? null } : {}),
          ...(external ? { mediaAssetId: null } : {}),
        },
      });
    });
  }

  deleteLesson(scope: TenantScope, user: AuthUser, courseId: string, lessonId: string): Promise<DraftDto> {
    return this.edit(scope, user, courseId, async (tx, _course, draft) => {
      const lesson = await this.draftLesson(tx, scope.tenantId, draft.id, lessonId);
      await tx.lesson.delete({ where: { id: lessonId } });
      const rest = await tx.lesson.findMany({ where: { tenantId: scope.tenantId, sectionId: lesson.sectionId }, orderBy: { position: 'asc' }, select: { id: true } });
      await this.renumber(tx, 'lesson', rest.map((item) => item.id));
    });
  }

  /** Applies a complete new order of chapters and lessons; lessons may move between chapters. */
  reorder(scope: TenantScope, user: AuthUser, courseId: string, input: ReorderDto): Promise<DraftDto> {
    return this.edit(scope, user, courseId, async (tx, _course, draft) => {
      const sections = await tx.section.findMany({
        where: { tenantId: scope.tenantId, courseVersionId: draft.id },
        select: { id: true, lessons: { select: { id: true } } },
      });
      const sectionIds = new Set(sections.map((section) => section.id));
      const lessonIds = new Set(sections.flatMap((section) => section.lessons.map((lesson) => lesson.id)));
      const wantedSections = input.sections.map((section) => section.id);
      const wantedLessons = input.sections.flatMap((section) => section.lessonIds);
      const sameSet = (wanted: string[], actual: Set<string>) =>
        wanted.length === actual.size && new Set(wanted).size === wanted.length && wanted.every((id) => actual.has(id));
      if (!sameSet(wantedSections, sectionIds) || !sameSet(wantedLessons, lessonIds)) throw invalidOrder();

      // Positions are unique per chapter, so move everything to temporary negative slots first.
      await this.park(tx, 'section', wantedSections);
      await this.park(tx, 'lesson', wantedLessons);
      for (const [index, section] of input.sections.entries()) {
        await tx.section.update({ where: { id: section.id }, data: { position: index + 1 } });
        for (const [lessonIndex, lessonId] of section.lessonIds.entries()) {
          await tx.lesson.update({ where: { id: lessonId }, data: { sectionId: section.id, position: lessonIndex + 1 } });
        }
      }
    });
  }

  /** Sends the draft for review (FR-COURSE-201: every chapter needs a lesson). */
  submit(scope: TenantScope, user: AuthUser, courseId: string): Promise<DraftDto> {
    return this.edit(scope, user, courseId, async (tx, _course, draft) => {
      await this.assertComplete(tx, scope.tenantId, draft.id);
      await tx.courseVersion.update({ where: { id: draft.id }, data: { status: 'IN_REVIEW', submittedAt: new Date(), reviewFeedback: null } });
      await this.audit(tx, scope, user, 'course.review.submitted', courseId, { version: draft.version });
    });
  }

  /** Takes a submitted draft back to make more changes. */
  withdraw(scope: TenantScope, user: AuthUser, courseId: string): Promise<DraftDto> {
    return this.db.run(this.ctx(scope, user), async (tx) => {
      const course = await this.editableCourse(tx, scope, user, courseId);
      const draft = await this.openDraft(tx, scope.tenantId, courseId);
      if (!draft) throw Errors.notFound('Draft');
      if (draft.status !== 'IN_REVIEW') throw Errors.conflict('This draft is not waiting for review.');
      await tx.courseVersion.update({ where: { id: draft.id }, data: { status: 'DRAFT' } });
      return this.view(tx, scope, course, draft.id);
    });
  }

  /** Publishes the draft: it becomes what learners see, and the previous version is kept as superseded. */
  approve(scope: TenantScope, user: AuthUser, courseId: string): Promise<DraftDto> {
    return this.db.run(this.ctx(scope, user), async (tx) => {
      const course = await this.editableCourse(tx, scope, user, courseId);
      const draft = await this.openDraft(tx, scope.tenantId, courseId);
      if (!draft) throw Errors.notFound('Draft');
      await this.assertComplete(tx, scope.tenantId, draft.id);
      const now = new Date();
      if (course.publishedVersionId) {
        await tx.courseVersion.update({ where: { id: course.publishedVersionId }, data: { status: 'SUPERSEDED' } });
      }
      await tx.courseVersion.update({ where: { id: draft.id }, data: { status: 'PUBLISHED', publishedAt: now, reviewFeedback: null } });
      await tx.course.update({ where: { id: course.id }, data: { publishedVersionId: draft.id, status: 'PUBLISHED' } });
      await this.audit(tx, scope, user, 'course.published', courseId, { version: draft.version });
      return this.publishedView(tx, scope, course.id, draft.id);
    });
  }

  reject(scope: TenantScope, user: AuthUser, courseId: string, reason: string): Promise<DraftDto> {
    return this.db.run(this.ctx(scope, user), async (tx) => {
      const course = await this.editableCourse(tx, scope, user, courseId);
      const draft = await this.openDraft(tx, scope.tenantId, courseId);
      if (!draft || draft.status !== 'IN_REVIEW') throw Errors.conflict('Only a draft waiting for review can be sent back.');
      await tx.courseVersion.update({ where: { id: draft.id }, data: { status: 'DRAFT', reviewFeedback: reason } });
      await this.audit(tx, scope, user, 'course.review.rejected', courseId, { version: draft.version }, reason);
      return this.view(tx, scope, course, draft.id);
    });
  }

  /** Step 1 of attaching a document: a signed upload URL for exactly this file (FR-COURSE-202). */
  async startResourceUpload(scope: TenantScope, user: AuthUser, courseId: string, input: ResourceUploadDto): Promise<ResourceUploadTicketDto> {
    if (!this.storage.enabled) throw Errors.mediaUnavailable();
    const problem = resourceFileProblem(input.contentType, input.sizeBytes);
    if (problem) throw Errors.mediaInvalid(problem);
    const fileName = safeFileName(input.fileName);
    const objectKey = `tenants/${scope.tenantId}/resources/${randomBytes(8).toString('hex')}/${fileName}`;
    const file = await this.db.run(this.ctx(scope, user), async (tx) => {
      await this.editableCourse(tx, scope, user, courseId);
      return tx.resourceFile.create({
        data: { tenantId: scope.tenantId, objectKey, contentType: input.contentType, fileName, sizeBytes: BigInt(input.sizeBytes), createdByUserId: user.userId },
      });
    });
    return { fileId: file.id, uploadUrl: await this.storage.presignUpload(objectKey, input.contentType, input.sizeBytes), headers: { 'Content-Type': input.contentType } };
  }

  /** Step 2: the stored object must have the declared size and really be a document of that type. */
  async completeResourceUpload(scope: TenantScope, user: AuthUser, courseId: string, fileId: string): Promise<{ fileId: string; fileName: string }> {
    if (!this.storage.enabled) throw Errors.mediaUnavailable();
    const ctx = this.ctx(scope, user);
    const file = await this.db.run(ctx, async (tx) => {
      await this.editableCourse(tx, scope, user, courseId);
      const found = await tx.resourceFile.findFirst({ where: { id: fileId, tenantId: scope.tenantId, createdByUserId: user.userId } });
      if (!found) throw Errors.notFound('File');
      return found;
    });
    if (file.status === 'READY') return { fileId: file.id, fileName: file.fileName };
    if (file.status === 'FAILED') throw Errors.mediaInvalid('This upload failed. Upload the file again.');
    const stored = await this.storage.head(file.objectKey);
    if (!stored) throw Errors.mediaNotUploaded();
    if (stored.sizeBytes !== Number(file.sizeBytes) || !resourceLooksLike(file.contentType, await this.storage.prefix(file.objectKey))) {
      await this.storage.remove(file.objectKey).catch(() => undefined);
      await this.db.run(ctx, (tx) => tx.resourceFile.update({ where: { id: file.id }, data: { status: 'FAILED' } }));
      throw Errors.mediaInvalid('This file does not match its type. Save it again as a PDF, EPUB, Office, image, text, or ZIP file.');
    }
    await this.db.run(ctx, (tx) => tx.resourceFile.update({ where: { id: file.id }, data: { status: 'READY' } }));
    return { fileId: file.id, fileName: file.fileName };
  }

  /** Attaches a checked file or a web link to a draft lesson. */
  addResource(scope: TenantScope, user: AuthUser, courseId: string, lessonId: string, input: ResourceInputDto): Promise<DraftDto> {
    return this.edit(scope, user, courseId, async (tx, _course, draft) => {
      await this.draftLesson(tx, scope.tenantId, draft.id, lessonId);
      if (Boolean(input.fileId) === Boolean(input.url)) throw invalidResource('Attach either an uploaded file or a link.');
      let url: string | null = null;
      if (input.fileId) {
        const file = await tx.resourceFile.findFirst({ where: { id: input.fileId, tenantId: scope.tenantId }, select: { status: true } });
        if (!file) throw Errors.notFound('File');
        if (file.status !== 'READY') throw Errors.mediaNotUploaded();
      } else {
        try {
          const parsed = new URL((input.url ?? '').trim());
          if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') throw new Error('scheme');
          url = parsed.toString();
        } catch {
          throw invalidResource('Enter a link that starts with https://');
        }
      }
      const last = await tx.lessonResource.aggregate({ where: { tenantId: scope.tenantId, lessonId }, _max: { position: true } });
      await tx.lessonResource.create({
        data: {
          tenantId: scope.tenantId,
          lessonId,
          kind: input.fileId ? 'FILE' : 'LINK',
          title: input.title.trim(),
          resourceFileId: input.fileId ?? null,
          url,
          position: (last._max.position ?? 0) + 1,
        },
      });
    });
  }

  renameResource(scope: TenantScope, user: AuthUser, courseId: string, resourceId: string, title: string): Promise<DraftDto> {
    return this.edit(scope, user, courseId, async (tx, _course, draft) => {
      await this.draftResource(tx, scope.tenantId, draft.id, resourceId);
      await tx.lessonResource.update({ where: { id: resourceId }, data: { title: title.trim() } });
    });
  }

  /** Removes a resource from the draft; the published version keeps its own copy until the draft is approved. */
  removeResource(scope: TenantScope, user: AuthUser, courseId: string, resourceId: string): Promise<DraftDto> {
    return this.edit(scope, user, courseId, async (tx, _course, draft) => {
      await this.draftResource(tx, scope.tenantId, draft.id, resourceId);
      await tx.lessonResource.delete({ where: { id: resourceId } });
    });
  }

  // -------------------------------------------------------------------------------------------------

  private ctx(scope: TenantScope, user: AuthUser) {
    return { tenantId: scope.tenantId, userId: user.userId };
  }

  /** Runs an edit on the open draft, which must not be waiting for review, and returns the new state. */
  private edit(
    scope: TenantScope,
    user: AuthUser,
    courseId: string,
    change: (tx: Tx, course: EditableCourse, draft: DraftVersion) => Promise<void>,
  ): Promise<DraftDto> {
    return this.db.run(this.ctx(scope, user), async (tx) => {
      const course = await this.editableCourse(tx, scope, user, courseId);
      const draft = await this.openDraft(tx, scope.tenantId, courseId);
      if (!draft) throw Errors.notFound('Draft');
      if (draft.status !== 'DRAFT') throw Errors.conflict('This draft is waiting for review. Withdraw it to make changes.');
      await change(tx, course, draft);
      await tx.courseVersion.update({ where: { id: draft.id }, data: { updatedAt: new Date() } });
      return this.view(tx, scope, await tx.course.findUniqueOrThrow({ where: { id: course.id }, select: courseSelect }), draft.id);
    });
  }

  /** Instructors may edit only their own courses; administrators may edit any course in the tenant. */
  private async editableCourse(tx: Tx, scope: TenantScope, user: AuthUser, courseId: string): Promise<EditableCourse> {
    const course = await tx.course.findFirst({ where: { id: courseId, tenantId: scope.tenantId }, select: courseSelect });
    if (!course) throw Errors.notFound('Course');
    if (!hasRole(scope.role, 'ADMIN') && course.createdByUserId !== user.userId) {
      throw Errors.forbidden('You can edit only your own courses.');
    }
    return course;
  }

  /** `base`, or `base-2`, `base-3`… when taken in the workspace. */
  private async freeSlug(tx: Tx, tenantId: string, base: string): Promise<string> {
    for (let n = 1; n <= 50; n += 1) {
      const slug = n === 1 ? base : `${base}-${n}`;
      if (!(await tx.course.findFirst({ where: { tenantId, slug }, select: { id: true } }))) return slug;
    }
    return `${base}-${randomBytes(3).toString('hex')}`;
  }

  private openDraft(tx: Tx, tenantId: string, courseId: string): Promise<DraftVersion | null> {
    return tx.courseVersion.findFirst({
      where: { tenantId, courseId, status: { in: ['DRAFT', 'IN_REVIEW'] } },
      orderBy: { version: 'desc' },
      select: { id: true, status: true, version: true },
    });
  }

  private async draftSection(tx: Tx, tenantId: string, draftId: string, sectionId: string) {
    const section = await tx.section.findFirst({ where: { id: sectionId, tenantId, courseVersionId: draftId }, select: { id: true } });
    if (!section) throw Errors.notFound('Chapter');
    return section;
  }

  private async draftLesson(tx: Tx, tenantId: string, draftId: string, lessonId: string) {
    const lesson = await tx.lesson.findFirst({
      where: { id: lessonId, tenantId, section: { courseVersionId: draftId } },
      select: { id: true, sectionId: true, kind: true },
    });
    if (!lesson) throw Errors.notFound('Lesson');
    return lesson;
  }

  private async draftResource(tx: Tx, tenantId: string, draftId: string, resourceId: string) {
    const resource = await tx.lessonResource.findFirst({ where: { id: resourceId, tenantId, lesson: { section: { courseVersionId: draftId } } }, select: { id: true } });
    if (!resource) throw Errors.notFound('Resource');
    return resource;
  }

  private async assertComplete(tx: Tx, tenantId: string, draftId: string): Promise<void> {
    const sections = await tx.section.findMany({
      where: { tenantId, courseVersionId: draftId },
      select: { lessons: { select: { title: true, kind: true, bodyMarkdown: true, externalSource: true, mediaAsset: { select: { status: true } } } } },
    });
    if (sections.length === 0 || sections.some((section) => section.lessons.length === 0)) {
      throw Errors.conflict('Add at least one chapter, and at least one lesson in every chapter, before sending for review.');
    }
    const lessons = sections.flatMap((section) => section.lessons);
    // ADR-028 point 5: a document lesson shows its Google Drive file.
    const noDocument = lessons.find((lesson) => lesson.kind === 'DOCUMENT' && lesson.externalSource === null);
    if (noDocument) throw Errors.conflict(`“${noDocument.title}” needs its Google Drive link before review.`);
    // FR-COURSE-202: media lessons need their file (uploaded, or a YouTube or Drive link) and a transcript or
    // other text alternative.
    const incomplete = lessons.find(
      (lesson) =>
        (lesson.kind === 'VIDEO' || lesson.kind === 'AUDIO') &&
        ((lesson.mediaAsset?.status !== 'READY' && lesson.externalSource === null) || !lesson.bodyMarkdown.trim()),
    );
    if (incomplete) {
      throw Errors.conflict(`“${incomplete.title}” needs its ${incomplete.kind === 'VIDEO' ? 'video (upload or YouTube or Drive link)' : 'audio file'} and a transcript or text alternative before review.`);
    }
  }

  /** A media file can be attached only when it is READY, in this tenant, and of the lesson's kind. */
  private async readyMedia(tx: Tx, tenantId: string, mediaId: string, kind: string): Promise<void> {
    if (kind === 'TEXT' || kind === 'DOCUMENT') throw Errors.conflict('Text and document lessons do not take a video or audio file.');
    const asset = await tx.mediaAsset.findFirst({ where: { id: mediaId, tenantId }, select: { status: true, kind: true } });
    if (!asset) throw Errors.notFound('Media');
    if (asset.status !== 'READY') throw Errors.mediaNotUploaded();
    if (asset.kind !== kind) throw Errors.conflict(`This lesson needs ${kind === 'VIDEO' ? 'a video' : 'an audio'} file.`);
  }

  private async park(tx: Tx, kind: 'section' | 'lesson', ids: string[]): Promise<void> {
    for (const [index, id] of ids.entries()) {
      if (kind === 'section') await tx.section.update({ where: { id }, data: { position: -(index + 1) } });
      else await tx.lesson.update({ where: { id }, data: { position: -(index + 1) } });
    }
  }

  private async renumber(tx: Tx, kind: 'section' | 'lesson', orderedIds: string[]): Promise<void> {
    await this.park(tx, kind, orderedIds);
    for (const [index, id] of orderedIds.entries()) {
      if (kind === 'section') await tx.section.update({ where: { id }, data: { position: index + 1 } });
      else await tx.lesson.update({ where: { id }, data: { position: index + 1 } });
    }
  }

  private async view(tx: Tx, scope: TenantScope, course: EditableCourse, versionId: string): Promise<DraftDto> {
    const version = await tx.courseVersion.findUniqueOrThrow({
      where: { id: versionId },
      include: {
        sections: {
          orderBy: { position: 'asc' },
          include: {
            lessons: {
              orderBy: { position: 'asc' },
              include: {
                mediaAsset: { select: { id: true, status: true, fileName: true, durationSec: true } },
                resources: { orderBy: [{ position: 'asc' }, { createdAt: 'asc' }], include: { file: { select: { fileName: true, sizeBytes: true, contentType: true } } } },
              },
            },
          },
        },
      },
    });
    return {
      courseId: course.id,
      versionId: version.id,
      version: version.version,
      status: version.status,
      courseStatus: course.status,
      title: version.title,
      summary: version.summary,
      description: version.description,
      language: version.language,
      outcomes: version.outcomes,
      priceMinor: course.priceMinor,
      currency: course.currency,
      reviewFeedback: version.reviewFeedback,
      submittedAt: version.submittedAt,
      hasPublishedVersion: course.publishedVersionId !== null,
      canReview: hasRole(scope.role, 'ADMIN'),
      sections: version.sections.map((section) => ({
        id: section.id,
        title: section.title,
        position: section.position,
        lessons: section.lessons.map((lesson) => ({
          id: lesson.id,
          title: lesson.title,
          kind: lesson.kind,
          position: lesson.position,
          bodyMarkdown: lesson.bodyMarkdown,
          isPreview: lesson.isPreview,
          isRequired: lesson.isRequired,
          durationSec: lesson.durationSec,
          media: lesson.mediaAsset,
          external: lesson.externalSource && lesson.externalId ? { source: lesson.externalSource, id: lesson.externalId, url: authorUrl({ source: lesson.externalSource, id: lesson.externalId }) } : null,
          resources: lesson.resources.map((resource) => ({
            id: resource.id,
            kind: resource.kind,
            title: resource.title,
            url: resource.url,
            file: resource.file ? { name: resource.file.fileName, sizeBytes: Number(resource.file.sizeBytes), contentType: resource.file.contentType } : null,
          })),
        })),
      })),
    };
  }

  private async publishedView(tx: Tx, scope: TenantScope, courseId: string, versionId: string): Promise<DraftDto> {
    const course = await tx.course.findUniqueOrThrow({ where: { id: courseId }, select: courseSelect });
    return this.view(tx, scope, course, versionId);
  }

  private audit(tx: Tx, scope: TenantScope, user: AuthUser, action: string, courseId: string, metadata: Record<string, number>, reason?: string) {
    return tx.auditEvent.create({
      data: { tenantId: scope.tenantId, actorUserId: user.userId, action, targetType: 'course', targetId: courseId, metadata, ...(reason ? { reason } : {}) },
    });
  }
}

/** A pasted YouTube or Google Drive link, checked against the lesson kind (ADR-028 point 5). */
function externalFor(kind: string, input: string): ExternalRef {
  const ref = parseExternal(input);
  if (!ref) throw Errors.contentLinkInvalid('Paste a YouTube video link or a Google Drive file link (Share › Copy link).');
  const problem = sourceProblem(kind, ref);
  if (problem) throw Errors.contentLinkInvalid(problem);
  return ref;
}
