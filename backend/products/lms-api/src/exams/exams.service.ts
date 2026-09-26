import { BadRequestException, Injectable } from '@nestjs/common';
import { Errors } from '../common/errors';
import type { AuthUser, TenantScope } from '../common/request';
import { DatabaseContext, type Tx } from '../database/database-context.service';
import { Prisma } from '../generated/prisma/client';
import { hasActiveEntitlement } from '../learning/access';
import { MetricsService } from '../observability/metrics.service';
import { canAuthor } from '../tenancy/roles';
import type { SaveAnswersDto } from './exams.dto';
import {
  gradeAttempt,
  pickQuestions,
  validateResponse,
  type AnswerResponse,
  type Choice,
  type QuestionType,
} from './grading';

/** Shown with every mock or practice result (FR-EXAM-1204, NFR-09). */
export const PRACTICE_SCORE_NOTICE =
  'Platform practice score. This is not an official exam score, certificate, or scaled result.';

interface ItemSnapshot {
  type: QuestionType;
  prompt: string;
  passage: string | null;
  choices: Choice[];
  marks: number;
  version: number;
}

export interface ExamSummary {
  id: string;
  title: string;
  kind: string;
  timeLimitSec: number;
  passPercent: number;
  maxAttempts: number | null;
  attemptsUsed: number;
  inProgressAttemptId: string | null;
  sections: { sectionKey: string; title: string; questionCount: number }[];
}

export interface AttemptItemView {
  id: string;
  position: number;
  sectionKey: string;
  type: QuestionType;
  prompt: string;
  passage: string | null;
  choices: Choice[];
  marks: number;
  response: AnswerResponse | null;
  isCorrect?: boolean | null;
  marksAwarded?: number | null;
  answerKey?: string[];
  explanation?: string | null;
}

export interface AttemptView {
  id: string;
  examId: string;
  examTitle: string;
  attemptNumber: number;
  status: string;
  startedAt: Date;
  deadlineAt: Date;
  submittedAt: Date | null;
  remainingSec: number;
  items: AttemptItemView[];
  result: {
    score: number;
    maxScore: number;
    passed: boolean;
    sectionBreakdown: unknown;
    revision: number;
    notice: string;
  } | null;
}

const attemptInclude = {
  blueprint: { include: { sections: { orderBy: { position: 'asc' } } } },
  items: { orderBy: { position: 'asc' } },
  results: { orderBy: { revision: 'desc' }, take: 1 },
} as const satisfies Prisma.ExamAttemptInclude;

type AttemptRecord = Prisma.ExamAttemptGetPayload<{ include: typeof attemptInclude }>;

@Injectable()
export class ExamsService {
  constructor(
    private readonly db: DatabaseContext,
    private readonly metrics: MetricsService,
  ) {}

  /** Approved exams for a course the caller can access. */
  listForCourse(scope: TenantScope, user: AuthUser, courseId: string): Promise<ExamSummary[]> {
    return this.db.run({ tenantId: scope.tenantId, userId: user.userId }, async (tx) => {
      await this.assertCourseAccess(tx, scope, user, courseId);
      const blueprints = await tx.examBlueprint.findMany({
        where: { tenantId: scope.tenantId, courseId, status: 'APPROVED' },
        include: {
          sections: { orderBy: { position: 'asc' } },
          attempts: { where: { userId: user.userId }, select: { id: true, status: true } },
        },
        orderBy: { createdAt: 'asc' },
      });
      return blueprints.map((blueprint) => ({
        id: blueprint.id,
        title: blueprint.title,
        kind: blueprint.kind,
        timeLimitSec: blueprint.timeLimitSec,
        passPercent: blueprint.passPercent,
        maxAttempts: blueprint.maxAttempts,
        attemptsUsed: blueprint.attempts.length,
        inProgressAttemptId:
          blueprint.attempts.find((attempt) => attempt.status === 'IN_PROGRESS')?.id ?? null,
        sections: blueprint.sections.map((section) => ({
          sectionKey: section.sectionKey,
          title: section.title,
          questionCount: section.questionCount,
        })),
      }));
    });
  }

  /**
   * Starts an attempt, or returns the caller's unexpired in-progress attempt so reconnecting never
   * creates a second one (FR-EXAM-1203). Questions are frozen into the attempt at start.
   */
  async start(
    scope: TenantScope,
    user: AuthUser,
    examId: string,
  ): Promise<{ attempt: AttemptView; created: boolean }> {
    const ctx = { tenantId: scope.tenantId, userId: user.userId };
    try {
      return await this.db.run(ctx, async (tx) => {
        const blueprint = await tx.examBlueprint.findFirst({
          where: { id: examId, tenantId: scope.tenantId, status: 'APPROVED' },
          include: { sections: { orderBy: { position: 'asc' } } },
        });
        if (!blueprint) throw Errors.notFound('Exam');
        await this.assertCourseAccess(tx, scope, user, blueprint.courseId);

        const open = await tx.examAttempt.findFirst({
          where: { tenantId: scope.tenantId, blueprintId: examId, userId: user.userId, status: 'IN_PROGRESS' },
          include: attemptInclude,
        });
        if (open) {
          const current = await this.expireIfDue(tx, open);
          if (current.status === 'IN_PROGRESS') {
            return { attempt: this.toView(current), created: false };
          }
        }

        const used = await tx.examAttempt.count({
          where: { tenantId: scope.tenantId, blueprintId: examId, userId: user.userId },
        });
        if (blueprint.maxAttempts !== null && used >= blueprint.maxAttempts) {
          throw Errors.attemptLimitReached();
        }

        const picked: { questionId: string; sectionKey: string; snapshot: ItemSnapshot; answerKey: string[]; explanation: string | null }[] = [];
        for (const section of blueprint.sections) {
          const pool = await tx.question.findMany({
            where: {
              tenantId: scope.tenantId,
              programId: blueprint.programId,
              sectionKey: section.sectionKey,
              status: 'ACTIVE',
            },
            orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
          });
          let chosen: typeof pool;
          try {
            chosen = pickQuestions(pool, section.questionCount, blueprint.shuffleQuestions);
          } catch {
            throw Errors.examNotAvailable();
          }
          for (const question of chosen) {
            picked.push({
              questionId: question.id,
              sectionKey: section.sectionKey,
              snapshot: {
                type: question.type,
                prompt: question.prompt,
                passage: question.passage,
                choices: question.choices as unknown as Choice[],
                marks: question.marks,
                version: question.version,
              },
              answerKey: question.answerKey as unknown as string[],
              explanation: question.explanation,
            });
          }
        }

        const now = new Date();
        const attempt = await tx.examAttempt.create({
          data: {
            tenantId: scope.tenantId,
            blueprintId: examId,
            blueprintVersion: blueprint.version,
            userId: user.userId,
            attemptNumber: used + 1,
            startedAt: now,
            deadlineAt: new Date(now.getTime() + blueprint.timeLimitSec * 1000),
          },
        });
        await tx.examAttemptItem.createMany({
          data: picked.map((item, index) => ({
            tenantId: scope.tenantId,
            attemptId: attempt.id,
            questionId: item.questionId,
            sectionKey: item.sectionKey,
            position: index + 1,
            snapshot: item.snapshot as unknown as Prisma.InputJsonValue,
            answerKey: item.answerKey,
            explanation: item.explanation,
          })),
        });
        const created = await tx.examAttempt.findUniqueOrThrow({
          where: { id: attempt.id },
          include: attemptInclude,
        });
        return { attempt: this.toView(created), created: true };
      });
    } catch (error) {
      // Two concurrent starts: the loser resumes the winner's attempt.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const resumed = await this.db.run(ctx, (tx) =>
          tx.examAttempt.findFirst({
            where: { tenantId: scope.tenantId, blueprintId: examId, userId: user.userId, status: 'IN_PROGRESS' },
            include: attemptInclude,
          }),
        );
        if (resumed) return { attempt: this.toView(resumed), created: false };
      }
      throw error;
    }
  }

  get(scope: TenantScope, user: AuthUser, attemptId: string): Promise<AttemptView> {
    return this.db.run({ tenantId: scope.tenantId, userId: user.userId }, async (tx) => {
      const attempt = await this.loadOwnAttempt(tx, scope, user, attemptId);
      return this.toView(await this.expireIfDue(tx, attempt));
    });
  }

  /** Autosave: stores responses for an in-progress attempt before its deadline. */
  saveAnswers(
    scope: TenantScope,
    user: AuthUser,
    attemptId: string,
    input: SaveAnswersDto,
  ): Promise<AttemptView> {
    return this.db.run({ tenantId: scope.tenantId, userId: user.userId }, async (tx) => {
      const attempt = await this.loadOwnAttempt(tx, scope, user, attemptId);
      if (attempt.status !== 'IN_PROGRESS') throw Errors.attemptClosed();
      // Access can be revoked mid-attempt (refund, removal); stop accepting answers (FR-CATALOG-303).
      await this.assertCourseAccess(tx, scope, user, attempt.blueprint.courseId);
      // Late answers are rejected without writing; the next read or submit finalizes the attempt.
      if (attempt.deadlineAt.getTime() <= Date.now()) throw Errors.attemptExpired();

      const items = new Map(attempt.items.map((item) => [item.id, item]));
      const problems: string[] = [];
      for (const answer of input.answers) {
        const item = items.get(answer.itemId);
        if (!item) {
          problems.push(`${answer.itemId}: not part of this attempt`);
          continue;
        }
        const problem = validateResponse(item.snapshot as unknown as ItemSnapshot, answer.response);
        if (problem) problems.push(`${answer.itemId}: ${problem}`);
      }
      if (problems.length > 0) {
        throw new BadRequestException(problems);
      }

      const now = new Date();
      for (const answer of input.answers) {
        await tx.examAttemptItem.update({
          where: { id: answer.itemId },
          data: { response: answer.response as Prisma.InputJsonValue, answeredAt: now },
        });
      }
      const updated = await tx.examAttempt.findUniqueOrThrow({
        where: { id: attempt.id },
        include: attemptInclude,
      });
      return this.toView(updated);
    });
  }

  /** Grades on the server and records result revision 1. Submitting twice is rejected. */
  async submit(scope: TenantScope, user: AuthUser, attemptId: string): Promise<AttemptView> {
    try {
      return await this.db.run({ tenantId: scope.tenantId, userId: user.userId }, async (tx) => {
        const loaded = await this.loadOwnAttempt(tx, scope, user, attemptId);
        if (loaded.status === 'IN_PROGRESS') {
          await this.assertCourseAccess(tx, scope, user, loaded.blueprint.courseId);
        }
        const attempt = await this.expireIfDue(tx, loaded);
        if (attempt.status === 'EXPIRED') return this.toView(attempt);
        if (attempt.status !== 'IN_PROGRESS') throw Errors.attemptClosed();
        return this.toView(await this.finalize(tx, attempt, 'SUBMITTED', new Date()));
      });
    } catch (error) {
      const code = error instanceof Error && 'code' in error ? String((error as { code: unknown }).code) : 'UNKNOWN';
      if (!['ATTEMPT_CLOSED', 'RESOURCE_NOT_FOUND'].includes(code)) {
        this.metrics.examSubmissionFailed(/^[A-Z0-9_]+$/.test(code) ? code : 'UNKNOWN');
      }
      throw error;
    }
  }

  private async assertCourseAccess(tx: Tx, scope: TenantScope, user: AuthUser, courseId: string): Promise<void> {
    if (canAuthor(scope.role)) return;
    if (!(await hasActiveEntitlement(tx, scope.tenantId, user.userId, courseId))) {
      throw Errors.notEntitled();
    }
  }

  /** Learners can only open their own attempts; others' attempts are indistinguishable from 404. */
  private async loadOwnAttempt(tx: Tx, scope: TenantScope, user: AuthUser, attemptId: string): Promise<AttemptRecord> {
    const attempt = await tx.examAttempt.findFirst({
      where: { id: attemptId, tenantId: scope.tenantId, userId: user.userId },
      include: attemptInclude,
    });
    if (!attempt) throw Errors.notFound('Attempt');
    return attempt;
  }

  /** Auto-submits an attempt whose deadline passed, grading only answers saved in time. */
  private async expireIfDue(tx: Tx, attempt: AttemptRecord): Promise<AttemptRecord> {
    if (attempt.status !== 'IN_PROGRESS' || attempt.deadlineAt.getTime() > Date.now()) return attempt;
    return this.finalize(tx, attempt, 'EXPIRED', attempt.deadlineAt);
  }

  private async finalize(
    tx: Tx,
    attempt: AttemptRecord,
    status: 'SUBMITTED' | 'EXPIRED',
    submittedAt: Date,
  ): Promise<AttemptRecord> {
    // Guarded update: only one concurrent finalizer can move the attempt out of IN_PROGRESS.
    const claimed = await tx.examAttempt.updateMany({
      where: { id: attempt.id, status: 'IN_PROGRESS' },
      data: { status, submittedAt },
    });
    if (claimed.count === 0) throw Errors.attemptClosed();

    const graded = gradeAttempt(
      attempt.items.map((item) => {
        const snapshot = item.snapshot as unknown as ItemSnapshot;
        return {
          type: snapshot.type,
          choices: snapshot.choices,
          marks: snapshot.marks,
          sectionKey: item.sectionKey,
          answerKey: item.answerKey as unknown as string[],
          response: (item.response as AnswerResponse | null) ?? null,
        };
      }),
      attempt.blueprint.sections.map((section) => ({ sectionKey: section.sectionKey, title: section.title })),
      attempt.blueprint.passPercent,
    );

    for (const [index, item] of attempt.items.entries()) {
      const outcome = graded.items[index];
      if (!outcome) continue;
      await tx.examAttemptItem.update({
        where: { id: item.id },
        data: { isCorrect: outcome.isCorrect, marksAwarded: outcome.marksAwarded },
      });
    }
    await tx.examResult.create({
      data: {
        tenantId: attempt.tenantId,
        attemptId: attempt.id,
        revision: 1,
        score: graded.score,
        maxScore: graded.maxScore,
        passed: graded.passed,
        sectionBreakdown: graded.sectionBreakdown as unknown as Prisma.InputJsonValue,
      },
    });
    return tx.examAttempt.findUniqueOrThrow({ where: { id: attempt.id }, include: attemptInclude });
  }

  private toView(attempt: AttemptRecord): AttemptView {
    const closed = attempt.status !== 'IN_PROGRESS';
    const releaseAnswers = closed && attempt.blueprint.answerRelease === 'AFTER_SUBMIT';
    const result = attempt.results[0];
    return {
      id: attempt.id,
      examId: attempt.blueprintId,
      examTitle: attempt.blueprint.title,
      attemptNumber: attempt.attemptNumber,
      status: attempt.status,
      startedAt: attempt.startedAt,
      deadlineAt: attempt.deadlineAt,
      submittedAt: attempt.submittedAt,
      remainingSec: closed ? 0 : Math.max(0, Math.floor((attempt.deadlineAt.getTime() - Date.now()) / 1000)),
      items: attempt.items.map((item) => {
        const snapshot = item.snapshot as unknown as ItemSnapshot;
        const view: AttemptItemView = {
          id: item.id,
          position: item.position,
          sectionKey: item.sectionKey,
          type: snapshot.type,
          prompt: snapshot.prompt,
          passage: snapshot.passage,
          choices: snapshot.choices,
          marks: snapshot.marks,
          response: (item.response as AnswerResponse | null) ?? null,
        };
        if (closed) {
          view.isCorrect = item.isCorrect;
          view.marksAwarded = item.marksAwarded;
        }
        // Answer keys never leave the server before the attempt closes (FR-ASSESS-502).
        if (releaseAnswers) {
          view.answerKey = item.answerKey as unknown as string[];
          view.explanation = item.explanation;
        }
        return view;
      }),
      result: result
        ? {
            score: result.score,
            maxScore: result.maxScore,
            passed: result.passed,
            sectionBreakdown: result.sectionBreakdown,
            revision: result.revision,
            notice: PRACTICE_SCORE_NOTICE,
          }
        : null,
    };
  }
}
