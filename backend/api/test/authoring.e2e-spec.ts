/**
 * Teacher editing (FR-COURSE-201/203): drafts separate from what learners see, chapters and lessons,
 * reordering, review with feedback, publishing, and who may do each step.
 */
import { SEED, createTestContext, ownerQuery, resetDatabase, type TestContext } from './helpers';

type Draft = {
  versionId: string;
  version: number;
  status: string;
  title: string;
  reviewFeedback: string | null;
  sections: { id: string; title: string; position: number; lessons: { id: string; title: string; position: number }[] }[];
};

describe('course authoring', () => {
  let ctx: TestContext;
  const auth = async (subject: string) => ({ Authorization: `Bearer ${await ctx.devToken(subject)}` });
  const base = `/v1/tenants/${SEED.sakura}`;
  const call = async (subject: string, method: 'get' | 'post' | 'patch' | 'put' | 'delete', path: string, body?: object) => {
    const req = ctx.http[method](`${base}${path}`).set(await auth(subject));
    return body ? req.send(body) : req;
  };
  const draftOf = (response: { body: { data: Draft } }) => response.body.data;

  beforeAll(async () => {
    await resetDatabase();
    ctx = await createTestContext();
  });

  afterAll(async () => {
    await ctx?.app.close();
  });

  it('builds a new course from an empty draft through review to learners', async () => {
    const teacher = SEED.users.instructor;
    const created = await call(teacher, 'post', '/courses', {
      slug: 'it-basics',
      title: 'Computer basics',
      summary: 'Files, folders, and safe passwords for beginners.',
      language: 'en',
      priceMinor: 0,
      currency: 'NPR',
    });
    expect(created.status).toBe(201);
    const courseId: string = created.body.data.id;

    let draft = draftOf(await call(teacher, 'get', `/courses/${courseId}/draft`));
    expect(draft).toMatchObject({ version: 1, status: 'DRAFT', sections: [] });

    const empty = await call(teacher, 'post', `/courses/${courseId}/draft/submit`);
    expect(empty.status).toBe(409);

    draft = draftOf(await call(teacher, 'post', `/courses/${courseId}/draft/sections`, { title: 'Files' }));
    draft = draftOf(await call(teacher, 'post', `/courses/${courseId}/draft/sections`, { title: 'Passwords' }));
    const [files, passwords] = draft.sections as [Draft['sections'][number], Draft['sections'][number]];
    draft = draftOf(await call(teacher, 'post', `/courses/${courseId}/draft/sections/${files.id}/lessons`, { title: 'What is a file?', bodyMarkdown: '# Files' }));
    draft = draftOf(await call(teacher, 'post', `/courses/${courseId}/draft/sections/${files.id}/lessons`, { title: 'Folders', isPreview: true }));
    expect(draft.sections[0]?.lessons.map((lesson) => [lesson.title, lesson.position])).toEqual([
      ['What is a file?', 1],
      ['Folders', 2],
    ]);

    // An empty chapter blocks review (FR-COURSE-201).
    expect((await call(teacher, 'post', `/courses/${courseId}/draft/submit`)).status).toBe(409);

    // Move "Folders" into the passwords chapter and put that chapter first.
    const folders = draft.sections[0]!.lessons[1]!;
    const whatIsAFile = draft.sections[0]!.lessons[0]!;
    draft = draftOf(
      await call(teacher, 'put', `/courses/${courseId}/draft/order`, {
        sections: [
          { id: passwords.id, lessonIds: [folders.id] },
          { id: files.id, lessonIds: [whatIsAFile.id] },
        ],
      }),
    );
    expect(draft.sections.map((section) => [section.title, section.position, section.lessons.map((l) => l.title)])).toEqual([
      ['Passwords', 1, ['Folders']],
      ['Files', 2, ['What is a file?']],
    ]);
    draft = draftOf(await call(teacher, 'patch', `/courses/${courseId}/draft/lessons/${folders.id}`, { title: 'Strong passwords' }));

    const bad = await call(teacher, 'put', `/courses/${courseId}/draft/order`, { sections: [{ id: files.id, lessonIds: [whatIsAFile.id] }] });
    expect(bad.status).toBe(400);

    draft = draftOf(await call(teacher, 'post', `/courses/${courseId}/draft/submit`));
    expect(draft.status).toBe('IN_REVIEW');
    expect((await call(teacher, 'patch', `/courses/${courseId}/draft`, { title: 'Sneaky edit' })).status).toBe(409);
    expect((await call(teacher, 'post', `/courses/${courseId}/draft/approve`)).status).toBe(403);

    const rejected = draftOf(await call(SEED.users.sakuraOwner, 'post', `/courses/${courseId}/draft/reject`, { reason: 'Add a lesson on backups.' }));
    expect(rejected).toMatchObject({ status: 'DRAFT', reviewFeedback: 'Add a lesson on backups.' });

    draft = draftOf(await call(teacher, 'post', `/courses/${courseId}/draft/sections/${files.id}/lessons`, { title: 'Backups' }));
    draft = draftOf(await call(teacher, 'post', `/courses/${courseId}/draft/submit`));
    expect(draft.reviewFeedback).toBeNull();

    const published = draftOf(await call(SEED.users.sakuraOwner, 'post', `/courses/${courseId}/draft/approve`));
    expect(published.status).toBe('PUBLISHED');

    const catalog = await call(SEED.users.aiko, 'get', '/courses');
    expect(catalog.body.data.map((course: { title: string }) => course.title)).toContain('Computer basics');
    const detail = await call(SEED.users.aiko, 'get', `/courses/${courseId}`);
    expect(detail.body.data.curriculum.map((s: { title: string; lessons: { title: string }[] }) => [s.title, s.lessons.map((l) => l.title)])).toEqual([
      ['Passwords', ['Strong passwords']],
      ['Files', ['What is a file?', 'Backups']],
    ]);

    const actions = await ownerQuery<{ action: string }>(
      "SELECT action FROM audit_events WHERE target_id = $1 AND action LIKE 'course.%' ORDER BY created_at",
      [courseId],
    );
    expect(actions.map((row) => row.action)).toEqual(['course.created', 'course.review.submitted', 'course.review.rejected', 'course.review.submitted', 'course.published']);
  });

  it('edits a published course in a draft while learners keep the published version', async () => {
    const teacher = SEED.users.instructor;
    const started = await call(teacher, 'post', `/courses/${SEED.freeCourse}/draft`);
    expect(started.status).toBe(201);
    const draft = draftOf(started);
    expect(draft.version).toBe(2);
    expect(draft.sections.flatMap((section) => section.lessons).length).toBe(3);
    expect((await call(teacher, 'post', `/courses/${SEED.freeCourse}/draft`)).status).toBe(200);

    await call(teacher, 'patch', `/courses/${SEED.freeCourse}/draft`, { title: 'Hiragana and First Words (2nd edition)' });
    const learnerView = await call(SEED.users.aiko, 'get', `/courses/${SEED.freeCourse}`);
    expect(learnerView.body.data.title).toBe('Hiragana and First Words');

    await call(teacher, 'post', `/courses/${SEED.freeCourse}/draft/submit`);
    await call(SEED.users.sakuraOwner, 'post', `/courses/${SEED.freeCourse}/draft/approve`);
    const after = await call(SEED.users.aiko, 'get', `/courses/${SEED.freeCourse}`);
    expect(after.body.data.title).toBe('Hiragana and First Words (2nd edition)');

    const versions = await ownerQuery<{ version: number; status: string }>(
      'SELECT version, status FROM course_versions WHERE course_id = $1 ORDER BY version',
      [SEED.freeCourse],
    );
    expect(versions).toEqual([
      { version: 1, status: 'SUPERSEDED' },
      { version: 2, status: 'PUBLISHED' },
    ]);
  });

  it('limits who may edit, review, and see drafts', async () => {
    const ownersCourse = await call(SEED.users.sakuraOwner, 'post', '/courses', {
      slug: 'owner-course',
      title: 'School rules',
      summary: 'How our school works for every learner.',
      language: 'en',
      priceMinor: 0,
      currency: 'NPR',
    });
    const courseId: string = ownersCourse.body.data.id;

    expect((await call(SEED.users.instructor, 'get', `/courses/${courseId}/draft`)).status).toBe(403);
    expect((await call(SEED.users.aiko, 'get', `/courses/${courseId}/draft`)).status).toBe(403);
    expect((await call(SEED.users.aiko, 'get', '/authoring/courses')).status).toBe(403);

    const other = await ctx.http.get(`${base}/courses/${courseId}/draft`).set(await auth(SEED.users.everestOwner));
    expect(other.status).toBe(404);

    const mine = await call(SEED.users.instructor, 'get', '/authoring/courses');
    expect(mine.body.data.every((course: { mine: boolean }) => course.mine)).toBe(true);
    const all = await call(SEED.users.sakuraOwner, 'get', '/authoring/courses');
    expect(all.body.data.map((course: { courseId: string }) => course.courseId)).toContain(courseId);
    expect(all.body.data.length).toBeGreaterThan(mine.body.data.length);
  });
});
