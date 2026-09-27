/**
 * Two-tenant isolation through the API (NFR-11, FR-TENANT-1601/1602/1605, acceptance journey 11).
 * Each denied path must look exactly like "not found" and must emit a schema-valid security event.
 */
import { SEED, assertValidSecurityEvent, createTestContext, resetDatabase, type TestContext } from './helpers';

describe('tenant isolation (API + PostgreSQL RLS)', () => {
  let ctx: TestContext;
  const bearer = async (subject: string) => ({ Authorization: `Bearer ${await ctx.devToken(subject)}` });

  beforeAll(async () => {
    await resetDatabase();
    ctx = await createTestContext();
  });

  afterAll(async () => {
    await ctx?.app.close();
  });

  beforeEach(() => {
    ctx.securityEvents.length = 0;
  });

  describe('authentication', () => {
    it('rejects missing and forged tokens with the stable error envelope', async () => {
      const missing = await ctx.http.get('/v1/tenants');
      expect(missing.status).toBe(401);
      expect(missing.body.error.code).toBe('UNAUTHENTICATED');
      expect(missing.body.error.requestId).toMatch(/^[0-9a-f-]{36}$/);
      expect(missing.headers['x-request-id']).toBe(missing.body.error.requestId);

      const forged = await ctx.http.get('/v1/tenants').set('Authorization', 'Bearer not.a.jwt');
      expect(forged.status).toBe(401);
    });

    it('accepts identity-provider RS256 tokens verified through the JWKS', async () => {
      const token = await ctx.idpToken('user_idp_123', { email: 'Mina@Example.com', email_verified: true });
      const response = await ctx.http.get('/v1/tenants').set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
    });

    it('rejects a token signed by an unknown key even with a trusted issuer', async () => {
      const { SignJWT } = await import('jose');
      const token = await new SignJWT({})
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuer('oxinov-dev')
        .setSubject(SEED.users.aiko)
        .setExpirationTime('5m')
        .sign(new TextEncoder().encode('a-different-secret-that-is-long-enough-000'));
      const response = await ctx.http.get('/v1/tenants').set('Authorization', `Bearer ${token}`);
      expect(response.status).toBe(401);
    });
  });

  describe('workspace listing', () => {
    it('shows each user only workspaces with an active membership', async () => {
      const aiko = await ctx.http.get('/v1/tenants').set(await bearer(SEED.users.aiko));
      expect(aiko.status).toBe(200);
      expect(aiko.body.data.map((w: { slug: string }) => w.slug).sort()).toEqual(['everest', 'sakura']);
      expect(aiko.body.data.every((w: { role: string }) => w.role === 'LEARNER')).toBe(true);

      const bikash = await ctx.http.get('/v1/tenants').set(await bearer(SEED.users.bikash));
      expect(bikash.body.data.map((w: { slug: string }) => w.slug)).toEqual(['sakura']);
    });

    it('denies a non-member with 404 and emits tenant.cross_access.denied', async () => {
      const response = await ctx.http.get(`/v1/tenants/${SEED.everest}`).set(await bearer(SEED.users.bikash));
      expect(response.status).toBe(404);
      expect(response.body.error.code).toBe('RESOURCE_NOT_FOUND');

      const event = ctx.securityEvents.find((e) => e.event.action === 'tenant.cross_access.denied');
      expect(event).toBeDefined();
      assertValidSecurityEvent(event);
      expect(event?.tenant?.id).toBe(SEED.everest);
      expect(event?.event.severity).toBe(8);
    });

    it('gives the same 404 for a nonexistent tenant and a malformed tenant ID', async () => {
      const headers = await bearer(SEED.users.bikash);
      const unknown = await ctx.http.get('/v1/tenants/00000000-0000-4000-8000-000000000000').set(headers);
      const malformed = await ctx.http.get('/v1/tenants/not-a-uuid').set(headers);
      expect(unknown.status).toBe(404);
      expect(malformed.status).toBe(404);
      expect(unknown.body.error.message).toBe(malformed.body.error.message);
    });
  });

  describe('cross-tenant object access', () => {
    it("cannot read another tenant's course through a tenant the caller belongs to", async () => {
      // Aiko belongs to both tenants, so tenant membership alone passes; the object must not.
      const response = await ctx.http
        .get(`/v1/tenants/${SEED.sakura}/courses/${SEED.everestCourse}`)
        .set(await bearer(SEED.users.aiko));
      expect(response.status).toBe(404);
    });

    it("cannot enroll in, open lessons of, or start exams of another tenant's objects", async () => {
      const headers = await bearer(SEED.users.aiko);
      const enroll = await ctx.http
        .post(`/v1/tenants/${SEED.sakura}/courses/${SEED.everestCourse}/enrollments`)
        .set(headers);
      expect(enroll.status).toBe(404);

      const exam = await ctx.http
        .post(`/v1/tenants/${SEED.everest}/exams/${SEED.practiceExam}/attempts`)
        .set(headers);
      expect(exam.status).toBe(404);

      const lesson = await ctx.http
        .get(`/v1/tenants/${SEED.everest}/courses/${SEED.everestCourse}/lessons/${SEED.freePreviewLesson}`)
        .set(headers);
      expect(lesson.status).toBe(404);
    });

    it("never lists another tenant's courses", async () => {
      const response = await ctx.http
        .get(`/v1/tenants/${SEED.everest}/courses`)
        .set(await bearer(SEED.users.everestOwner));
      expect(response.status).toBe(200);
      const ids = response.body.data.map((course: { id: string }) => course.id);
      expect(ids).toEqual([SEED.everestCourse]);
    });

    it('rejects a course whose program belongs to another tenant', async () => {
      const response = await ctx.http
        .post(`/v1/tenants/${SEED.sakura}/courses`)
        .set(await bearer(SEED.users.instructor))
        .send({
          slug: 'smuggled-program',
          title: 'Smuggled program',
          summary: 'Tries to reference another tenant program.',
          language: 'en',
          programId: SEED.everestProgram,
          priceMinor: 0,
          currency: 'JPY',
        });
      expect(response.status).toBe(404);
    });
  });

  describe('roles inside a tenant', () => {
    it('lets learners see only published courses', async () => {
      const response = await ctx.http.get(`/v1/tenants/${SEED.sakura}/courses`).set(await bearer(SEED.users.bikash));
      expect(response.status).toBe(200);
      const ids = response.body.data.map((course: { id: string }) => course.id).sort();
      expect(ids).toEqual([SEED.freeCourse, SEED.paidCourse].sort());

      const draft = await ctx.http
        .get(`/v1/tenants/${SEED.sakura}/courses/${SEED.draftCourse}`)
        .set(await bearer(SEED.users.bikash));
      expect(draft.status).toBe(404);
    });

    it('lets instructors see drafts and create courses; learners get 403 with an audit event', async () => {
      const instructor = await bearer(SEED.users.instructor);
      const list = await ctx.http.get(`/v1/tenants/${SEED.sakura}/courses`).set(instructor);
      expect(list.body.data).toHaveLength(3);

      const created = await ctx.http
        .post(`/v1/tenants/${SEED.sakura}/courses`)
        .set(instructor)
        .send({
          slug: 'n5-kanji-30-days',
          title: 'N5 Kanji in 30 Days',
          summary: 'Learn the N5 kanji one small group per day.',
          language: 'en',
          programId: SEED.sakuraProgram,
          priceMinor: 2500,
          currency: 'JPY',
        });
      expect(created.status).toBe(201);
      expect(created.body.data.status).toBe('DRAFT');

      const learner = await ctx.http
        .post(`/v1/tenants/${SEED.sakura}/courses`)
        .set(await bearer(SEED.users.bikash))
        .send({ slug: 'nope', title: 'Nope', summary: 'Learners cannot author.', language: 'en', priceMinor: 0, currency: 'JPY' });
      expect(learner.status).toBe(403);
      expect(learner.body.error.code).toBe('FORBIDDEN');
      const denied = ctx.securityEvents.find((e) => e.event.action === 'authorization.denied');
      assertValidSecurityEvent(denied);
    });

    it('reports every invalid field', async () => {
      const response = await ctx.http
        .post(`/v1/tenants/${SEED.sakura}/courses`)
        .set(await bearer(SEED.users.instructor))
        .send({ slug: 'Bad Slug', title: 'x', priceMinor: -1, currency: 'yen', extra: true });
      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('VALIDATION_FAILED');
      expect(response.body.error.details.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('self-service workspace creation (FR-TENANT-1601)', () => {
    it('creates a workspace idempotently and isolates it from other users', async () => {
      const founder = { Authorization: `Bearer ${await ctx.idpToken('user_founder', { email: 'f@x.example', email_verified: true })}` };
      const body = { slug: 'himalaya-lang', name: 'Himalaya Language Lab', primaryColor: '#2E7D32' };

      const first = await ctx.http.post('/v1/tenants').set(founder).send(body);
      expect(first.status).toBe(201);
      expect(first.body.data.role).toBe('OWNER');

      const retry = await ctx.http.post('/v1/tenants').set(founder).send(body);
      expect(retry.status).toBe(200);
      expect(retry.body.data.id).toBe(first.body.data.id);

      const other = await ctx.http.post('/v1/tenants').set(await bearer(SEED.users.aiko)).send(body);
      expect(other.status).toBe(409);
      expect(other.body.error.code).toBe('SLUG_UNAVAILABLE');

      const peek = await ctx.http.get(`/v1/tenants/${first.body.data.id}`).set(await bearer(SEED.users.aiko));
      expect(peek.status).toBe(404);

      const own = await ctx.http.get(`/v1/tenants/${first.body.data.id}`).set(founder);
      expect(own.status).toBe(200);
      expect(own.body.data.slug).toBe('himalaya-lang');
    });

    it('requires a verified email and refuses reserved addresses', async () => {
      const unverified = await ctx.http
        .post('/v1/tenants')
        .set('Authorization', `Bearer ${await ctx.devToken('dev|unverified', { emailVerified: false })}`)
        .send({ slug: 'my-school', name: 'My School' });
      expect(unverified.status).toBe(403);
      expect(unverified.body.error.code).toBe('EMAIL_NOT_VERIFIED');

      const reserved = await ctx.http.post('/v1/tenants').set(await bearer(SEED.users.aiko)).send({ slug: 'admin', name: 'Admin' });
      expect(reserved.status).toBe(409);
    });
  });

  describe('operations endpoints', () => {
    it('serves liveness, readiness, and bounded-cardinality metrics without auth', async () => {
      expect((await ctx.http.get('/health/live')).status).toBe(200);
      const ready = await ctx.http.get('/health/ready');
      expect(ready.status).toBe(200);
      expect(ready.body.checks.database).toBe('ok');

      const metrics = await ctx.http.get('/metrics');
      expect(metrics.status).toBe(200);
      expect(metrics.text).toContain('oxinov_http_requests_total');
      expect(metrics.text).toContain('route="/v1/tenants/:tenantId/courses"');
      // No tenant, user, or course identifiers in metric labels.
      expect(metrics.text).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/);
    });

    it('keeps tokens out of logs', () => {
      const joined = ctx.logs.join('\n');
      expect(joined).not.toMatch(/Bearer\s+ey/);
      expect(joined).toContain('request.completed');
    });
  });
});
