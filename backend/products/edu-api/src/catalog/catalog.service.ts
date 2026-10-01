import { Injectable } from '@nestjs/common';
import { Errors } from '../common/errors';
import type { AuthUser, TenantScope } from '../common/request';
import { DatabaseContext, type Tx } from '../database/database-context.service';
import type { Prisma } from '../generated/prisma/client';
import { hasActiveEntitlement } from '../learning/access';
import { ObjectStorage } from '../media/object-storage';
import { canAuthor } from '../tenancy/roles';
import type {
  CourseDetailDto,
  CourseSummaryDto,
  CreateCourseDto,
  LessonDto,
  ListCoursesQuery,
} from './catalog.dto';

const versionSummarySelect = { id: true, title: true, summary: true, version: true } as const;

const activePlansSelect = { where: { active: true }, select: { priceMinor: true, currency: true } } as const;

type CourseWithVersions = Prisma.CourseGetPayload<{
  include: {
    publishedVersion: { select: typeof versionSummarySelect };
    versions: { select: typeof versionSummarySelect };
    plans: typeof activePlansSelect;
  };
}>;

@Injectable()
export class CatalogService {
  constructor(
    private readonly db: DatabaseContext,
    private readonly storage: ObjectStorage,
  ) {}

  /**
   * Learners see published courses only (FR-CATALOG-301); instructors and administrators also see
   * drafts and archived courses in their own tenant.
   */
  list(
    scope: TenantScope,
    user: AuthUser,
    query: ListCoursesQuery,
  ): Promise<{ data: CourseSummaryDto[]; nextCursor: string | null }> {
    const author = canAuthor(scope.role);
    const limit = query.limit ?? 20;
    const titleFilter = query.q ? { contains: query.q, mode: 'insensitive' as const } : undefined;

    const where: Prisma.CourseWhereInput = {
      tenantId: scope.tenantId,
      ...(query.programId ? { programId: query.programId } : {}),
      ...(author
        ? titleFilter
          ? { versions: { some: { title: titleFilter } } }
          : {}
        : {
            status: 'PUBLISHED',
            publishedVersionId: { not: null },
            ...(titleFilter ? { publishedVersion: { title: titleFilter } } : {}),
          }),
    };

    return this.db.run({ tenantId: scope.tenantId, userId: user.userId }, async (tx) => {
      const courses = await tx.course.findMany({
        where,
        include: {
          publishedVersion: { select: versionSummarySelect },
          versions: { select: versionSummarySelect, orderBy: { version: 'desc' }, take: 1 },
          plans: activePlansSelect,
        },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        take: limit + 1,
        ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      });
      const page = courses.slice(0, limit);
      return {
        data: page.map((course) => this.toSummary(course, author)),
        nextCursor: courses.length > limit ? (page[page.length - 1]?.id ?? null) : null,
      };
    });
  }

  get(scope: TenantScope, user: AuthUser, courseId: string): Promise<CourseDetailDto> {
    return this.db.run({ tenantId: scope.tenantId, userId: user.userId }, async (tx) => {
      const { course, versionId, entitled, author } = await this.loadVisibleCourse(
        tx,
        scope,
        user,
        courseId,
      );
      const version = await tx.courseVersion.findUniqueOrThrow({
        where: { id: versionId },
        include: {
          sections: {
            orderBy: { position: 'asc' },
            include: { lessons: { orderBy: { position: 'asc' } } },
          },
        },
      });

      return {
        ...this.toSummary(course, author),
        title: version.title,
        summary: version.summary,
        description: version.description,
        language: version.language,
        outcomes: version.outcomes,
        version: version.version,
        curriculum: version.sections.map((section) => ({
          id: section.id,
          title: section.title,
          lessons: section.lessons.map((lesson) => ({
            id: lesson.id,
            title: lesson.title,
            kind: lesson.kind,
            isPreview: lesson.isPreview,
            isRequired: lesson.isRequired,
            durationSec: lesson.durationSec,
          })),
        })),
        access: { entitled, canAuthor: author },
      };
    });
  }

  /** Lesson content: preview lessons for any member; others need an entitlement (FR-COURSE-204). */
  getLesson(
    scope: TenantScope,
    user: AuthUser,
    courseId: string,
    lessonId: string,
  ): Promise<LessonDto> {
    return this.db.run({ tenantId: scope.tenantId, userId: user.userId }, async (tx) => {
      const { versionId, entitled, author } = await this.loadVisibleCourse(tx, scope, user, courseId);
      const lesson = await tx.lesson.findFirst({
        where: { id: lessonId, tenantId: scope.tenantId, section: { courseVersionId: versionId } },
        include: {
          mediaAsset: { select: { id: true, kind: true, status: true, contentType: true, objectKey: true, durationSec: true } },
          resources: {
            orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
            include: { file: { select: { objectKey: true, fileName: true, sizeBytes: true, contentType: true, status: true } } },
          },
        },
      });
      if (!lesson) throw Errors.notFound('Lesson');
      if (!lesson.isPreview && !entitled && !author) throw Errors.notEntitled();

      // The playback URL is signed only now, after the access check above (FR-PLAYER-401).
      let media: LessonDto['media'] = null;
      if (lesson.mediaAsset?.status === 'READY' && this.storage.enabled) {
        const progress = await tx.mediaProgress.findUnique({
          where: { tenantId_userId_mediaAssetId: { tenantId: scope.tenantId, userId: user.userId, mediaAssetId: lesson.mediaAsset.id } },
          select: { positionSec: true, completedAt: true },
        });
        media = {
          id: lesson.mediaAsset.id,
          kind: lesson.mediaAsset.kind,
          contentType: lesson.mediaAsset.contentType,
          url: await this.storage.presignPlayback(lesson.mediaAsset.objectKey),
          durationSec: lesson.mediaAsset.durationSec,
          resumeSec: progress?.positionSec ?? 0,
          completed: progress?.completedAt != null,
        };
      }
      return {
        id: lesson.id,
        title: lesson.title,
        kind: lesson.kind,
        isPreview: lesson.isPreview,
        isRequired: lesson.isRequired,
        durationSec: lesson.durationSec,
        bodyMarkdown: lesson.bodyMarkdown,
        media,
        resources: await this.lessonResources(lesson.resources, entitled || author),
      };
    });
  }

  /** Free previews never expose course resources (FR-COURSE-204); files get short-lived signed links. */
  private async lessonResources(
    resources: {
      id: string;
      kind: string;
      title: string;
      url: string | null;
      file: { objectKey: string; fileName: string; sizeBytes: bigint; contentType: string; status: string } | null;
    }[],
    allowed: boolean,
  ): Promise<LessonDto['resources']> {
    if (!allowed) return [];
    const visible = resources.filter((resource) => resource.kind === 'LINK' || (resource.file?.status === 'READY' && this.storage.enabled));
    return Promise.all(
      visible.map(async (resource) => ({
        id: resource.id,
        kind: resource.kind,
        title: resource.title,
        url: resource.url,
        file: resource.file
          ? {
              name: resource.file.fileName,
              sizeBytes: Number(resource.file.sizeBytes),
              contentType: resource.file.contentType,
              downloadUrl: await this.storage.presignDownload(resource.file.objectKey, resource.file.fileName),
              viewUrl: resource.file.contentType === 'application/pdf' ? await this.storage.presignInlinePdf(resource.file.objectKey) : null,
            }
          : null,
      })),
    );
  }

  /** Creates a DRAFT course with version 1 (FR-COURSE-201). Publication needs review later. */
  create(scope: TenantScope, user: AuthUser, input: CreateCourseDto): Promise<CourseSummaryDto> {
    return this.db.run({ tenantId: scope.tenantId, userId: user.userId }, async (tx) => {
      if (input.programId) {
        const program = await tx.program.findFirst({
          where: { id: input.programId, tenantId: scope.tenantId },
          select: { id: true },
        });
        if (!program) throw Errors.notFound('Program');
      }
      const course = await tx.course.create({
        data: {
          tenantId: scope.tenantId,
          programId: input.programId ?? null,
          slug: input.slug,
          priceMinor: input.priceMinor,
          currency: input.currency,
          createdByUserId: user.userId,
        },
      });
      await tx.courseVersion.create({
        data: {
          tenantId: scope.tenantId,
          courseId: course.id,
          version: 1,
          title: input.title,
          summary: input.summary,
          description: input.description ?? '',
          language: input.language,
          outcomes: input.outcomes ?? [],
        },
      });
      await tx.auditEvent.create({
        data: {
          tenantId: scope.tenantId,
          actorUserId: user.userId,
          action: 'course.created',
          targetType: 'course',
          targetId: course.id,
        },
      });
      return {
        id: course.id,
        slug: course.slug,
        status: course.status,
        title: input.title,
        summary: input.summary,
        price: { amountMinor: course.priceMinor, currency: course.currency },
        hasPlans: false,
        programId: course.programId,
      };
    });
  }

  /**
   * Resolves which version the caller may see. Learners: the published version of a PUBLISHED
   * course, or of an ARCHIVED course they are still entitled to (FR-COURSE-203). Authors: the
   * latest version. Everything else is a 404, identical to a nonexistent course.
   */
  private async loadVisibleCourse(
    tx: Tx,
    scope: TenantScope,
    user: AuthUser,
    courseId: string,
  ): Promise<{ course: CourseWithVersions; versionId: string; entitled: boolean; author: boolean }> {
    const course = await tx.course.findFirst({
      where: { id: courseId, tenantId: scope.tenantId },
      include: {
        publishedVersion: { select: versionSummarySelect },
        versions: { select: versionSummarySelect, orderBy: { version: 'desc' }, take: 1 },
        plans: activePlansSelect,
      },
    });
    if (!course) throw Errors.notFound('Course');

    const author = canAuthor(scope.role);
    const entitled = await hasActiveEntitlement(tx, scope.tenantId, user.userId, course.id);

    if (author) {
      const versionId = course.versions[0]?.id;
      if (!versionId) throw Errors.notFound('Course');
      return { course, versionId, entitled, author };
    }

    const visible =
      course.publishedVersionId !== null &&
      (course.status === 'PUBLISHED' || (course.status === 'ARCHIVED' && entitled));
    if (!visible || !course.publishedVersionId) throw Errors.notFound('Course');
    return { course, versionId: course.publishedVersionId, entitled, author };
  }

  private toSummary(course: CourseWithVersions, author: boolean): CourseSummaryDto {
    const cheapest = [...course.plans].sort((a, b) => a.priceMinor - b.priceMinor)[0];
    const version = author
      ? (course.versions[0] ?? course.publishedVersion)
      : course.publishedVersion;
    return {
      id: course.id,
      slug: course.slug,
      status: course.status,
      title: version?.title ?? '',
      summary: version?.summary ?? '',
      // With access plans on sale (ADR-028) the price is the cheapest plan, shown as "from".
      price: cheapest ? { amountMinor: cheapest.priceMinor, currency: cheapest.currency } : { amountMinor: course.priceMinor, currency: course.currency },
      hasPlans: cheapest !== undefined,
      programId: course.programId,
    };
  }
}
