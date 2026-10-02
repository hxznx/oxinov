/**
 * Fast course building against real PostgreSQL (FR-COURSE-209): many YouTube and Google Drive links pasted at
 * once become lessons in order with refused lines reported, and an offering duplicated as a template keeps
 * its structure but none of its learners or sales.
 */
import { SEED, createTestContext, ownerQuery, resetDatabase, type TestContext } from './helpers';

const YT = 'dQw4w9WgXcQ';
const DRIVE = '1AbCdEfGhIjKlMnOpQrStUvWxYz012345';

type Draft = { sections: { id: string; lessons: { title: string; kind: string; external: { source: string } | null }[] }[] };

describe('fast course building', () => {
  let ctx: TestContext;
  const { instructor: teacher, sakuraOwner: owner, aiko } = SEED.users;
  const base = `/v1/tenants/${SEED.sakura}`;
  const auth = async (subject: string) => ({ Authorization: `Bearer ${await ctx.devToken(subject)}` });
  const post = async (subject: string, path: string, body: object) => ctx.http.post(`${base}${path}`).set(await auth(subject)).send(body);

  beforeAll(async () => {
    await resetDatabase();
    ctx = await createTestContext();
  });

  afterAll(async () => {
    await ctx?.app.close();
  });

  it('turns five pasted links into five lessons in order and refuses a link on another host', async () => {
    const created = await post(teacher, '/courses', { slug: 'pasted-links', title: 'Pasted links', summary: 'Lessons made from pasted links.', language: 'en', priceMinor: 0, currency: 'NPR' });
    const courseId = created.body.data.id as string;
    const sectionId = (await post(teacher, `/courses/${courseId}/draft/sections`, { title: 'Start' })).body.data.sections[0].id as string;
    const text = [
      `Hiragana 1 https://youtu.be/${YT}`,
      `Hiragana 2 | https://www.youtube.com/watch?v=${YT}`,
      `Workbook\thttps://drive.google.com/file/d/${DRIVE}/view`,
      `https://youtu.be/${YT}`,
      `Katakana https://youtu.be/${YT}`,
      'Bonus https://vimeo.com/123456',
    ].join('\n');

    expect((await post(aiko, `/courses/${courseId}/draft/sections/${sectionId}/lessons/bulk`, { text })).status).toBe(403);
    const pasted = await post(teacher, `/courses/${courseId}/draft/sections/${sectionId}/lessons/bulk`, { text });
    expect(pasted.status).toBe(200);
    expect(pasted.body.data).toMatchObject({ created: 5, refused: [{ line: 6, reason: 'No YouTube or Google Drive link on this line.' }] });
    const lessons = (pasted.body.data.draft as Draft).sections[0]!.lessons;
    expect(lessons.map((lesson) => [lesson.title, lesson.kind, lesson.external?.source])).toEqual([
      ['Hiragana 1', 'VIDEO', 'YOUTUBE'],
      ['Hiragana 2', 'VIDEO', 'YOUTUBE'],
      ['Workbook', 'DOCUMENT', 'GOOGLE_DRIVE'],
      ['Lesson 4', 'VIDEO', 'YOUTUBE'],
      ['Katakana', 'VIDEO', 'YOUTUBE'],
    ]);
  });

  it('duplicates an offering as a draft template without its learners, plans, or sales', async () => {
    expect((await post(aiko, `/courses/${SEED.paidCourse}/duplicate`, {})).status).toBe(403);
    // Someone is enrolled in the original; the copy has nobody.
    expect((await post(aiko, `/courses/${SEED.freeCourse}/enrollments`, {})).status).toBe(201);

    const first = await post(owner, `/courses/${SEED.freeCourse}/duplicate`, {});
    expect(first.status).toBe(201);
    expect(first.body.data).toMatchObject({ slug: 'hiragana-first-words-copy', title: 'Hiragana and First Words (copy)' });
    const second = await post(owner, `/courses/${SEED.freeCourse}/duplicate`, { title: 'Katakana and First Words' });
    expect(second.body.data).toMatchObject({ slug: 'hiragana-first-words-copy-2', title: 'Katakana and First Words' });

    const copyId = first.body.data.courseId as string;
    const [course] = await ownerQuery<{ status: string; published_version_id: string | null }>('SELECT status, published_version_id FROM courses WHERE id = $1', [copyId]);
    expect(course).toEqual({ status: 'DRAFT', published_version_id: null });
    const count = async (table: string) => Number((await ownerQuery<{ n: string }>(`SELECT count(*) AS n FROM ${table} WHERE course_id = $1`, [copyId]))[0]!.n);
    for (const table of ['enrollments', 'entitlements', 'payments', 'course_plans', 'course_reviews', 'certificates']) expect(await count(table)).toBe(0);

    const lessonCount = async (courseId: string) =>
      Number(
        (
          await ownerQuery<{ n: string }>(
            `SELECT count(*) AS n FROM lessons l JOIN sections s ON s.id = l.section_id JOIN course_versions v ON v.id = s.course_version_id WHERE v.course_id = $1 AND v.version = (SELECT max(version) FROM course_versions WHERE course_id = $1)`,
            [courseId],
          )
        )[0]!.n,
      );
    expect(await lessonCount(copyId)).toBe(await lessonCount(SEED.freeCourse));
    expect(await lessonCount(copyId)).toBeGreaterThan(0);
  });
});
