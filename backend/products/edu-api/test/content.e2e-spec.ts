/**
 * Externally hosted lessons and live classes against real PostgreSQL (ADR-028 points 5 to 8): YouTube and
 * Google Drive links checked when authored, revealed only after the access check, kept across versions,
 * and live class links shown only to people allowed to join.
 */
import { SEED, createTestContext, ownerQuery, resetDatabase, type TestContext } from './helpers';

const YOUTUBE_ID = 'dQw4w9WgXcQ';
const DRIVE_ID = '1AbCdEfGhIjKlMnOpQrStUvWxYz012345';

type Lesson = { id: string; title: string; kind: string; external: { source: string; id: string; url: string } | null };
type Draft = { status: string; sections: { id: string; lessons: Lesson[] }[] };

describe('external lessons and live classes', () => {
  let ctx: TestContext;
  const { instructor: teacher, sakuraOwner: owner, aiko, everestOwner } = SEED.users;
  const base = `/v1/tenants/${SEED.sakura}`;
  const auth = async (subject: string) => ({ Authorization: `Bearer ${await ctx.devToken(subject)}` });
  const call = async (subject: string, method: 'get' | 'post' | 'patch' | 'put', path: string, body?: object) => {
    const req = ctx.http[method](`${base}${path}`).set(await auth(subject));
    return body ? req.send(body) : req;
  };
  let courseId = '';
  let sectionId = '';

  beforeAll(async () => {
    await resetDatabase();
    ctx = await createTestContext();
    const created = await call(teacher, 'post', '/courses', {
      slug: 'japanese-on-youtube',
      title: 'Japanese on YouTube',
      summary: 'Lessons hosted on YouTube and Google Drive.',
      language: 'en',
      priceMinor: 500_000,
      currency: 'NPR',
    });
    expect(created.status).toBe(201);
    courseId = created.body.data.id;
    const draft = await call(teacher, 'post', `/courses/${courseId}/draft/sections`, { title: 'Start here' });
    sectionId = draft.body.data.sections[0].id;
  });

  afterAll(async () => {
    await ctx?.app.close();
  });

  const addLesson = (body: object) => call(teacher, 'post', `/courses/${courseId}/draft/sections/${sectionId}/lessons`, body);
  const lessons = (draft: Draft) => draft.sections.flatMap((section) => section.lessons);

  it('accepts YouTube and Drive links that fit the lesson kind and refuses everything else', async () => {
    for (const [body, pattern] of [
      [{ title: 'Bad', kind: 'VIDEO', externalUrl: 'https://example.com/video.mp4' }, /YouTube video link or a Google Drive/],
      [{ title: 'Bad', kind: 'DOCUMENT', externalUrl: `https://youtu.be/${YOUTUBE_ID}` }, /Document lessons take a Google Drive/],
      [{ title: 'Bad', kind: 'TEXT', externalUrl: `https://youtu.be/${YOUTUBE_ID}` }, /Only video and document/],
      [{ title: 'Bad', kind: 'VIDEO', externalUrl: `https://youtu.be/${YOUTUBE_ID}`, mediaId: '00000000-0000-4000-8000-000000000000' }, /not both/],
    ] as const) {
      const res = await addLesson(body);
      expect(res.status).toBe(422);
      expect(res.body.error).toMatchObject({ code: 'CONTENT_LINK_INVALID', message: expect.stringMatching(pattern) });
    }

    await addLesson({ title: 'Greetings', kind: 'VIDEO', externalUrl: `https://www.youtube.com/watch?v=${YOUTUBE_ID}&t=3s`, bodyMarkdown: 'Transcript: こんにちは' });
    const res = await addLesson({ title: 'Workbook', kind: 'DOCUMENT', isPreview: true });
    expect(res.status).toBe(201);
    // A document lesson without its Drive file cannot go to review.
    expect((await call(teacher, 'post', `/courses/${courseId}/draft/submit`)).body.error.message).toMatch(/Workbook.*Google Drive link/);
    const workbook = lessons(res.body.data).find((lesson) => lesson.title === 'Workbook')!;
    const patched = await call(teacher, 'patch', `/courses/${courseId}/draft/lessons/${workbook.id}`, { externalUrl: `https://drive.google.com/file/d/${DRIVE_ID}/view?usp=sharing` });
    expect(patched.status).toBe(200);
    expect(lessons(patched.body.data).map((lesson) => [lesson.title, lesson.kind, lesson.external])).toEqual([
      ['Greetings', 'VIDEO', { source: 'YOUTUBE', id: YOUTUBE_ID, url: `https://www.youtube.com/watch?v=${YOUTUBE_ID}` }],
      ['Workbook', 'DOCUMENT', { source: 'GOOGLE_DRIVE', id: DRIVE_ID, url: `https://drive.google.com/file/d/${DRIVE_ID}/view` }],
    ]);

    expect((await call(teacher, 'post', `/courses/${courseId}/draft/submit`)).status).toBe(200);
    expect((await call(owner, 'post', `/courses/${courseId}/draft/approve`)).body.data.status).toBe('PUBLISHED');
  });

  it('reveals the video or file only after the access check, with the viewer watermark', async () => {
    const outline = await call(aiko, 'get', `/courses/${courseId}`);
    expect(outline.status).toBe(200);
    // Titles are public; IDs are not.
    expect(JSON.stringify(outline.body)).not.toContain(YOUTUBE_ID);
    expect(JSON.stringify(outline.body)).not.toContain(DRIVE_ID);
    const [greetings, workbook] = outline.body.data.curriculum[0].lessons as { id: string }[];

    const locked = await call(aiko, 'get', `/courses/${courseId}/lessons/${greetings!.id}`);
    expect(locked.body.error.code).toBe('NOT_ENTITLED');
    expect(JSON.stringify(locked.body)).not.toContain(YOUTUBE_ID);

    const preview = await call(aiko, 'get', `/courses/${courseId}/lessons/${workbook!.id}`);
    expect(preview.status).toBe(200);
    expect(preview.body.data.external).toEqual({ source: 'GOOGLE_DRIVE', embedUrl: `https://drive.google.com/file/d/${DRIVE_ID}/preview` });
    const [profile] = await ownerQuery<{ email: string }>(`SELECT email FROM user_profiles WHERE auth_subject = $1`, [aiko]);
    expect(preview.body.data.watermark).toBe(profile!.email);

    // Authors see every lesson; the player address is YouTube's privacy-enhanced embed.
    const authored = await call(teacher, 'get', `/courses/${courseId}/lessons/${greetings!.id}`);
    expect(authored.body.data.external).toEqual({ source: 'YOUTUBE', embedUrl: `https://www.youtube-nocookie.com/embed/${YOUTUBE_ID}?rel=0&modestbranding=1&playsinline=1` });
  });

  it('keeps links in the next draft and lets the author swap or remove them', async () => {
    const next = await call(teacher, 'post', `/courses/${courseId}/draft`);
    expect(next.status).toBe(201);
    const copied = lessons(next.body.data);
    expect(copied.map((lesson) => lesson.external?.id)).toEqual([YOUTUBE_ID, DRIVE_ID]);
    const removed = await call(teacher, 'patch', `/courses/${courseId}/draft/lessons/${copied[0]!.id}`, { externalUrl: null });
    expect(lessons(removed.body.data)[0]!.external).toBeNull();
    // The published version is unchanged until the draft is approved.
    const [row] = await ownerQuery<{ n: number }>(`SELECT count(*)::int AS n FROM lessons WHERE external_id = $1`, [YOUTUBE_ID]);
    expect(row!.n).toBe(1);
  });

  it('shows live class links only to people allowed to join', async () => {
    const start = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString();
    const paths = `/courses/${SEED.paidCourse}/live-sessions`;
    expect((await call(teacher, 'post', paths, { title: 'Open class', startsAt: start, durationMin: 60, joinUrl: 'http://meet.google.com/abc-defg-hij' })).body.error.code).toBe(
      'CONTENT_LINK_INVALID',
    );
    expect((await call(aiko, 'post', paths, { title: 'Mine', startsAt: start, durationMin: 60, joinUrl: 'https://meet.google.com/abc-defg-hij' })).status).toBe(403);
    const free = await call(teacher, 'post', paths, { title: 'Open class', startsAt: start, durationMin: 60, joinUrl: 'https://meet.google.com/abc-defg-hij', visibility: 'FREE' });
    expect(free.body.data).toMatchObject({ provider: 'GOOGLE_MEET', visibility: 'FREE', joinUrl: 'https://meet.google.com/abc-defg-hij' });
    const paid = await call(teacher, 'post', paths, { title: 'Speaking practice', startsAt: start, durationMin: 45, joinUrl: 'https://us02web.zoom.us/j/123456789' });
    expect(paid.body.data).toMatchObject({ provider: 'ZOOM', visibility: 'SUBSCRIBERS' });

    // A learner without access sees the paid class but not its link.
    const seen = await call(aiko, 'get', paths);
    expect(seen.body.data.map((s: { title: string; joinUrl: string | null; locked: boolean }) => [s.title, s.joinUrl, s.locked])).toEqual([
      ['Open class', 'https://meet.google.com/abc-defg-hij', false],
      ['Speaking practice', null, true],
    ]);
    // The public offering page lists times and titles only.
    const store = await ctx.http.get('/v1/store/offerings/jlpt-n5-complete');
    expect(store.body.data.liveSessions.map((s: { title: string }) => s.title)).toEqual(['Open class', 'Speaking practice']);
    expect(JSON.stringify(store.body)).not.toMatch(/meet\.google\.com|zoom\.us/);

    // Cancelled classes stay listed, without a link; other workspaces cannot reach them.
    const cancelled = await call(teacher, 'patch', `/live-sessions/${free.body.data.id}`, { cancelled: true });
    expect(cancelled.body.data).toMatchObject({ cancelled: true, joinUrl: null });
    expect((await call(everestOwner, 'get', paths)).status).toBe(404);
    expect((await call(aiko, 'get', `/courses/${SEED.draftCourse}/live-sessions`)).status).toBe(404);
  });
});
