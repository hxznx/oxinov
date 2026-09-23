/**
 * Enrollment, entitlement-gated content, and server-graded exams against real PostgreSQL
 * (FR-CATALOG-303, FR-COURSE-204, FR-ASSESS-501/502, FR-EXAM-1203/1204, acceptance journeys 1, 4, 6).
 */
import { SEED, createTestContext, ownerQuery, resetDatabase, type TestContext } from './helpers';

interface Item {
  id: string;
  type: string;
  choices: { id: string }[];
  answerKey?: string[];
}

describe('learning and exams', () => {
  let ctx: TestContext;
  const bearer = async (subject: string) => ({ Authorization: `Bearer ${await ctx.devToken(subject)}` });
  const base = `/v1/tenants/${SEED.sakura}`;

  beforeAll(async () => {
    await resetDatabase();
    ctx = await createTestContext();
  });

  afterAll(async () => {
    await ctx?.app.close();
  });

  describe('enrollment and access', () => {
    it('enrolls in a free course once, and refuses paid courses without a verified payment', async () => {
      const headers = await bearer(SEED.users.bikash);
      const first = await ctx.http.post(`${base}/courses/${SEED.freeCourse}/enrollments`).set(headers);
      expect(first.status).toBe(201);
      expect(first.body.data.hasAccess).toBe(true);

      const again = await ctx.http.post(`${base}/courses/${SEED.freeCourse}/enrollments`).set(headers);
      expect(again.status).toBe(200);
      expect(again.body.data.id).toBe(first.body.data.id);

      const paid = await ctx.http.post(`${base}/courses/${SEED.paidCourse}/enrollments`).set(headers);
      expect(paid.status).toBe(402);
      expect(paid.body.error.code).toBe('PAYMENT_REQUIRED');

      const mine = await ctx.http.get(`${base}/me/enrollments`).set(headers);
      expect(mine.body.data).toHaveLength(1);
    });

    it('serves preview lessons to members but gates the rest on an entitlement', async () => {
      const headers = await bearer(SEED.users.aiko);
      const preview = await ctx.http.get(`${base}/courses/${SEED.paidCourse}/lessons/${SEED.paidPreviewLesson}`).set(headers);
      expect(preview.status).toBe(200);
      expect(preview.body.data.bodyMarkdown).toContain('は');

      const locked = await ctx.http.get(`${base}/courses/${SEED.paidCourse}/lessons/${SEED.paidLesson}`).set(headers);
      expect(locked.status).toBe(403);
      expect(locked.body.error.code).toBe('NOT_ENTITLED');

      const detail = await ctx.http.get(`${base}/courses/${SEED.paidCourse}`).set(headers);
      expect(detail.body.data.access.entitled).toBe(false);
      expect(detail.body.data.curriculum).toHaveLength(2);
      expect(detail.body.data.price).toEqual({ amountMinor: 4900, currency: 'JPY' });
    });

    it('does not open exams without course access', async () => {
      const response = await ctx.http.get(`${base}/courses/${SEED.paidCourse}/exams`).set(await bearer(SEED.users.aiko));
      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('NOT_ENTITLED');
    });
  });

  describe('practice exam attempt', () => {
    let attemptId: string;
    let items: Item[];

    it('starts an attempt without exposing answer keys, and resumes it on retry', async () => {
      const headers = await bearer(SEED.users.bikash);
      const exams = await ctx.http.get(`${base}/courses/${SEED.freeCourse}/exams`).set(headers);
      expect(exams.status).toBe(200);
      expect(exams.body.data.map((exam: { id: string }) => exam.id)).toEqual([SEED.practiceExam]);

      const started = await ctx.http.post(`${base}/exams/${SEED.practiceExam}/attempts`).set(headers);
      expect(started.status).toBe(201);
      attemptId = started.body.data.id;
      items = started.body.data.items;
      expect(items).toHaveLength(3);
      expect(started.body.data.status).toBe('IN_PROGRESS');
      expect(started.body.data.remainingSec).toBeGreaterThan(590);
      expect(JSON.stringify(started.body.data)).not.toMatch(/answerKey|explanation/);

      const resumed = await ctx.http.post(`${base}/exams/${SEED.practiceExam}/attempts`).set(headers);
      expect(resumed.status).toBe(200);
      expect(resumed.body.data.id).toBe(attemptId);
    });

    it('rejects malformed answers and keeps attempts private to their owner', async () => {
      const bad = await ctx.http
        .put(`${base}/exam-attempts/${attemptId}/answers`)
        .set(await bearer(SEED.users.bikash))
        .send({ answers: [{ itemId: items[0]?.id, response: { choiceIds: ['zzz'] } }] });
      expect(bad.status).toBe(400);
      expect(bad.body.error.details[0]).toMatch(/unknown choice/);

      const other = await ctx.http.get(`${base}/exam-attempts/${attemptId}`).set(await bearer(SEED.users.aiko));
      expect(other.status).toBe(404);
    });

    it('autosaves, grades on submit, releases answers, and labels the score as practice', async () => {
      const headers = await bearer(SEED.users.bikash);
      // Answer the first item with its first choice and leave the rest blank.
      const first = items[0] as Item;
      const answer = first.type === 'FILL_BLANK' ? { text: 'cat' } : { choiceIds: [first.choices[0]?.id] };
      const saved = await ctx.http
        .put(`${base}/exam-attempts/${attemptId}/answers`)
        .set(headers)
        .send({ answers: [{ itemId: first.id, response: answer }] });
      expect(saved.status).toBe(200);
      expect(saved.body.data.items[0].response).toEqual(answer);

      const submitted = await ctx.http.post(`${base}/exam-attempts/${attemptId}/submit`).set(headers);
      expect(submitted.status).toBe(200);
      const view = submitted.body.data;
      expect(view.status).toBe('SUBMITTED');
      expect(view.result.maxScore).toBe(3);
      expect(view.result.score).toBeLessThanOrEqual(1);
      expect(view.result.notice).toMatch(/not an official/i);
      expect(view.items.every((item: Item) => Array.isArray(item.answerKey))).toBe(true);
      expect(view.items[1].isCorrect).toBe(false);

      const twice = await ctx.http.post(`${base}/exam-attempts/${attemptId}/submit`).set(headers);
      expect(twice.status).toBe(409);
      expect(twice.body.error.code).toBe('ATTEMPT_CLOSED');
    });

    it('grades every answer correctly when the key is followed', async () => {
      const headers = await bearer(SEED.users.bikash);
      const started = await ctx.http.post(`${base}/exams/${SEED.practiceExam}/attempts`).set(headers);
      expect(started.status).toBe(201);
      expect(started.body.data.attemptNumber).toBe(2);
      const ids = started.body.data.items.map((item: Item) => item.id);
      const keys = await ownerQuery<{ id: string; answer_key: string[]; type: string }>(
        `SELECT i.id, i.answer_key, i.snapshot->>'type' AS type FROM exam_attempt_items i WHERE i.attempt_id = $1`,
        [started.body.data.id],
      );
      const answers = ids.map((itemId: string) => {
        const key = keys.find((row) => row.id === itemId);
        return {
          itemId,
          response: key?.type === 'FILL_BLANK' ? { text: key.answer_key[0] } : { choiceIds: key?.answer_key },
        };
      });
      await ctx.http.put(`${base}/exam-attempts/${started.body.data.id}/answers`).set(headers).send({ answers }).expect(200);
      const submitted = await ctx.http.post(`${base}/exam-attempts/${started.body.data.id}/submit`).set(headers);
      expect(submitted.body.data.result).toMatchObject({ score: 3, maxScore: 3, passed: true });
    });

    it('rejects late answers and auto-submits an expired attempt with what was saved', async () => {
      const headers = await bearer(SEED.users.bikash);
      const started = await ctx.http.post(`${base}/exams/${SEED.practiceExam}/attempts`).set(headers);
      const id = started.body.data.id as string;
      await ownerQuery(`UPDATE exam_attempts SET deadline_at = now() - interval '1 second' WHERE id = $1`, [id]);

      const late = await ctx.http
        .put(`${base}/exam-attempts/${id}/answers`)
        .set(headers)
        .send({ answers: [{ itemId: started.body.data.items[0].id, response: { choiceIds: ['a'] } }] });
      expect(late.status).toBe(409);
      expect(late.body.error.code).toBe('ATTEMPT_EXPIRED');

      const view = await ctx.http.get(`${base}/exam-attempts/${id}`).set(headers);
      expect(view.status).toBe(200);
      expect(view.body.data.status).toBe('EXPIRED');
      expect(view.body.data.result).toMatchObject({ score: 0, passed: false });
    });
  });

  describe('mock exam with an attempt limit', () => {
    it('freezes 5+5 questions per attempt and stops after the third attempt', async () => {
      // Paid access normally comes from a verified payment event (not built yet): grant it directly.
      const [aiko] = await ownerQuery<{ id: string }>(
        `SELECT id FROM user_profiles WHERE auth_subject = $1`,
        [SEED.users.aiko],
      );
      const [enrollment] = await ownerQuery<{ id: string }>(
        `INSERT INTO enrollments (tenant_id, user_id, course_id) VALUES ($1, $2, $3) RETURNING id`,
        [SEED.sakura, aiko?.id, SEED.paidCourse],
      );
      await ownerQuery(
        `INSERT INTO entitlements (tenant_id, user_id, course_id, enrollment_id, source) VALUES ($1, $2, $3, $4, 'ADMIN_GRANT')`,
        [SEED.sakura, aiko?.id, SEED.paidCourse, enrollment?.id],
      );

      const headers = await bearer(SEED.users.aiko);
      const exams = await ctx.http.get(`${base}/courses/${SEED.paidCourse}/exams`).set(headers);
      // The DRAFT listening mock is not offered to learners.
      expect(exams.body.data.map((exam: { id: string }) => exam.id)).toEqual([SEED.mockExam]);

      for (let attempt = 1; attempt <= 3; attempt += 1) {
        const started = await ctx.http.post(`${base}/exams/${SEED.mockExam}/attempts`).set(headers);
        expect(started.status).toBe(201);
        const sections = started.body.data.items.map((item: { sectionKey: string }) => item.sectionKey);
        expect(sections.filter((key: string) => key === 'vocabulary')).toHaveLength(5);
        expect(sections.filter((key: string) => key === 'grammar')).toHaveLength(5);
        await ctx.http.post(`${base}/exam-attempts/${started.body.data.id}/submit`).set(headers).expect(200);
      }

      const fourth = await ctx.http.post(`${base}/exams/${SEED.mockExam}/attempts`).set(headers);
      expect(fourth.status).toBe(409);
      expect(fourth.body.error.code).toBe('ATTEMPT_LIMIT_REACHED');

      const draft = await ctx.http.post(`${base}/exams/${SEED.draftExam}/attempts`).set(headers);
      expect(draft.status).toBe(404);
    });
  });
});
