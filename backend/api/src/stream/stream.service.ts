import { Injectable } from '@nestjs/common';
import { Errors } from '../common/errors';
import type { AuthUser, TenantScope } from '../common/request';
import { DatabaseContext, type Tx } from '../database/database-context.service';
import { hasActiveEntitlement } from '../learning/access';
import { hasRole } from '../tenancy/roles';
import type {
  AnnouncementDto,
  AnnouncementsDto,
  AnswerDto,
  AuthorDto,
  HiddenDto,
  QuestionDto,
  QuestionsDto,
} from './stream.dto';

type Access = {
  courseId: string;
  createdByUserId: string;
  publishedVersionId: string | null;
  staff: boolean;
};
type Post = {
  authorId: string;
  body: string;
  createdAt: Date;
  editedAt: Date | null;
  hiddenAt?: Date | null;
  hiddenReason?: string | null;
};

const OVERVIEW_LIMIT = 100;

/**
 * The class stream (FR-COMM-701/702): teacher announcements for a course, and questions and answers
 * on its lessons. Only people with course access take part. Free previews show no discussion.
 * Questions attach to the lesson's lineage, so they stay with the lesson when the course is
 * republished. Staff hide posts with a reason (audited). Nothing is deleted except announcements
 * and votes.
 */
@Injectable()
export class StreamService {
  constructor(private readonly db: DatabaseContext) {}

  // --- Announcements -------------------------------------------------------------------------

  announcements(scope: TenantScope, user: AuthUser, courseId: string): Promise<AnnouncementsDto> {
    return this.run(scope, user, async (tx) => {
      const access = await this.courseAccess(tx, scope, user, courseId);
      const rows = await tx.courseAnnouncement.findMany({
        where: { tenantId: scope.tenantId, courseId },
        orderBy: { createdAt: 'desc' },
      });
      const authors = await this.authors(
        tx,
        scope,
        access,
        rows.map((row) => row.authorId),
      );
      return {
        canPost: access.staff,
        announcements: rows.map((row) => this.announcementDto(row, authors)),
      };
    });
  }

  announce(
    scope: TenantScope,
    user: AuthUser,
    courseId: string,
    body: string,
  ): Promise<AnnouncementDto> {
    return this.run(scope, user, async (tx) => {
      const access = await this.courseAccess(tx, scope, user, courseId);
      if (!access.staff)
        throw Errors.forbidden('Only teachers of this course can post announcements.');
      const row = await tx.courseAnnouncement.create({
        data: { tenantId: scope.tenantId, courseId, authorId: user.userId, body: clean(body) },
      });
      return this.announcementDto(row, await this.authors(tx, scope, access, [row.authorId]));
    });
  }

  editAnnouncement(
    scope: TenantScope,
    user: AuthUser,
    announcementId: string,
    body: string,
  ): Promise<AnnouncementDto> {
    return this.run(scope, user, async (tx) => {
      const { access, announcement } = await this.staffAnnouncement(
        tx,
        scope,
        user,
        announcementId,
      );
      const row = await tx.courseAnnouncement.update({
        where: { id: announcement.id },
        data: { body: clean(body), editedAt: new Date() },
      });
      return this.announcementDto(row, await this.authors(tx, scope, access, [row.authorId]));
    });
  }

  removeAnnouncement(scope: TenantScope, user: AuthUser, announcementId: string): Promise<void> {
    return this.run(scope, user, async (tx) => {
      const { announcement } = await this.staffAnnouncement(tx, scope, user, announcementId);
      await tx.courseAnnouncement.delete({ where: { id: announcement.id } });
      await this.audit(
        tx,
        scope,
        user,
        'announcement.deleted',
        'course_announcement',
        announcement.id,
      );
    });
  }

  // --- Questions and answers -----------------------------------------------------------------

  lessonQuestions(
    scope: TenantScope,
    user: AuthUser,
    courseId: string,
    lessonId: string,
  ): Promise<QuestionsDto> {
    return this.run(scope, user, async (tx) => {
      const access = await this.courseAccess(tx, scope, user, courseId);
      const lesson = await this.publishedLesson(tx, scope, access, lessonId);
      return this.questions(tx, scope, user, access, { lessonLineageId: lesson.lineageId });
    });
  }

  /** Every question in the course, newest first, for the stream page. */
  courseQuestions(scope: TenantScope, user: AuthUser, courseId: string): Promise<QuestionsDto> {
    return this.run(scope, user, async (tx) => {
      const access = await this.courseAccess(tx, scope, user, courseId);
      return this.questions(tx, scope, user, access, {});
    });
  }

  ask(
    scope: TenantScope,
    user: AuthUser,
    courseId: string,
    lessonId: string,
    body: string,
  ): Promise<QuestionDto> {
    return this.run(scope, user, async (tx) => {
      const access = await this.courseAccess(tx, scope, user, courseId);
      const lesson = await this.publishedLesson(tx, scope, access, lessonId);
      const question = await tx.lessonQuestion.create({
        data: {
          tenantId: scope.tenantId,
          courseId,
          lessonLineageId: lesson.lineageId,
          lessonTitle: lesson.title,
          authorId: user.userId,
          body: clean(body),
        },
      });
      return this.one(tx, scope, user, access, question.id);
    });
  }

  editQuestion(
    scope: TenantScope,
    user: AuthUser,
    questionId: string,
    body: string,
  ): Promise<QuestionDto> {
    return this.run(scope, user, async (tx) => {
      const { access, question } = await this.question(tx, scope, user, questionId);
      if (question.authorId !== user.userId)
        throw Errors.forbidden('Only the person who asked can edit this question.');
      if (question.hiddenAt)
        throw Errors.conflict('This question was hidden by a teacher and can no longer be edited.');
      await tx.lessonQuestion.update({
        where: { id: question.id },
        data: { body: clean(body), editedAt: new Date() },
      });
      return this.one(tx, scope, user, access, question.id);
    });
  }

  answer(
    scope: TenantScope,
    user: AuthUser,
    questionId: string,
    body: string,
  ): Promise<QuestionDto> {
    return this.run(scope, user, async (tx) => {
      const { access, question } = await this.question(tx, scope, user, questionId);
      if (question.hiddenAt) throw Errors.conflict('This question was hidden by a teacher.');
      await tx.lessonAnswer.create({
        data: {
          tenantId: scope.tenantId,
          questionId: question.id,
          authorId: user.userId,
          body: clean(body),
        },
      });
      return this.one(tx, scope, user, access, question.id);
    });
  }

  editAnswer(
    scope: TenantScope,
    user: AuthUser,
    answerId: string,
    body: string,
  ): Promise<QuestionDto> {
    return this.run(scope, user, async (tx) => {
      const { access, answer } = await this.answerRow(tx, scope, user, answerId);
      if (answer.authorId !== user.userId)
        throw Errors.forbidden('Only the person who answered can edit this answer.');
      if (answer.hiddenAt)
        throw Errors.conflict('This answer was hidden by a teacher and can no longer be edited.');
      await tx.lessonAnswer.update({
        where: { id: answer.id },
        data: { body: clean(body), editedAt: new Date() },
      });
      return this.one(tx, scope, user, access, answer.questionId);
    });
  }

  /** The question's author or a teacher marks one visible answer as the best one, or clears it. */
  accept(
    scope: TenantScope,
    user: AuthUser,
    questionId: string,
    answerId: string | null,
  ): Promise<QuestionDto> {
    return this.run(scope, user, async (tx) => {
      const { access, question } = await this.question(tx, scope, user, questionId);
      if (question.authorId !== user.userId && !access.staff)
        throw Errors.forbidden(
          'Only the person who asked or a teacher can choose the best answer.',
        );
      if (answerId) {
        const answer = await tx.lessonAnswer.findFirst({
          where: {
            id: answerId,
            tenantId: scope.tenantId,
            questionId: question.id,
            hiddenAt: null,
          },
          select: { id: true },
        });
        if (!answer) throw Errors.notFound('Answer');
      }
      await tx.lessonQuestion.update({
        where: { id: question.id },
        data: { acceptedAnswerId: answerId },
      });
      return this.one(tx, scope, user, access, question.id);
    });
  }

  /** One upvote per person; voting twice is harmless. People cannot vote for their own answers. */
  vote(scope: TenantScope, user: AuthUser, answerId: string, up: boolean): Promise<QuestionDto> {
    return this.run(scope, user, async (tx) => {
      const { access, answer } = await this.answerRow(tx, scope, user, answerId);
      const where = { tenantId: scope.tenantId, answerId: answer.id, userId: user.userId };
      if (up) {
        if (answer.authorId === user.userId)
          throw Errors.conflict('You cannot vote for your own answer.');
        if (answer.hiddenAt) throw Errors.conflict('This answer was hidden by a teacher.');
        await tx.answerVote.createMany({ data: [where], skipDuplicates: true });
      } else {
        await tx.answerVote.deleteMany({ where });
      }
      return this.one(tx, scope, user, access, answer.questionId);
    });
  }

  hideQuestion(
    scope: TenantScope,
    user: AuthUser,
    questionId: string,
    reason: string | null,
  ): Promise<QuestionDto> {
    return this.run(scope, user, async (tx) => {
      const { access, question } = await this.question(tx, scope, user, questionId);
      if (!access.staff) throw Errors.forbidden('Only teachers of this course can hide posts.');
      await tx.lessonQuestion.update({ where: { id: question.id }, data: visibility(reason) });
      await this.audit(
        tx,
        scope,
        user,
        reason ? 'question.hidden' : 'question.restored',
        'lesson_question',
        question.id,
        reason,
      );
      return this.one(tx, scope, user, access, question.id);
    });
  }

  hideAnswer(
    scope: TenantScope,
    user: AuthUser,
    answerId: string,
    reason: string | null,
  ): Promise<QuestionDto> {
    return this.run(scope, user, async (tx) => {
      const { access, answer } = await this.answerRow(tx, scope, user, answerId);
      if (!access.staff) throw Errors.forbidden('Only teachers of this course can hide posts.');
      await tx.lessonAnswer.update({ where: { id: answer.id }, data: visibility(reason) });
      if (reason) {
        // A hidden answer cannot stay the accepted one.
        await tx.lessonQuestion.updateMany({
          where: { id: answer.questionId, tenantId: scope.tenantId, acceptedAnswerId: answer.id },
          data: { acceptedAnswerId: null },
        });
      }
      await this.audit(
        tx,
        scope,
        user,
        reason ? 'answer.hidden' : 'answer.restored',
        'lesson_answer',
        answer.id,
        reason,
      );
      return this.one(tx, scope, user, access, answer.questionId);
    });
  }

  // --- Helpers -------------------------------------------------------------------------------

  private run<T>(scope: TenantScope, user: AuthUser, work: (tx: Tx) => Promise<T>): Promise<T> {
    return this.db.run({ tenantId: scope.tenantId, userId: user.userId }, work);
  }

  /** Course teachers (the instructor who owns it, and school admins) and people with access take part. */
  private async courseAccess(
    tx: Tx,
    scope: TenantScope,
    user: AuthUser,
    courseId: string,
  ): Promise<Access> {
    const course = await tx.course.findFirst({
      where: { id: courseId, tenantId: scope.tenantId },
      select: { id: true, createdByUserId: true, publishedVersionId: true },
    });
    if (!course) throw Errors.notFound('Course');
    const staff =
      hasRole(scope.role, 'ADMIN') ||
      (hasRole(scope.role, 'INSTRUCTOR') && course.createdByUserId === user.userId);
    if (!staff) {
      if (!course.publishedVersionId) throw Errors.notFound('Course');
      if (!(await hasActiveEntitlement(tx, scope.tenantId, user.userId, courseId)))
        throw Errors.notEntitled();
    }
    return {
      courseId: course.id,
      createdByUserId: course.createdByUserId,
      publishedVersionId: course.publishedVersionId,
      staff,
    };
  }

  private async publishedLesson(tx: Tx, scope: TenantScope, access: Access, lessonId: string) {
    const lesson = access.publishedVersionId
      ? await tx.lesson.findFirst({
          where: {
            id: lessonId,
            tenantId: scope.tenantId,
            section: { courseVersionId: access.publishedVersionId },
          },
          select: { id: true, lineageId: true, title: true },
        })
      : null;
    if (!lesson) throw Errors.notFound('Lesson');
    return lesson;
  }

  private async staffAnnouncement(
    tx: Tx,
    scope: TenantScope,
    user: AuthUser,
    announcementId: string,
  ) {
    const announcement = await tx.courseAnnouncement.findFirst({
      where: { id: announcementId, tenantId: scope.tenantId },
      select: { id: true, courseId: true },
    });
    if (!announcement) throw Errors.notFound('Announcement');
    const access = await this.courseAccess(tx, scope, user, announcement.courseId);
    if (!access.staff)
      throw Errors.forbidden('Only teachers of this course can change announcements.');
    return { access, announcement };
  }

  private async question(tx: Tx, scope: TenantScope, user: AuthUser, questionId: string) {
    const question = await tx.lessonQuestion.findFirst({
      where: { id: questionId, tenantId: scope.tenantId },
      select: { id: true, courseId: true, authorId: true, hiddenAt: true },
    });
    if (!question) throw Errors.notFound('Question');
    const access = await this.courseAccess(tx, scope, user, question.courseId);
    // Other learners cannot reach a hidden question.
    if (question.hiddenAt && !access.staff && question.authorId !== user.userId)
      throw Errors.notFound('Question');
    return { access, question };
  }

  private async answerRow(tx: Tx, scope: TenantScope, user: AuthUser, answerId: string) {
    const answer = await tx.lessonAnswer.findFirst({
      where: { id: answerId, tenantId: scope.tenantId },
      select: { id: true, questionId: true, authorId: true, hiddenAt: true },
    });
    if (!answer) throw Errors.notFound('Answer');
    const { access } = await this.question(tx, scope, user, answer.questionId);
    if (answer.hiddenAt && !access.staff && answer.authorId !== user.userId)
      throw Errors.notFound('Answer');
    return { access, answer };
  }

  private async one(
    tx: Tx,
    scope: TenantScope,
    user: AuthUser,
    access: Access,
    questionId: string,
  ): Promise<QuestionDto> {
    const [question] = (await this.questions(tx, scope, user, access, { id: questionId }))
      .questions;
    if (!question) throw Errors.notFound('Question');
    return question;
  }

  /** Questions with their answers. Hidden posts are shown only to staff and to their authors. */
  private async questions(
    tx: Tx,
    scope: TenantScope,
    user: AuthUser,
    access: Access,
    filter: { lessonLineageId?: string; id?: string },
  ): Promise<QuestionsDto> {
    const visible = access.staff ? {} : { OR: [{ hiddenAt: null }, { authorId: user.userId }] };
    const rows = await tx.lessonQuestion.findMany({
      where: { tenantId: scope.tenantId, courseId: access.courseId, ...filter, ...visible },
      include: { answers: { where: visible, orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'desc' },
      take: filter.lessonLineageId || filter.id ? undefined : OVERVIEW_LIMIT,
    });
    const answerIds = rows.flatMap((row) => row.answers.map((answer) => answer.id));
    const [counts, mine, lessons] = await Promise.all([
      answerIds.length
        ? tx.answerVote.groupBy({
            by: ['answerId'],
            where: { tenantId: scope.tenantId, answerId: { in: answerIds } },
            _count: { _all: true },
          })
        : [],
      answerIds.length
        ? tx.answerVote.findMany({
            where: { tenantId: scope.tenantId, userId: user.userId, answerId: { in: answerIds } },
            select: { answerId: true },
          })
        : [],
      access.publishedVersionId
        ? tx.lesson.findMany({
            where: {
              tenantId: scope.tenantId,
              section: { courseVersionId: access.publishedVersionId },
            },
            select: { id: true, lineageId: true },
          })
        : [],
    ]);
    const votes = new Map(counts.map((row) => [row.answerId, row._count._all]));
    const voted = new Set(mine.map((row) => row.answerId));
    const current = new Map(lessons.map((lesson) => [lesson.lineageId, lesson.id]));
    const authors = await this.authors(
      tx,
      scope,
      access,
      rows.flatMap((row) => [row.authorId, ...row.answers.map((answer) => answer.authorId)]),
    );

    const questions = rows.map((row): QuestionDto => {
      const answers = row.answers
        .map((answer): AnswerDto => ({
          id: answer.id,
          body: answer.body,
          author: authors.get(answer.authorId) ?? unknownAuthor,
          mine: answer.authorId === user.userId,
          votes: votes.get(answer.id) ?? 0,
          voted: voted.has(answer.id),
          accepted: row.acceptedAnswerId === answer.id,
          hidden: hidden(answer),
          createdAt: answer.createdAt,
          edited: edited(answer),
        }))
        .sort(
          (a, b) =>
            Number(b.accepted) - Number(a.accepted) ||
            b.votes - a.votes ||
            a.createdAt.getTime() - b.createdAt.getTime(),
        );
      return {
        id: row.id,
        lessonId: current.get(row.lessonLineageId) ?? null,
        lessonTitle: row.lessonTitle,
        body: row.body,
        author: authors.get(row.authorId) ?? unknownAuthor,
        mine: row.authorId === user.userId,
        acceptedAnswerId: row.acceptedAnswerId,
        canAccept: !row.hiddenAt && (access.staff || row.authorId === user.userId),
        hidden: hidden(row),
        createdAt: row.createdAt,
        edited: edited(row),
        answers,
      };
    });
    return { canModerate: access.staff, questions };
  }

  /** Display names only: classmates never see each other's email addresses. */
  private async authors(
    tx: Tx,
    scope: TenantScope,
    access: Access,
    ids: string[],
  ): Promise<Map<string, AuthorDto>> {
    const unique = [...new Set(ids)];
    if (!unique.length) return new Map();
    const [profiles, admins] = await Promise.all([
      tx.userProfile.findMany({
        where: { id: { in: unique } },
        select: { id: true, displayName: true },
      }),
      tx.tenantMembership.findMany({
        where: {
          tenantId: scope.tenantId,
          userId: { in: unique },
          status: 'ACTIVE',
          role: { in: ['ADMIN', 'OWNER'] },
        },
        select: { userId: true },
      }),
    ]);
    const staff = new Set([access.createdByUserId, ...admins.map((row) => row.userId)]);
    return new Map(
      profiles.map((profile) => {
        const teacher = staff.has(profile.id);
        return [
          profile.id,
          { name: profile.displayName?.trim() || (teacher ? 'Teacher' : 'Learner'), teacher },
        ];
      }),
    );
  }

  private announcementDto(
    row: Post & { id: string },
    authors: Map<string, AuthorDto>,
  ): AnnouncementDto {
    return {
      id: row.id,
      body: row.body,
      author: authors.get(row.authorId) ?? unknownAuthor,
      createdAt: row.createdAt,
      edited: edited(row),
    };
  }

  private audit(
    tx: Tx,
    scope: TenantScope,
    user: AuthUser,
    action: string,
    targetType: string,
    targetId: string,
    reason: string | null = null,
  ) {
    return tx.auditEvent.create({
      data: {
        tenantId: scope.tenantId,
        actorUserId: user.userId,
        action,
        targetType,
        targetId,
        reason,
      },
    });
  }
}

const unknownAuthor: AuthorDto = { name: 'Former member', teacher: false };

function clean(body: string): string {
  return body.trim() || body;
}

function edited(post: Post): boolean {
  return post.editedAt !== null;
}

function hidden(post: Post): HiddenDto | null {
  return post.hiddenAt && post.hiddenReason
    ? { reason: post.hiddenReason, at: post.hiddenAt }
    : null;
}

function visibility(reason: string | null) {
  return reason
    ? { hiddenAt: new Date(), hiddenReason: reason.trim() }
    : { hiddenAt: null, hiddenReason: null };
}
