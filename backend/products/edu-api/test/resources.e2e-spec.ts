/**
 * Lesson resources (FR-COURSE-202/204): checked document uploads and links attached to draft lessons,
 * published with the course, copied into new drafts, never exposed on free previews, and served as
 * short-lived download links (PDFs can also open in the browser).
 */
import { CreateBucketCommand, S3Client } from '@aws-sdk/client-s3';
import { SEED, createTestContext, resetDatabase, type TestContext } from './helpers';

const enabled = Boolean(process.env.TEST_MEDIA_S3_ENDPOINT);
const suite = enabled ? describe : describe.skip;

type Lesson = { id: string; title: string; resources: { id: string; kind: string; title: string; url: string | null; file: { name: string } | null }[] };

suite('lesson resources', () => {
  let ctx: TestContext;
  const base = `/v1/tenants/${SEED.sakura}`;
  const auth = async (subject: string) => ({ Authorization: `Bearer ${await ctx.devToken(subject)}` });
  const api = async (subject: string, method: 'get' | 'post' | 'patch' | 'delete', path: string, body?: object) => {
    const req = ctx.http[method](`${base}${path}`).set(await auth(subject));
    return body ? req.send(body) : req;
  };
  const teacher = SEED.users.instructor;
  const lessonsOf = (draft: { sections: { lessons: Lesson[] }[] }) => draft.sections.flatMap((section) => section.lessons);
  const pdf = Buffer.concat([Buffer.from('%PDF-1.7\n'), Buffer.alloc(4096, 32)]);

  const upload = async (fileName: string, contentType: string, bytes: Buffer) => {
    const ticket = await api(teacher, 'post', `/courses/${SEED.freeCourse}/draft/resources/uploads`, { fileName, contentType, sizeBytes: bytes.length });
    expect(ticket.status).toBe(201);
    const put = await fetch(ticket.body.data.uploadUrl, { method: 'PUT', headers: ticket.body.data.headers, body: new Uint8Array(bytes) });
    expect(put.status).toBe(200);
    return { fileId: ticket.body.data.fileId as string, complete: await api(teacher, 'post', `/courses/${SEED.freeCourse}/draft/resources/uploads/${ticket.body.data.fileId}/complete`) };
  };

  beforeAll(async () => {
    await resetDatabase();
    const s3 = new S3Client({ region: 'ap-south-1', endpoint: process.env.MEDIA_S3_ENDPOINT, forcePathStyle: true });
    await s3.send(new CreateBucketCommand({ Bucket: process.env.MEDIA_BUCKET })).catch((error: Error) => {
      if (!['BucketAlreadyOwnedByYou', 'BucketAlreadyExists'].includes(error.name)) throw error;
    });
    ctx = await createTestContext();
    await api(SEED.users.aiko, 'post', `/courses/${SEED.freeCourse}/enrollments`);
  });

  afterAll(async () => {
    await ctx?.app.close();
  });

  it('attaches checked files and links to draft lessons and publishes them with the course', async () => {
    const draft = (await api(teacher, 'post', `/courses/${SEED.freeCourse}/draft`)).body.data;
    const [preview, locked] = lessonsOf(draft) as [Lesson, Lesson];

    const fake = await upload('book.pdf', 'application/pdf', Buffer.from('<html><script>alert(1)</script></html>'));
    expect(fake.complete.status).toBe(422);
    expect((await api(teacher, 'post', `/courses/${SEED.freeCourse}/draft/resources/uploads`, { fileName: 'x.svg', contentType: 'image/svg+xml', sizeBytes: 10 })).status).toBe(422);

    const book = await upload('Hiragana workbook.pdf', 'application/pdf', pdf);
    expect(book.complete.body.data).toEqual({ fileId: book.fileId, fileName: 'Hiragana-workbook.pdf' });

    const bad = [
      { title: 'Both', fileId: book.fileId, url: 'https://example.com' },
      { title: 'Neither' },
      { title: 'Script', url: 'javascript:alert(1)' },
    ];
    for (const body of bad) expect((await api(teacher, 'post', `/courses/${SEED.freeCourse}/draft/lessons/${locked.id}/resources`, body)).status).toBe(400);

    await api(teacher, 'post', `/courses/${SEED.freeCourse}/draft/lessons/${locked.id}/resources`, { title: 'Workbook', fileId: book.fileId });
    let updated = (await api(teacher, 'post', `/courses/${SEED.freeCourse}/draft/lessons/${locked.id}/resources`, { title: 'Stroke order video', url: 'https://www.nhk.or.jp/lesson/' })).body.data;
    updated = (await api(teacher, 'post', `/courses/${SEED.freeCourse}/draft/lessons/${preview.id}/resources`, { title: 'Preview handout', fileId: book.fileId })).body.data;
    const lockedDraft = lessonsOf(updated).find((lesson) => lesson.id === locked.id)!;
    expect(lockedDraft.resources.map((r) => [r.kind, r.title])).toEqual([
      ['FILE', 'Workbook'],
      ['LINK', 'Stroke order video'],
    ]);

    // Nothing reaches learners before approval.
    expect((await api(SEED.users.aiko, 'get', `/courses/${SEED.freeCourse}/lessons/${SEED.freeLesson}`)).body.data.resources).toEqual([]);

    await api(teacher, 'post', `/courses/${SEED.freeCourse}/draft/submit`);
    await api(SEED.users.sakuraOwner, 'post', `/courses/${SEED.freeCourse}/draft/approve`);

    const view = (await api(SEED.users.aiko, 'get', `/courses/${SEED.freeCourse}/lessons/${locked.id}`)).body.data;
    expect(view.resources.map((r: { kind: string; title: string }) => [r.kind, r.title])).toEqual([
      ['FILE', 'Workbook'],
      ['LINK', 'Stroke order video'],
    ]);
    const file = view.resources[0].file;
    expect(file).toMatchObject({ name: 'Hiragana-workbook.pdf', contentType: 'application/pdf', sizeBytes: pdf.length });
    const download = await fetch(file.downloadUrl);
    expect(download.headers.get('content-disposition')).toMatch(/^attachment/);
    const inline = await fetch(file.viewUrl);
    expect(inline.headers.get('content-disposition')).toBe('inline');
    expect(inline.headers.get('content-type')).toBe('application/pdf');
  });

  it('never exposes resources on free previews to people without course access', async () => {
    const draft = (await api(teacher, 'get', `/courses/${SEED.freeCourse}/draft`)).status;
    expect(draft).toBe(404); // the draft was published
    const course = (await api(SEED.users.aiko, 'get', `/courses/${SEED.freeCourse}`)).body.data;
    const previewId: string = course.curriculum[0].lessons[0].id;

    expect((await api(SEED.users.aiko, 'get', `/courses/${SEED.freeCourse}/lessons/${previewId}`)).body.data.resources).toHaveLength(1);
    const bikash = await api(SEED.users.bikash, 'get', `/courses/${SEED.freeCourse}/lessons/${previewId}`);
    expect(bikash.status).toBe(200);
    expect(bikash.body.data.resources).toEqual([]);
  });

  it('copies resources into the next draft and limits who may attach them', async () => {
    const next = (await api(teacher, 'post', `/courses/${SEED.freeCourse}/draft`)).body.data;
    const copied = lessonsOf(next).flatMap((lesson) => lesson.resources.map((r) => r.title));
    expect(copied.sort()).toEqual(['Preview handout', 'Stroke order video', 'Workbook']);

    const ownerCourse = await api(SEED.users.sakuraOwner, 'post', '/courses', {
      slug: 'owner-books',
      title: 'Reading club',
      summary: 'Short graded readers for beginners.',
      language: 'en',
      priceMinor: 0,
      currency: 'NPR',
    });
    const refused = await api(teacher, 'post', `/courses/${ownerCourse.body.data.id}/draft/resources/uploads`, { fileName: 'a.pdf', contentType: 'application/pdf', sizeBytes: 100 });
    expect(refused.status).toBe(403);
    expect((await api(SEED.users.aiko, 'post', `/courses/${SEED.freeCourse}/draft/resources/uploads`, { fileName: 'a.pdf', contentType: 'application/pdf', sizeBytes: 100 })).status).toBe(403);
  });
});
