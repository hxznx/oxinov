/**
 * Lesson completion, the course completion rule, certificates, public verification, and revocation against
 * real PostgreSQL (FR-PLAYER-402, FR-CERT-601, FR-CERT-602, acceptance journey 1).
 */
import { SEED, createTestContext, ownerQuery, resetDatabase, type TestContext } from './helpers';

const FREE_LESSONS = ['aaaaaaaa-0000-4000-8000-000000000451', 'aaaaaaaa-0000-4000-8000-000000000452', 'aaaaaaaa-0000-4000-8000-000000000453'];
const PAID_LESSONS = [SEED.paidPreviewLesson, SEED.paidLesson];
const AIKO = '11111111-0000-4000-8000-000000000003';
const BIKASH = '11111111-0000-4000-8000-000000000005';

describe('certificates', () => {
  let ctx: TestContext;
  const bearer = async (subject: string) => ({ Authorization: `Bearer ${await ctx.devToken(subject)}` });
  const base = `/v1/tenants/${SEED.sakura}`;
  const progress = async (subject: string, courseId: string) =>
    ctx.http.get(`${base}/courses/${courseId}/progress`).set(await bearer(subject));
  const complete = async (subject: string, courseId: string, lessonId: string) =>
    ctx.http.post(`${base}/courses/${courseId}/lessons/${lessonId}/complete`).set(await bearer(subject));
  let code = '';

  beforeAll(async () => {
    await resetDatabase();
    ctx = await createTestContext();
  });

  afterAll(async () => {
    await ctx?.app.close();
  });

  it('shows progress only to learners with access', async () => {
    expect((await progress(SEED.users.aiko, SEED.freeCourse)).body.error.code).toBe('NOT_ENTITLED');
    expect((await complete(SEED.users.aiko, SEED.freeCourse, FREE_LESSONS[0]!)).body.error.code).toBe('NOT_ENTITLED');
  });

  it('issues one certificate when every required lesson is complete, and returns it unchanged afterwards', async () => {
    const enroll = await ctx.http.post(`${base}/courses/${SEED.freeCourse}/enrollments`).set(await bearer(SEED.users.aiko));
    expect(enroll.status).toBe(201);

    let status = await progress(SEED.users.aiko, SEED.freeCourse);
    expect(status.body.data).toMatchObject({ complete: false, requiredLessons: 3, completedRequiredLessons: 0, certificate: null, exams: [] });

    // Confirming twice counts once; practice quizzes never block completion.
    await complete(SEED.users.aiko, SEED.freeCourse, FREE_LESSONS[0]!);
    status = await complete(SEED.users.aiko, SEED.freeCourse, FREE_LESSONS[0]!);
    expect(status.status).toBe(200);
    expect(status.body.data).toMatchObject({ completedRequiredLessons: 1, certificate: null });
    await complete(SEED.users.aiko, SEED.freeCourse, FREE_LESSONS[1]!);

    status = await complete(SEED.users.aiko, SEED.freeCourse, FREE_LESSONS[2]!);
    expect(status.body.data.complete).toBe(true);
    const certificate = status.body.data.certificate;
    expect(certificate).toMatchObject({
      holderName: 'Aiko Rai',
      courseTitle: expect.any(String),
      schoolName: 'Sakura Japanese School',
      instructorName: 'Kenji Mori',
      status: 'VALID',
    });
    expect(certificate.code).toMatch(/^[A-HJKMNP-Z2-9]{16}$/);
    code = certificate.code;

    // Concurrent and later requests return the same certificate; there is only ever one.
    const again = await Promise.all([progress(SEED.users.aiko, SEED.freeCourse), progress(SEED.users.aiko, SEED.freeCourse)]);
    expect(again.map((r) => (r.body as { data: { certificate: { code: string } } }).data.certificate.code)).toEqual([code, code]);
    const rows = await ownerQuery<{ n: string }>(`SELECT count(*)::text AS n FROM certificates WHERE user_id = $1`, [AIKO]);
    expect(rows[0]?.n).toBe('1');

    const mine = await ctx.http.get(`${base}/me/certificates`).set(await bearer(SEED.users.aiko));
    expect(mine.body.data.map((c: { code: string }) => c.code)).toEqual([code]);
  });

  it('lets anyone verify a certificate without signing in, showing only what a verifier needs', async () => {
    const verified = await ctx.http.get(`/v1/certificates/${code.toLowerCase().replace(/(.{4})(?!$)/g, '$1-')}`);
    expect(verified.status).toBe(200);
    expect(Object.keys(verified.body.data).sort()).toEqual(['code', 'courseTitle', 'holderName', 'issuedAt', 'schoolName', 'status']);
    expect(verified.body.data).toMatchObject({ code, holderName: 'Aiko Rai', schoolName: 'Sakura Japanese School', status: 'VALID' });

    for (const unknown of ['AAAAAAAAAAAAAAAA', 'not-a-code', '0000000000000000']) {
      const missing = await ctx.http.get(`/v1/certificates/${unknown}`);
      expect(missing.status).toBe(404);
      expect(JSON.stringify(missing.body)).not.toContain('aiko');
    }
  });

  it('keeps certificate records private to the holder and the school administrators', async () => {
    expect((await ctx.http.get(`${base}/certificates/${code}`).set(await bearer(SEED.users.bikash))).status).toBe(404);
    expect((await ctx.http.get(`${base}/certificates/${code}`).set(await bearer(SEED.users.instructor))).status).toBe(404);
    expect((await ctx.http.get(`${base}/certificates/${code}`).set(await bearer(SEED.users.sakuraOwner))).status).toBe(200);
    expect((await ctx.http.get(`/v1/tenants/${SEED.everest}/certificates/${code}`).set(await bearer(SEED.users.everestOwner))).status).toBe(404);
    const list = await ctx.http.get(`${base}/courses/${SEED.freeCourse}/certificates`).set(await bearer(SEED.users.aiko));
    expect(list.status).toBe(403);
  });

  it('lets administrators revoke with a reason, which verification shows at once', async () => {
    const byLearner = await ctx.http.post(`${base}/certificates/${code}/revoke`).set(await bearer(SEED.users.aiko)).send({ reason: 'mistake' });
    expect(byLearner.status).toBe(403);

    const revoked = await ctx.http
      .post(`${base}/certificates/${code}/revoke`)
      .set(await bearer(SEED.users.sakuraOwner))
      .send({ reason: 'Issued in error during testing' });
    expect(revoked.status).toBe(200);
    expect(revoked.body.data).toMatchObject({ status: 'REVOKED', revokeReason: 'Issued in error during testing' });

    const verified = await ctx.http.get(`/v1/certificates/${code}`);
    expect(verified.body.data.status).toBe('REVOKED');
    expect(JSON.stringify(verified.body)).not.toContain('Issued in error');

    const audit = await ownerQuery<{ action: string }>(
      `SELECT a.action FROM audit_events a JOIN certificates c ON c.id::text = a.target_id::text WHERE c.code = $1 ORDER BY a.created_at`,
      [code],
    );
    expect(audit.map((row) => row.action)).toEqual(['certificate.issued', 'certificate.revoked']);
  });

  it('requires a pass on every approved mock exam, and refuses to mark video or audio lessons by hand', async () => {
    await ownerQuery(
      `WITH e AS (INSERT INTO enrollments (tenant_id, user_id, course_id) VALUES ($1, $2, $3) RETURNING id)
       INSERT INTO entitlements (tenant_id, user_id, course_id, enrollment_id, source) SELECT $1, $2, $3, id, 'ADMIN_GRANT' FROM e`,
      [SEED.sakura, BIKASH, SEED.paidCourse],
    );
    for (const lesson of PAID_LESSONS) expect((await complete(SEED.users.bikash, SEED.paidCourse, lesson)).status).toBe(200);
    let status = await progress(SEED.users.bikash, SEED.paidCourse);
    expect(status.body.data.completedRequiredLessons).toBe(status.body.data.requiredLessons);
    expect(status.body.data).toMatchObject({ complete: false, exams: [{ id: SEED.mockExam, passed: false }], certificate: null });

    await ownerQuery(
      `WITH a AS (
         INSERT INTO exam_attempts (tenant_id, blueprint_id, blueprint_version, user_id, attempt_number, deadline_at, status, submitted_at)
         VALUES ($1, $2, 1, $3, 1, now(), 'SUBMITTED', now()) RETURNING id)
       INSERT INTO exam_results (tenant_id, attempt_id, score, max_score, passed, section_breakdown) SELECT $1, id, 9, 10, true, '[]' FROM a`,
      [SEED.sakura, SEED.mockExam, BIKASH],
    );
    status = await progress(SEED.users.bikash, SEED.paidCourse);
    expect(status.body.data).toMatchObject({ complete: true, exams: [{ passed: true }], certificate: { holderName: 'Bikash Gurung', status: 'VALID' } });

    await ownerQuery(`UPDATE lessons SET kind = 'VIDEO' WHERE id = $1`, [SEED.paidLesson]);
    const manual = await complete(SEED.users.bikash, SEED.paidCourse, SEED.paidLesson);
    expect(manual.status).toBe(409);
  });

  it('never lets a learner record completion for someone else or another school', async () => {
    const rows = await ownerQuery<{ user_id: string }>(`SELECT DISTINCT user_id::text FROM lesson_completions`);
    expect(rows.map((row) => row.user_id).sort()).toEqual([AIKO, BIKASH].sort());
    const other = await ctx.http
      .post(`/v1/tenants/${SEED.everest}/courses/${SEED.everestCourse}/lessons/${FREE_LESSONS[0]}/complete`)
      .set(await bearer(SEED.users.aiko));
    expect([403, 404]).toContain(other.status);
  });
});
