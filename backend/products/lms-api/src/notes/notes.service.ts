import { Injectable } from '@nestjs/common';
import { Errors } from '../common/errors';
import type { AuthUser, TenantScope } from '../common/request';
import { DatabaseContext, type Tx } from '../database/database-context.service';
import { hasActiveEntitlement } from '../learning/access';
import { hasRole } from '../tenancy/roles';
import type { NoteDto, NoteInputDto, NoteUpdateDto } from './notes.dto';

type NoteRow = { id: string; body: string; timestampSec: number | null; lessonTitle: string; lessonLineageId: string; createdAt: Date; updatedAt: Date };

/**
 * Private lesson notes (FR-PLAYER-403). A learner writes notes on lessons they can open; row-level
 * security makes each note visible to its owner only. Notes attach to the lesson's lineage, so they stay
 * with the lesson when the course is republished.
 */
@Injectable()
export class NotesService {
  constructor(private readonly db: DatabaseContext) {}

  forLesson(scope: TenantScope, user: AuthUser, courseId: string, lessonId: string): Promise<NoteDto[]> {
    return this.run(scope, user, async (tx) => {
      const lesson = await this.openLesson(tx, scope, user, courseId, lessonId);
      const notes = await tx.lessonNote.findMany({
        where: { tenantId: scope.tenantId, userId: user.userId, courseId, lessonLineageId: lesson.lineageId },
        orderBy: [{ timestampSec: { sort: 'asc', nulls: 'last' } }, { createdAt: 'asc' }],
      });
      return notes.map((note) => this.toDto(note, lesson.id));
    });
  }

  create(scope: TenantScope, user: AuthUser, courseId: string, lessonId: string, input: NoteInputDto): Promise<NoteDto> {
    return this.run(scope, user, async (tx) => {
      const lesson = await this.openLesson(tx, scope, user, courseId, lessonId);
      const note = await tx.lessonNote.create({
        data: {
          tenantId: scope.tenantId,
          userId: user.userId,
          courseId,
          lessonLineageId: lesson.lineageId,
          lessonTitle: lesson.title,
          body: input.body.trim() || input.body,
          timestampSec: input.timestampSec ?? null,
        },
      });
      return this.toDto(note, lesson.id);
    });
  }

  update(scope: TenantScope, user: AuthUser, noteId: string, input: NoteUpdateDto): Promise<NoteDto> {
    return this.run(scope, user, async (tx) => {
      const note = await this.ownNote(tx, scope, user, noteId);
      const updated = await tx.lessonNote.update({
        where: { id: note.id },
        data: {
          ...(input.body !== undefined ? { body: input.body.trim() || input.body } : {}),
          ...(input.timestampSec !== undefined ? { timestampSec: input.timestampSec } : {}),
        },
      });
      return this.toDto(updated, null);
    });
  }

  remove(scope: TenantScope, user: AuthUser, noteId: string): Promise<void> {
    return this.run(scope, user, async (tx) => {
      const note = await this.ownNote(tx, scope, user, noteId);
      await tx.lessonNote.delete({ where: { id: note.id } });
    });
  }

  /** All of the caller's notes in a course, in curriculum order; notes on removed lessons come last. */
  forCourse(scope: TenantScope, user: AuthUser, courseId: string): Promise<NoteDto[]> {
    return this.run(scope, user, async (tx) => {
      const course = await tx.course.findFirst({ where: { id: courseId, tenantId: scope.tenantId }, select: { publishedVersionId: true } });
      if (!course) throw Errors.notFound('Course');
      const lessons = course.publishedVersionId
        ? await tx.lesson.findMany({
            where: { tenantId: scope.tenantId, section: { courseVersionId: course.publishedVersionId } },
            select: { id: true, lineageId: true, position: true, section: { select: { position: true } } },
          })
        : [];
      const order = new Map(
        lessons
          .sort((a, b) => a.section.position - b.section.position || a.position - b.position)
          .map((lesson, index) => [lesson.lineageId, { index, id: lesson.id }]),
      );
      const notes = await tx.lessonNote.findMany({ where: { tenantId: scope.tenantId, userId: user.userId, courseId }, orderBy: { createdAt: 'asc' } });
      const rank = (note: NoteRow) => order.get(note.lessonLineageId)?.index ?? Number.MAX_SAFE_INTEGER;
      return notes
        .sort((a, b) => rank(a) - rank(b) || (a.timestampSec ?? Infinity) - (b.timestampSec ?? Infinity) || a.createdAt.getTime() - b.createdAt.getTime())
        .map((note) => this.toDto(note, order.get(note.lessonLineageId)?.id ?? null));
    });
  }

  private run<T>(scope: TenantScope, user: AuthUser, work: (tx: Tx) => Promise<T>): Promise<T> {
    return this.db.run({ tenantId: scope.tenantId, userId: user.userId }, work);
  }

  /** The published lesson the caller can open: preview lessons, course access, or teaching the course. */
  private async openLesson(tx: Tx, scope: TenantScope, user: AuthUser, courseId: string, lessonId: string) {
    const course = await tx.course.findFirst({
      where: { id: courseId, tenantId: scope.tenantId },
      select: { publishedVersionId: true, createdByUserId: true, status: true },
    });
    if (!course?.publishedVersionId) throw Errors.notFound('Lesson');
    const lesson = await tx.lesson.findFirst({
      where: { id: lessonId, tenantId: scope.tenantId, section: { courseVersionId: course.publishedVersionId } },
      select: { id: true, lineageId: true, title: true, isPreview: true },
    });
    if (!lesson) throw Errors.notFound('Lesson');
    const staff = hasRole(scope.role, 'ADMIN') || (hasRole(scope.role, 'INSTRUCTOR') && course.createdByUserId === user.userId);
    if (!lesson.isPreview && !staff && !(await hasActiveEntitlement(tx, scope.tenantId, user.userId, courseId))) throw Errors.notEntitled();
    return lesson;
  }

  private async ownNote(tx: Tx, scope: TenantScope, user: AuthUser, noteId: string) {
    // Row-level security already hides other people's notes; the user filter states the intent.
    const note = await tx.lessonNote.findFirst({ where: { id: noteId, tenantId: scope.tenantId, userId: user.userId }, select: { id: true } });
    if (!note) throw Errors.notFound('Note');
    return note;
  }

  private toDto(note: NoteRow, lessonId: string | null): NoteDto {
    return {
      id: note.id,
      body: note.body,
      timestampSec: note.timestampSec,
      lessonTitle: note.lessonTitle,
      lessonId,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
    };
  }
}
