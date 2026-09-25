/**
 * Assignments (FR-ASSESS-503): drafts, deadlines and late work, submissions with text, links, and files,
 * grading with revision requests, kept history, and privacy between learners and courses.
 */
import { CreateBucketCommand, S3Client } from '@aws-sdk/client-s3';
import { SEED, createTestContext, resetDatabase, type TestContext } from './helpers';

const mediaEnabled = Boolean(process.env.TEST_MEDIA_S3_ENDPOINT);

describe('assignments', () => {
  let ctx: TestContext;
  const base = `/v1/tenants/${SEED.sakura}`;
  const auth = async (subject: string) => ({ Authorization: `Bearer ${await ctx.devToken(subject)}` });
  const api = async (subject: string, method: 'get' | 'post' | 'patch' | 'put' | 'delete', path: string, body?: object) => {
    const req = ctx.http[method](`${base}${path}`).set(await auth(subject));
    return body ? req.send(body) : req;
  };
  const teacher = SEED.users.instructor;
  const inDays = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString();
  let assignmentId = '';

  beforeAll(async () => {
    await resetDatabase();
    if (mediaEnabled) {
      const s3 = new S3Client({ region: 'ap-south-1', endpoint: process.env.MEDIA_S3_ENDPOINT, forcePathStyle: true });
      await s3.send(new CreateBucketCommand({ Bucket: process.env.MEDIA_BUCKET })).catch((error: Error) => {
        if (!['BucketAlreadyOwnedByYou', 'BucketAlreadyExists'].includes(error.name)) throw error;
      });
    }
    ctx = await createTestContext();
    await api(SEED.users.aiko, 'post', `/courses/${SEED.freeCourse}/enrollments`);
    await api(SEED.users.bikash, 'post', `/courses/${SEED.freeCourse}/enrollments`);
  });

  afterAll(async () => {
    await ctx?.app.close();
  });

  it('shows learners only published assignments', async () => {
    const created = await api(teacher, 'post', `/courses/${SEED.freeCourse}/assignments`, {
      title: 'Write five greetings',
      instructions: 'Write five greetings in hiragana, or upload a photo of your handwriting.',
      dueAt: inDays(7),
      maxPoints: 10,
      acceptFile: true,
      acceptText: true,
    });
    expect(created.status).toBe(201);
    assignmentId = created.body.data.id;
    expect(created.body.data).toMatchObject({ status: 'DRAFT', acceptFile: true, acceptText: true, acceptUrl: false, maxFileMb: 25 });

    expect((await api(SEED.users.aiko, 'get', `/courses/${SEED.freeCourse}/assignments`)).body.data).toEqual([]);
    expect((await api(SEED.users.aiko, 'get', `/assignments/${assignmentId}/mine`)).status).toBe(404);

    await api(teacher, 'post', `/assignments/${assignmentId}/publish`);
    const list = await api(SEED.users.aiko, 'get', `/courses/${SEED.freeCourse}/assignments`);
    expect(list.body.data).toMatchObject([{ id: assignmentId, myStatus: null }]);
    expect((await api(SEED.users.aiko, 'get', `/assignments/${assignmentId}/mine`)).body.data).toMatchObject({ status: 'DRAFT', canEdit: true, revisions: [] });
  });

  it('keeps drafts private, submits, requests a revision, and keeps every revision with its feedback', async () => {
    expect((await api(SEED.users.aiko, 'post', `/assignments/${assignmentId}/mine/submit`)).status).toBe(409);
    expect((await api(SEED.users.aiko, 'put', `/assignments/${assignmentId}/mine/draft`, { url: 'javascript:alert(1)' })).status).toBe(400);
    let mine = (await api(SEED.users.aiko, 'put', `/assignments/${assignmentId}/mine/draft`, { text: 'おはよう、こんにちは' })).body.data;
    expect(mine.draft.text).toBe('おはよう、こんにちは');

    // Teachers never see drafts.
    expect((await api(teacher, 'get', `/assignments/${assignmentId}/submissions`)).body.data).toEqual([]);

    mine = (await api(SEED.users.aiko, 'post', `/assignments/${assignmentId}/mine/submit`)).body.data;
    expect(mine).toMatchObject({ status: 'SUBMITTED', canEdit: false, revisions: [{ revision: 1, text: 'おはよう、こんにちは', late: false, outcome: null }] });
    expect((await api(SEED.users.aiko, 'put', `/assignments/${assignmentId}/mine/draft`, { text: 'changed' })).status).toBe(409);

    const list = (await api(teacher, 'get', `/assignments/${assignmentId}/submissions`)).body.data;
    expect(list).toMatchObject([{ learner: { email: 'aiko@learner.example' }, status: 'SUBMITTED', revisions: 1 }]);
    const submissionId: string = list[0].id;

    expect((await api(teacher, 'post', `/submissions/${submissionId}/grade`, { outcome: 'REVISION_REQUESTED' })).status).toBe(400);
    await api(teacher, 'post', `/submissions/${submissionId}/grade`, { outcome: 'REVISION_REQUESTED', feedback: 'Add three more greetings.' });
    expect((await api(teacher, 'post', `/submissions/${submissionId}/grade`, { outcome: 'PASSED' })).status).toBe(409);

    mine = (await api(SEED.users.aiko, 'get', `/assignments/${assignmentId}/mine`)).body.data;
    expect(mine).toMatchObject({ status: 'REVISION_REQUESTED', canEdit: true, draft: { text: 'おはよう、こんにちは' } });
    expect(mine.revisions[0]).toMatchObject({ outcome: 'REVISION_REQUESTED', feedback: 'Add three more greetings.' });

    await api(SEED.users.aiko, 'put', `/assignments/${assignmentId}/mine/draft`, { text: 'おはよう、こんにちは、こんばんは、ありがとう、さようなら' });
    await api(SEED.users.aiko, 'post', `/assignments/${assignmentId}/mine/submit`);

    expect((await api(teacher, 'post', `/submissions/${submissionId}/grade`, { outcome: 'PASSED', score: 11 })).status).toBe(400);
    const graded = (await api(teacher, 'post', `/submissions/${submissionId}/grade`, { outcome: 'PASSED', score: 9, feedback: 'Well done.' })).body.data;
    expect(graded.status).toBe('PASSED');
    expect(graded.revisions.map((r: { revision: number; outcome: string }) => [r.revision, r.outcome])).toEqual([
      [2, 'PASSED'],
      [1, 'REVISION_REQUESTED'],
    ]);

    mine = (await api(SEED.users.aiko, 'get', `/assignments/${assignmentId}/mine`)).body.data;
    expect(mine).toMatchObject({ status: 'PASSED', canEdit: false });
    expect(mine.revisions[0]).toMatchObject({ score: 9, feedback: 'Well done.' });
    expect((await api(SEED.users.aiko, 'post', `/assignments/${assignmentId}/mine/submit`)).status).toBe(409);
  });

  (mediaEnabled ? it : it.skip)('accepts real files with a download link and rejects impostors', async () => {
    const upload = async (fileName: string, contentType: string, bytes: Buffer) => {
      const ticket = await api(SEED.users.bikash, 'post', `/assignments/${assignmentId}/mine/upload`, { fileName, contentType, sizeBytes: bytes.length });
      expect(ticket.status).toBe(201);
      const put = await fetch(ticket.body.data.uploadUrl, { method: 'PUT', headers: ticket.body.data.headers, body: new Uint8Array(bytes) });
      expect(put.status).toBe(200);
      return api(SEED.users.bikash, 'post', `/assignments/${assignmentId}/mine/upload/complete`);
    };

    expect((await api(SEED.users.bikash, 'post', `/assignments/${assignmentId}/mine/upload`, { fileName: 'x.html', contentType: 'text/html', sizeBytes: 10 })).status).toBe(422);
    const fake = await upload('essay.pdf', 'application/pdf', Buffer.from('<html><script>alert(1)</script></html>'));
    expect(fake.status).toBe(422);
    expect(fake.body.error.code).toBe('MEDIA_INVALID');

    const pdf = Buffer.concat([Buffer.from('%PDF-1.7\n'), Buffer.alloc(2048, 32)]);
    const done = await upload('My greetings.pdf', 'application/pdf', pdf);
    expect(done.body.data.draft.file).toEqual({ name: 'My-greetings.pdf', sizeBytes: pdf.length });

    const submitted = (await api(SEED.users.bikash, 'post', `/assignments/${assignmentId}/mine/submit`)).body.data;
    const file = submitted.revisions[0].file;
    expect(file).toMatchObject({ name: 'My-greetings.pdf', sizeBytes: pdf.length });
    const download = await fetch(file.downloadUrl);
    expect(download.status).toBe(200);
    expect(download.headers.get('content-disposition')).toMatch(/^attachment/);
    expect(Buffer.from(await download.arrayBuffer()).subarray(0, 5).toString()).toBe('%PDF-');
  });

  it('enforces deadlines and records late work when allowed', async () => {
    const closed = (await api(teacher, 'post', `/courses/${SEED.freeCourse}/assignments`, { title: 'Past deadline', dueAt: inDays(-1), acceptText: true, acceptFile: false })).body.data;
    await api(teacher, 'post', `/assignments/${closed.id}/publish`);
    await api(SEED.users.aiko, 'put', `/assignments/${closed.id}/mine/draft`, { text: 'late answer' });
    const refused = await api(SEED.users.aiko, 'post', `/assignments/${closed.id}/mine/submit`);
    expect(refused.status).toBe(409);
    expect(refused.body.error.message).toMatch(/deadline has passed/);

    await api(teacher, 'patch', `/assignments/${closed.id}`, { title: 'Past deadline', allowLate: true });
    const late = (await api(SEED.users.aiko, 'post', `/assignments/${closed.id}/mine/submit`)).body.data;
    expect(late.revisions[0]).toMatchObject({ revision: 1, late: true });

    expect((await api(teacher, 'post', `/courses/${SEED.freeCourse}/assignments`, { title: 'Nothing accepted', acceptText: false, acceptFile: false, acceptUrl: false })).status).toBe(400);
  });

  it('keeps work private between learners, courses, and tenants', async () => {
    const [submission] = (await api(teacher, 'get', `/assignments/${assignmentId}/submissions`)).body.data as { id: string }[];
    expect((await api(SEED.users.bikash, 'get', `/submissions/${submission!.id}`)).status).toBe(403);
    expect((await api(SEED.users.bikash, 'post', `/submissions/${submission!.id}/grade`, { outcome: 'FAILED' })).status).toBe(403);

    const ownerCourse = await api(SEED.users.sakuraOwner, 'post', '/courses', {
      slug: 'owner-writing',
      title: 'Business writing',
      summary: 'Emails and reports for Japanese workplaces.',
      language: 'en',
      priceMinor: 0,
      currency: 'NPR',
    });
    const ownerAssignment = (await api(SEED.users.sakuraOwner, 'post', `/courses/${ownerCourse.body.data.id}/assignments`, { title: 'First email' })).body.data;
    expect((await api(teacher, 'get', `/assignments/${ownerAssignment.id}/submissions`)).status).toBe(403);
    expect((await api(teacher, 'get', `/courses/${ownerCourse.body.data.id}/assignments/manage`)).status).toBe(403);

    // Not enrolled in the owner's course: no access to its assignments.
    await api(SEED.users.sakuraOwner, 'post', `/assignments/${ownerAssignment.id}/publish`);
    expect((await api(SEED.users.aiko, 'get', `/assignments/${ownerAssignment.id}/mine`)).body.error.code).toBe('NOT_ENTITLED');

    const other = await ctx.http.get(`/v1/tenants/${SEED.everest}/submissions/${submission!.id}`).set(await auth(SEED.users.everestOwner));
    expect(other.status).toBe(404);
  });
});
