/**
 * Video and audio lessons (FR-COURSE-202/205, FR-PLAYER-401/402) against a real S3-compatible server:
 * direct uploads with signed URLs, content checks, lesson attachment and review rules, playback URLs
 * issued only after the access check, and resume and completion progress.
 */
import { CreateBucketCommand, S3Client } from '@aws-sdk/client-s3';
import { SEED, createTestContext, ownerQuery, resetDatabase, type TestContext } from './helpers';

const enabled = Boolean(process.env.TEST_MEDIA_S3_ENDPOINT);
const suite = enabled ? describe : describe.skip;

/** A tiny byte sequence with the MP4 "ftyp" signature; enough for the content check. */
const fakeMp4 = (size: number) => {
  const bytes = Buffer.alloc(size);
  bytes.writeUInt32BE(24, 0);
  bytes.write('ftypisom', 4, 'ascii');
  return bytes;
};

suite('lesson media', () => {
  let ctx: TestContext;
  const base = `/v1/tenants/${SEED.sakura}`;
  const auth = async (subject: string) => ({ Authorization: `Bearer ${await ctx.devToken(subject)}` });
  const api = async (subject: string, method: 'get' | 'post' | 'put' | 'patch', path: string, body?: object) => {
    const req = ctx.http[method](`${base}${path}`).set(await auth(subject));
    return body ? req.send(body) : req;
  };
  const upload = async (subject: string, kind: 'VIDEO' | 'AUDIO', contentType: string, bytes: Buffer, declaredSize = bytes.length) => {
    const ticket = await api(subject, 'post', '/media/uploads', { kind, contentType, sizeBytes: declaredSize, fileName: 'lesson one.mp4' });
    expect(ticket.status).toBe(201);
    const put = await fetch(ticket.body.data.uploadUrl, { method: 'PUT', headers: ticket.body.data.headers, body: new Uint8Array(bytes) });
    return { mediaId: ticket.body.data.mediaId as string, putStatus: put.status };
  };

  beforeAll(async () => {
    await resetDatabase();
    const s3 = new S3Client({ region: 'ap-south-1', endpoint: process.env.MEDIA_S3_ENDPOINT, forcePathStyle: true });
    await s3.send(new CreateBucketCommand({ Bucket: process.env.MEDIA_BUCKET })).catch((error: Error) => {
      if (!['BucketAlreadyOwnedByYou', 'BucketAlreadyExists'].includes(error.name)) throw error;
    });
    ctx = await createTestContext();
  });

  afterAll(async () => {
    await ctx?.app.close();
  });

  it('accepts a real upload and rejects impostors, wrong types, and missing files', async () => {
    const good = await upload(SEED.users.instructor, 'VIDEO', 'video/mp4', fakeMp4(4096));
    expect(good.putStatus).toBe(200);
    const done = await api(SEED.users.instructor, 'post', `/media/${good.mediaId}/complete`, { durationSec: 120 });
    expect(done.status).toBe(200);
    expect(done.body.data).toMatchObject({ status: 'READY', kind: 'VIDEO', durationSec: 120, fileName: 'lesson-one.mp4' });

    const impostor = await upload(SEED.users.instructor, 'VIDEO', 'video/mp4', Buffer.from('<html><script>alert(1)</script></html>'));
    const rejected = await api(SEED.users.instructor, 'post', `/media/${impostor.mediaId}/complete`, { durationSec: 60 });
    expect(rejected.status).toBe(422);
    expect(rejected.body.error.code).toBe('MEDIA_INVALID');
    const [row] = await ownerQuery<{ status: string }>('SELECT status FROM media_assets WHERE id = $1', [impostor.mediaId]);
    expect(row?.status).toBe('FAILED');

    const missing = await api(SEED.users.instructor, 'post', '/media/uploads', { kind: 'AUDIO', contentType: 'audio/mpeg', sizeBytes: 100, fileName: 'a.mp3' });
    const notUploaded = await api(SEED.users.instructor, 'post', `/media/${missing.body.data.mediaId}/complete`, { durationSec: 10 });
    expect(notUploaded.body.error.code).toBe('MEDIA_NOT_UPLOADED');

    const quicktime = await api(SEED.users.instructor, 'post', '/media/uploads', { kind: 'VIDEO', contentType: 'video/quicktime', sizeBytes: 100, fileName: 'a.mov' });
    expect(quicktime.status).toBe(422);
    const tooBig = await api(SEED.users.instructor, 'post', '/media/uploads', { kind: 'AUDIO', contentType: 'audio/mpeg', sizeBytes: 300 * 1024 * 1024, fileName: 'a.mp3' });
    expect(tooBig.status).toBe(422);

    expect((await api(SEED.users.aiko, 'post', '/media/uploads', { kind: 'VIDEO', contentType: 'video/mp4', sizeBytes: 10, fileName: 'x.mp4' })).status).toBe(403);
  });

  it('attaches video to a lesson, requires a transcript for review, and streams only after the access check', async () => {
    const { mediaId } = await upload(SEED.users.instructor, 'VIDEO', 'video/mp4', fakeMp4(8192));
    await api(SEED.users.instructor, 'post', `/media/${mediaId}/complete`, { durationSec: 100 });

    const draft = await api(SEED.users.instructor, 'post', `/courses/${SEED.freeCourse}/draft`);
    const sectionId: string = draft.body.data.sections[0].id;
    const textLesson = await api(SEED.users.instructor, 'post', `/courses/${SEED.freeCourse}/draft/sections/${sectionId}/lessons`, {
      title: 'Text cannot take media',
      mediaId,
    });
    expect(textLesson.status).toBe(409);

    const added = await api(SEED.users.instructor, 'post', `/courses/${SEED.freeCourse}/draft/sections/${sectionId}/lessons`, {
      title: 'Watch: writing あ',
      kind: 'VIDEO',
      mediaId,
    });
    expect(added.status).toBe(201);
    const lesson = added.body.data.sections[0].lessons.find((l: { title: string }) => l.title === 'Watch: writing あ');
    expect(lesson.media).toMatchObject({ id: mediaId, status: 'READY', durationSec: 100 });

    const blocked = await api(SEED.users.instructor, 'post', `/courses/${SEED.freeCourse}/draft/submit`);
    expect(blocked.status).toBe(409);
    expect(blocked.body.error.message).toMatch(/transcript/);

    await api(SEED.users.instructor, 'patch', `/courses/${SEED.freeCourse}/draft/lessons/${lesson.id}`, { bodyMarkdown: 'Transcript: draw the first stroke…' });
    expect((await api(SEED.users.instructor, 'post', `/courses/${SEED.freeCourse}/draft/submit`)).status).toBe(200);
    expect((await api(SEED.users.sakuraOwner, 'post', `/courses/${SEED.freeCourse}/draft/approve`)).status).toBe(200);

    // A member who is not enrolled cannot get a playback URL; after enrolling they can.
    const published = await api(SEED.users.aiko, 'get', `/courses/${SEED.freeCourse}`);
    const publishedLesson = published.body.data.curriculum.flatMap((s: { lessons: { id: string; title: string }[] }) => s.lessons).find((l: { title: string }) => l.title === 'Watch: writing あ');
    expect((await api(SEED.users.aiko, 'get', `/courses/${SEED.freeCourse}/lessons/${publishedLesson.id}`)).body.error.code).toBe('NOT_ENTITLED');

    await api(SEED.users.aiko, 'post', `/courses/${SEED.freeCourse}/enrollments`);
    const view = await api(SEED.users.aiko, 'get', `/courses/${SEED.freeCourse}/lessons/${publishedLesson.id}`);
    expect(view.status).toBe(200);
    expect(view.body.data.media).toMatchObject({ id: mediaId, kind: 'VIDEO', contentType: 'video/mp4', durationSec: 100, resumeSec: 0, completed: false });
    const stream = await fetch(view.body.data.media.url, { headers: { Range: 'bytes=0-11' } });
    expect([200, 206]).toContain(stream.status);
    expect(Buffer.from(await stream.arrayBuffer()).subarray(4, 8).toString('ascii')).toBe('ftyp');

    // Another tenant cannot attach this file.
    const everestDraft = await ctx.http.post(`/v1/tenants/${SEED.everest}/courses/${SEED.everestCourse}/draft`).set(await auth(SEED.users.everestOwner));
    const everestSection: string = everestDraft.body.data.sections[0].id;
    const stolen = await ctx.http
      .post(`/v1/tenants/${SEED.everest}/courses/${SEED.everestCourse}/draft/sections/${everestSection}/lessons`)
      .set(await auth(SEED.users.everestOwner))
      .send({ title: 'Borrowed video', kind: 'VIDEO', mediaId });
    expect(stolen.status).toBe(404);
  });

  it('resumes where the learner stopped and completes after 90% is actually played', async () => {
    const [asset] = await ownerQuery<{ id: string }>("SELECT id FROM media_assets WHERE status = 'READY' AND duration_sec = 100");
    const mediaId = asset!.id;
    const save = (positionSec: number, playedSec: number) => api(SEED.users.aiko, 'put', `/media/${mediaId}/progress`, { positionSec, playedSec });

    // Seeking to the end without playing does not complete, and one save adds at most 30 seconds.
    let progress = await save(99, 3600);
    expect(progress.body.data).toEqual({ positionSec: 99, watchedSec: 30, completed: false });
    progress = await save(60, 30);
    progress = await save(90, 30);
    expect(progress.body.data.completed).toBe(true);
    expect(progress.body.data.watchedSec).toBe(90);

    // Another learner has their own progress; Aiko's row is invisible to them.
    const bikash = await ctx.http.put(`${base}/media/${mediaId}/progress`).set(await auth(SEED.users.bikash)).send({ positionSec: 5, playedSec: 5 });
    expect(bikash.body.data).toEqual({ positionSec: 5, watchedSec: 5, completed: false });
  });
});
