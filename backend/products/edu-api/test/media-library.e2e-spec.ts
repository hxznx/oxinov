/**
 * The media library against real PostgreSQL (FR-COURSE-210): every YouTube video and Google Drive file in
 * use, grouped with the lessons that use it; administrators see the whole workspace, a teacher only their
 * own offerings, and learners and other workspaces nothing.
 */
import { SEED, createTestContext, resetDatabase, type TestContext } from './helpers';

const YOUTUBE_ID = 'dQw4w9WgXcQ';
const DRIVE_ID = '1AbCdEfGhIjKlMnOpQrStUvWxYz012345';

type Use = { courseId: string; lessonTitle: string; draft: boolean };
type Item = { kind: string; id: string; url: string | null; uses: Use[] };

describe('media library', () => {
  let ctx: TestContext;
  const { instructor: teacher, sakuraOwner: owner, aiko, everestOwner } = SEED.users;
  const base = `/v1/tenants/${SEED.sakura}`;
  const auth = async (subject: string) => ({ Authorization: `Bearer ${await ctx.devToken(subject)}` });
  const post = async (subject: string, path: string, body: object) => ctx.http.post(`${base}${path}`).set(await auth(subject)).send(body);
  const library = async (subject: string, tenant: string = SEED.sakura) => ctx.http.get(`/v1/tenants/${tenant}/media/library`).set(await auth(subject));

  /** A draft course with one chapter and the given lessons. */
  async function course(subject: string, slug: string, lessons: object[]): Promise<string> {
    const created = await post(subject, '/courses', { slug, title: slug, summary: 'Media library test course.', language: 'en', priceMinor: 0, currency: 'NPR' });
    expect(created.status).toBe(201);
    const id = created.body.data.id as string;
    const draft = await post(subject, `/courses/${id}/draft/sections`, { title: 'Chapter' });
    const sectionId = draft.body.data.sections[0].id as string;
    for (const lesson of lessons) expect((await post(subject, `/courses/${id}/draft/sections/${sectionId}/lessons`, lesson)).status).toBe(201);
    return id;
  }

  let teacherCourse = '';
  let ownerCourse = '';

  beforeAll(async () => {
    await resetDatabase();
    ctx = await createTestContext();
    teacherCourse = await course(teacher, 'library-teacher', [
      { title: 'Welcome video', kind: 'VIDEO', externalUrl: `https://youtu.be/${YOUTUBE_ID}` },
      { title: 'Workbook', kind: 'DOCUMENT', externalUrl: `https://drive.google.com/file/d/${DRIVE_ID}/view` },
    ]);
    ownerCourse = await course(owner, 'library-owner', [{ title: 'Same welcome', kind: 'VIDEO', externalUrl: `https://www.youtube.com/watch?v=${YOUTUBE_ID}` }]);
  });

  afterAll(async () => {
    await ctx?.app.close();
  });

  it('shows an administrator every item with every lesson that uses it', async () => {
    const res = await library(owner);
    expect(res.status).toBe(200);
    const items = res.body.data as Item[];
    const video = items.find((item) => item.kind === 'YOUTUBE' && item.id === YOUTUBE_ID);
    expect(video?.url).toBe(`https://www.youtube.com/watch?v=${YOUTUBE_ID}`);
    expect(video?.uses.map((use) => use.courseId).sort()).toEqual([teacherCourse, ownerCourse].sort());
    expect(video?.uses.every((use) => use.draft)).toBe(true);
    expect(items.find((item) => item.kind === 'GOOGLE_DRIVE')).toMatchObject({ id: DRIVE_ID, uses: [{ lessonTitle: 'Workbook' }] });
  });

  it('shows a teacher only the items of their own offerings', async () => {
    const res = await library(teacher);
    expect(res.status).toBe(200);
    const video = (res.body.data as Item[]).find((item) => item.id === YOUTUBE_ID);
    expect(video?.uses.map((use) => use.courseId)).toEqual([teacherCourse]);
  });

  it('refuses learners and members of other workspaces', async () => {
    expect((await library(aiko)).status).toBe(403);
    expect((await library(everestOwner)).status).toBe(404);
    const other = await library(everestOwner, SEED.everest);
    expect(other.status).toBe(200);
    expect((other.body.data as Item[]).some((item) => item.id === YOUTUBE_ID)).toBe(false);
  });
});
