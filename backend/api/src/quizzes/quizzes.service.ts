import { Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { DomainError, Errors } from '../common/errors';
import type { AuthUser, TenantScope } from '../common/request';
import { DatabaseContext, type Tx } from '../database/database-context.service';
import type { Prisma } from '../generated/prisma/client';
import { hasRole } from '../tenancy/roles';
import { buildAnswer, newSectionKey } from './question-rules';
import type { QuestionInputDto, QuizDto, QuizQuestionDto, QuizSectionInputDto, QuizSettingsDto } from './quizzes.dto';

const invalid = (message: string) => new DomainError('VALIDATION_FAILED', 400, message);

const blueprintInclude = {
  sections: { orderBy: { position: 'asc' } },
  course: { select: { id: true, createdByUserId: true, programId: true } },
  _count: { select: { attempts: true } },
} as const satisfies Prisma.ExamBlueprintInclude;

type Blueprint = Prisma.ExamBlueprintGetPayload<{ include: typeof blueprintInclude }>;

/**
 * Quiz builder (FR-ASSESS-501, FR-EXAM): teachers create practice quizzes and mock exams for their courses,
 * split them into sections that each draw a number of random questions from their own question pool, and
 * write the questions. A quiz is published only when every pool is large enough. Once learners have taken
 * a quiz its structure is frozen (close it or copy it to change it); questions can still be corrected
 * because every attempt keeps its own copy of the questions it was given.
 */
@Injectable()
export class QuizzesService {
  constructor(private readonly db: DatabaseContext) {}

  list(scope: TenantScope, user: AuthUser, courseId: string): Promise<QuizDto[]> {
    return this.run(scope, user, async (tx) => {
      await this.ownedCourse(tx, scope, user, courseId);
      const blueprints = await tx.examBlueprint.findMany({ where: { tenantId: scope.tenantId, courseId }, include: blueprintInclude, orderBy: { createdAt: 'asc' } });
      return Promise.all(blueprints.map((blueprint) => this.view(tx, scope, blueprint, false)));
    });
  }

  get(scope: TenantScope, user: AuthUser, quizId: string): Promise<QuizDto> {
    return this.run(scope, user, async (tx) => this.view(tx, scope, await this.ownedQuiz(tx, scope, user, quizId), true));
  }

  create(scope: TenantScope, user: AuthUser, courseId: string, input: QuizSettingsDto): Promise<QuizDto> {
    return this.run(scope, user, async (tx) => {
      const course = await this.ownedCourse(tx, scope, user, courseId);
      const programId = await this.ensureProgram(tx, scope.tenantId, course);
      const blueprint = await tx.examBlueprint.create({
        data: { tenantId: scope.tenantId, courseId, programId, status: 'DRAFT', ...this.settings(input) },
        include: blueprintInclude,
      });
      await this.audit(tx, scope, user, 'quiz.created', blueprint.id);
      return this.view(tx, scope, blueprint, true);
    });
  }

  update(scope: TenantScope, user: AuthUser, quizId: string, input: QuizSettingsDto): Promise<QuizDto> {
    return this.change(scope, user, quizId, { editable: true }, async (tx, quiz) => {
      await tx.examBlueprint.update({ where: { id: quiz.id }, data: this.settings(input) });
    });
  }

  addSection(scope: TenantScope, user: AuthUser, quizId: string, input: QuizSectionInputDto): Promise<QuizDto> {
    return this.change(scope, user, quizId, { editable: true }, async (tx, quiz) => {
      const position = (quiz.sections.at(-1)?.position ?? 0) + 1;
      await tx.examBlueprintSection.create({
        data: { tenantId: scope.tenantId, blueprintId: quiz.id, sectionKey: newSectionKey(), title: input.title, position, questionCount: input.questionCount },
      });
    });
  }

  updateSection(scope: TenantScope, user: AuthUser, quizId: string, sectionId: string, input: QuizSectionInputDto): Promise<QuizDto> {
    return this.change(scope, user, quizId, { editable: true }, async (tx, quiz) => {
      this.section(quiz, sectionId);
      await tx.examBlueprintSection.update({ where: { id: sectionId }, data: { title: input.title, questionCount: input.questionCount } });
    });
  }

  /** Removes a section from a draft quiz; its questions stay in the course's question bank. */
  deleteSection(scope: TenantScope, user: AuthUser, quizId: string, sectionId: string): Promise<QuizDto> {
    return this.change(scope, user, quizId, { editable: true }, async (tx, quiz) => {
      this.section(quiz, sectionId);
      await tx.examBlueprintSection.delete({ where: { id: sectionId } });
    });
  }

  addQuestion(scope: TenantScope, user: AuthUser, quizId: string, sectionId: string, input: QuestionInputDto): Promise<QuizDto> {
    return this.change(scope, user, quizId, { open: true }, async (tx, quiz) => {
      const section = this.section(quiz, sectionId);
      const stored = this.answer(input);
      await tx.question.create({
        data: {
          tenantId: scope.tenantId,
          programId: quiz.programId,
          sectionKey: section.sectionKey,
          type: input.type,
          prompt: input.prompt.trim(),
          passage: input.passage?.trim() || null,
          choices: stored.choices,
          answerKey: stored.answerKey,
          explanation: input.explanation?.trim() || null,
          marks: input.marks ?? 1,
        },
      });
    });
  }

  /** Corrects a question; attempts already started keep the version they were given. */
  updateQuestion(scope: TenantScope, user: AuthUser, quizId: string, questionId: string, input: QuestionInputDto): Promise<QuizDto> {
    return this.change(scope, user, quizId, { open: true }, async (tx, quiz) => {
      const question = await this.question(tx, scope.tenantId, quiz, questionId);
      const stored = this.answer(input);
      await tx.question.update({
        where: { id: question.id },
        data: {
          type: input.type,
          prompt: input.prompt.trim(),
          passage: input.passage?.trim() || null,
          choices: stored.choices,
          answerKey: stored.answerKey,
          explanation: input.explanation?.trim() || null,
          marks: input.marks ?? 1,
          version: { increment: 1 },
        },
      });
    });
  }

  /** Retires a question; a published quiz must keep enough questions in every pool. */
  removeQuestion(scope: TenantScope, user: AuthUser, quizId: string, questionId: string): Promise<QuizDto> {
    return this.change(scope, user, quizId, { open: true }, async (tx, quiz) => {
      const question = await this.question(tx, scope.tenantId, quiz, questionId);
      const needed = await tx.examBlueprintSection.findMany({
        where: { tenantId: scope.tenantId, sectionKey: question.sectionKey, blueprint: { programId: quiz.programId, status: 'APPROVED' } },
        select: { questionCount: true },
      });
      const remaining = (await this.poolSize(tx, scope.tenantId, quiz.programId, question.sectionKey)) - 1;
      if (needed.some((section) => section.questionCount > remaining)) {
        throw Errors.conflict('A published quiz needs this question. Add another question to the section first, or lower its question count.');
      }
      await tx.question.update({ where: { id: question.id }, data: { status: 'RETIRED' } });
    });
  }

  /** Makes the quiz available to enrolled learners once every section can be filled. */
  publish(scope: TenantScope, user: AuthUser, quizId: string): Promise<QuizDto> {
    return this.change(scope, user, quizId, {}, async (tx, quiz) => {
      if (quiz.status !== 'DRAFT') throw Errors.conflict('Only a draft quiz can be published.');
      if (quiz.sections.length === 0) throw Errors.conflict('Add at least one section with questions before publishing.');
      for (const section of quiz.sections) {
        const available = await this.poolSize(tx, scope.tenantId, quiz.programId, section.sectionKey);
        if (available < section.questionCount) {
          throw Errors.conflict(`“${section.title}” draws ${section.questionCount} questions but has ${available}. Add questions or lower the count.`);
        }
      }
      await tx.examBlueprint.update({ where: { id: quiz.id }, data: { status: 'APPROVED', approvedAt: new Date() } });
      await this.audit(tx, scope, user, 'quiz.published', quiz.id);
    });
  }

  /** Back to draft, allowed only before anyone has taken the quiz. */
  unpublish(scope: TenantScope, user: AuthUser, quizId: string): Promise<QuizDto> {
    return this.change(scope, user, quizId, {}, async (tx, quiz) => {
      if (quiz.status !== 'APPROVED') throw Errors.conflict('This quiz is not published.');
      if (quiz._count.attempts > 0) throw Errors.conflict('Learners have already taken this quiz. Close it or make a copy to change it.');
      await tx.examBlueprint.update({ where: { id: quiz.id }, data: { status: 'DRAFT', approvedAt: null } });
    });
  }

  /** Stops new attempts; results and attempts in progress are kept. */
  close(scope: TenantScope, user: AuthUser, quizId: string): Promise<QuizDto> {
    return this.change(scope, user, quizId, {}, async (tx, quiz) => {
      if (quiz.status !== 'APPROVED') throw Errors.conflict('Only a published quiz can be closed.');
      await tx.examBlueprint.update({ where: { id: quiz.id }, data: { status: 'RETIRED' } });
      await this.audit(tx, scope, user, 'quiz.closed', quiz.id);
    });
  }

  /** Copies settings and sections into a new draft that shares the same question pools. */
  duplicate(scope: TenantScope, user: AuthUser, quizId: string): Promise<QuizDto> {
    return this.run(scope, user, async (tx) => {
      const source = await this.ownedQuiz(tx, scope, user, quizId);
      const copy = await tx.examBlueprint.create({
        data: {
          tenantId: scope.tenantId,
          courseId: source.courseId,
          programId: source.programId,
          title: `${source.title} (copy)`.slice(0, 200),
          kind: source.kind,
          status: 'DRAFT',
          version: source.version + 1,
          timeLimitSec: source.timeLimitSec,
          passPercent: source.passPercent,
          maxAttempts: source.maxAttempts,
          answerRelease: source.answerRelease,
          shuffleQuestions: source.shuffleQuestions,
        },
      });
      if (source.sections.length > 0) {
        await tx.examBlueprintSection.createMany({
          data: source.sections.map((section) => ({
            tenantId: scope.tenantId,
            blueprintId: copy.id,
            sectionKey: section.sectionKey,
            title: section.title,
            position: section.position,
            questionCount: section.questionCount,
          })),
        });
      }
      await this.audit(tx, scope, user, 'quiz.created', copy.id);
      return this.view(tx, scope, await tx.examBlueprint.findUniqueOrThrow({ where: { id: copy.id }, include: blueprintInclude }), true);
    });
  }

  // -------------------------------------------------------------------------------------------------

  private run<T>(scope: TenantScope, user: AuthUser, work: (tx: Tx) => Promise<T>): Promise<T> {
    return this.db.run({ tenantId: scope.tenantId, userId: user.userId }, work);
  }

  /**
   * Runs a change on a quiz the caller owns. `editable` requires a draft nobody has taken (structure and
   * settings); `open` refuses closed quizzes (question pool changes). Returns the quiz with its questions.
   */
  private change(
    scope: TenantScope,
    user: AuthUser,
    quizId: string,
    rules: { editable?: boolean; open?: boolean },
    work: (tx: Tx, quiz: Blueprint) => Promise<void>,
  ): Promise<QuizDto> {
    return this.run(scope, user, async (tx) => {
      const quiz = await this.ownedQuiz(tx, scope, user, quizId);
      if (rules.editable && !this.isEditable(quiz)) {
        throw Errors.conflict(
          quiz.status === 'DRAFT'
            ? 'Learners have already taken this quiz. Make a copy to change its structure.'
            : 'Unpublish the quiz, or make a copy, to change its settings and sections.',
        );
      }
      if (rules.open && quiz.status === 'RETIRED') throw Errors.conflict('This quiz is closed. Make a copy to keep working on it.');
      await work(tx, quiz);
      return this.view(tx, scope, await tx.examBlueprint.findUniqueOrThrow({ where: { id: quiz.id }, include: blueprintInclude }), true);
    });
  }

  private isEditable(quiz: Blueprint): boolean {
    return quiz.status === 'DRAFT' && quiz._count.attempts === 0;
  }

  /** Instructors manage quizzes of their own courses; administrators manage all. */
  private async ownedCourse(tx: Tx, scope: TenantScope, user: AuthUser, courseId: string) {
    const course = await tx.course.findFirst({
      where: { id: courseId, tenantId: scope.tenantId },
      select: { id: true, slug: true, createdByUserId: true, programId: true, versions: { orderBy: { version: 'desc' }, take: 1, select: { title: true, language: true } } },
    });
    if (!course) throw Errors.notFound('Course');
    if (!hasRole(scope.role, 'ADMIN') && course.createdByUserId !== user.userId) throw Errors.forbidden('You can build quizzes only for your own courses.');
    return course;
  }

  private async ownedQuiz(tx: Tx, scope: TenantScope, user: AuthUser, quizId: string): Promise<Blueprint> {
    const quiz = await tx.examBlueprint.findFirst({ where: { id: quizId, tenantId: scope.tenantId }, include: blueprintInclude });
    if (!quiz) throw Errors.notFound('Quiz');
    if (!hasRole(scope.role, 'ADMIN') && quiz.course.createdByUserId !== user.userId) throw Errors.forbidden('You can build quizzes only for your own courses.');
    return quiz;
  }

  /** Every quiz needs a question bank (program); courses without one get their own. */
  private async ensureProgram(
    tx: Tx,
    tenantId: string,
    course: { id: string; slug: string; programId: string | null; versions: { title: string; language: string }[] },
  ): Promise<string> {
    if (course.programId) return course.programId;
    const program = await tx.program.create({
      data: {
        tenantId,
        slug: `course-${course.slug}`.slice(0, 71) + `-${randomBytes(4).toString('hex')}`,
        name: `${course.versions[0]?.title ?? 'Course'} question bank`.slice(0, 160),
        kind: 'OTHER',
        language: course.versions[0]?.language ?? null,
      },
    });
    await tx.course.update({ where: { id: course.id }, data: { programId: program.id } });
    return program.id;
  }

  private section(quiz: Blueprint, sectionId: string) {
    const section = quiz.sections.find((item) => item.id === sectionId);
    if (!section) throw Errors.notFound('Section');
    return section;
  }

  private async question(tx: Tx, tenantId: string, quiz: Blueprint, questionId: string) {
    const question = await tx.question.findFirst({
      where: { id: questionId, tenantId, programId: quiz.programId, status: 'ACTIVE', sectionKey: { in: quiz.sections.map((s) => s.sectionKey) } },
      select: { id: true, sectionKey: true },
    });
    if (!question) throw Errors.notFound('Question');
    return question;
  }

  private answer(input: QuestionInputDto) {
    const stored = buildAnswer(input);
    if (typeof stored === 'string') throw invalid(stored);
    return stored;
  }

  private poolSize(tx: Tx, tenantId: string, programId: string, sectionKey: string): Promise<number> {
    return tx.question.count({ where: { tenantId, programId, sectionKey, status: 'ACTIVE' } });
  }

  private settings(input: QuizSettingsDto) {
    return {
      title: input.title.trim(),
      kind: input.kind,
      timeLimitSec: input.timeLimitMin * 60,
      passPercent: input.passPercent,
      maxAttempts: input.maxAttempts ?? null,
      answerRelease: input.answerRelease,
      shuffleQuestions: input.shuffleQuestions,
    };
  }

  private async view(tx: Tx, scope: TenantScope, quiz: Blueprint, withQuestions: boolean): Promise<QuizDto> {
    const keys = quiz.sections.map((section) => section.sectionKey);
    const questions = await tx.question.findMany({
      where: { tenantId: scope.tenantId, programId: quiz.programId, sectionKey: { in: keys }, status: 'ACTIVE' },
      orderBy: { createdAt: 'asc' },
    });
    const byKey = new Map<string, QuizQuestionDto[]>();
    for (const question of questions) {
      const list = byKey.get(question.sectionKey) ?? [];
      list.push({
        id: question.id,
        type: question.type,
        prompt: question.prompt,
        passage: question.passage,
        choices: question.choices as QuizQuestionDto['choices'],
        answerKey: question.answerKey as string[],
        explanation: question.explanation,
        marks: question.marks,
        version: question.version,
      });
      byKey.set(question.sectionKey, list);
    }
    return {
      id: quiz.id,
      courseId: quiz.courseId,
      title: quiz.title,
      kind: quiz.kind,
      status: quiz.status,
      timeLimitMin: Math.round(quiz.timeLimitSec / 60),
      passPercent: quiz.passPercent,
      maxAttempts: quiz.maxAttempts,
      answerRelease: quiz.answerRelease,
      shuffleQuestions: quiz.shuffleQuestions,
      attempts: quiz._count.attempts,
      editable: this.isEditable(quiz),
      sections: quiz.sections.map((section) => ({
        id: section.id,
        sectionKey: section.sectionKey,
        title: section.title,
        position: section.position,
        questionCount: section.questionCount,
        available: byKey.get(section.sectionKey)?.length ?? 0,
      })),
      ...(withQuestions ? { questions: Object.fromEntries(quiz.sections.map((section) => [section.id, byKey.get(section.sectionKey) ?? []])) } : {}),
    };
  }

  private audit(tx: Tx, scope: TenantScope, user: AuthUser, action: string, quizId: string) {
    return tx.auditEvent.create({ data: { tenantId: scope.tenantId, actorUserId: user.userId, action, targetType: 'exam_blueprint', targetId: quizId } });
  }
}
