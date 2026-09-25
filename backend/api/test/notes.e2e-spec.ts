/**
 * Private lesson notes (FR-PLAYER-403): owner-only visibility (even teachers cannot read them), lesson
 * access rules, editing and deleting, and notes staying with their lesson when the course is republished.
 */
import { SEED, createTestContext, resetDatabase, type TestContext } from './helpers';

describe('lesson notes', () => {
  let ctx: TestContext;
  const base = `/v1/tenants/${SEED.sakura}`;
  const auth = async (subject: string) => ({ Authorization: `Bearer ${await ctx.devToken(subject)}` });
  const api = async (subject: string, method: 'get' | 'post' | 'patch' | 'delete', path: string, body?: object) => {
    const req = ctx.http[method](`${base}${path}`).set(await auth(subject));
    return body ? req.send(body) : req;
  };
  const lessonNotes = (subject: string, lessonId: string) => api(subject, 'get', `/courses/${SEED.freeCourse}/lessons/${lessonId}/notes`);
  let noteId = '';

  beforeAll(async () => {
    await resetDatabase();
    ctx = await createTestContext();
    await api(SEED.users.aiko, 'post', `/courses/${SEED.freeCourse}/enrollments`);
  });

  afterAll(async () => {
    await ctx?.app.close();
  });

  it('lets a learner write, edit, and delete private notes with a moment in the lesson', async () => {
    const created = await api(SEED.users.aiko, 'post', `/courses/${SEED.freeCourse}/lessons/${SEED.freeLesson}/notes`, { body: 'か looks like "ka" with a hook', timestampSec: 42 });
    expect(created.status).toBe(201);
    noteId = created.body.data.id;
    expect(created.body.data).toMatchObject({ timestampSec: 42, lessonTitle: 'The か row', lessonId: SEED.freeLesson });
    await api(SEED.users.aiko, 'post', `/courses/${SEED.freeCourse}/lessons/${SEED.freeLesson}/notes`, { body: 'Practise き and く' });

    let notes = (await lessonNotes(SEED.users.aiko, SEED.freeLesson)).body.data;
    expect(notes.map((n: { body: string }) => n.body)).toEqual(['か looks like "ka" with a hook', 'Practise き and く']);

    expect((await api(SEED.users.aiko, 'patch', `/notes/${noteId}`, { body: 'か = ka', timestampSec: null })).body.data).toMatchObject({ body: 'か = ka', timestampSec: null });
    expect((await api(SEED.users.aiko, 'post', `/courses/${SEED.freeCourse}/lessons/${SEED.freeLesson}/notes`, { body: '' })).status).toBe(400);

    const other = notes.find((n: { body: string }) => n.body === 'Practise き and く');
    expect((await api(SEED.users.aiko, 'delete', `/notes/${other.id}`)).status).toBe(204);
    notes = (await lessonNotes(SEED.users.aiko, SEED.freeLesson)).body.data;
    expect(notes).toHaveLength(1);
  });

  it('keeps notes private from other learners and from teachers', async () => {
    expect((await lessonNotes(SEED.users.instructor, SEED.freeLesson)).body.data).toEqual([]);
    expect((await api(SEED.users.instructor, 'patch', `/notes/${noteId}`, { body: 'teacher edit' })).status).toBe(404);
    expect((await api(SEED.users.sakuraOwner, 'delete', `/notes/${noteId}`)).status).toBe(404);
    expect((await api(SEED.users.sakuraOwner, 'get', `/courses/${SEED.freeCourse}/notes`)).body.data).toEqual([]);

    // Bikash is not enrolled: preview lessons allow notes, locked lessons do not.
    expect((await api(SEED.users.bikash, 'post', `/courses/${SEED.freeCourse}/lessons/${SEED.freeLesson}/notes`, { body: 'x' })).body.error.code).toBe('NOT_ENTITLED');
    expect((await api(SEED.users.bikash, 'post', `/courses/${SEED.freeCourse}/lessons/${SEED.freePreviewLesson}/notes`, { body: 'preview note' })).status).toBe(201);
    expect((await lessonNotes(SEED.users.bikash, SEED.freePreviewLesson)).body.data.map((n: { body: string }) => n.body)).toEqual(['preview note']);
    expect((await lessonNotes(SEED.users.aiko, SEED.freePreviewLesson)).body.data).toEqual([]);

    const otherTenant = await ctx.http.patch(`/v1/tenants/${SEED.everest}/notes/${noteId}`).set(await auth(SEED.users.everestOwner)).send({ body: 'x' });
    expect(otherTenant.status).toBe(404);
  });

  it('keeps notes with their lesson when the course is republished', async () => {
    const draft = (await api(SEED.users.instructor, 'post', `/courses/${SEED.freeCourse}/draft`)).body.data;
    const lesson = draft.sections.flatMap((s: { lessons: { id: string; title: string }[] }) => s.lessons).find((l: { title: string }) => l.title === 'The か row');
    await api(SEED.users.instructor, 'patch', `/courses/${SEED.freeCourse}/draft/lessons/${lesson.id}`, { title: 'The か row (か, き, く, け, こ)' });
    await api(SEED.users.instructor, 'post', `/courses/${SEED.freeCourse}/draft/submit`);
    await api(SEED.users.sakuraOwner, 'post', `/courses/${SEED.freeCourse}/draft/approve`);
    expect(lesson.id).not.toBe(SEED.freeLesson);

    const all = (await api(SEED.users.aiko, 'get', `/courses/${SEED.freeCourse}/notes`)).body.data;
    expect(all).toMatchObject([{ id: noteId, body: 'か = ka', lessonId: lesson.id }]);
    expect((await lessonNotes(SEED.users.aiko, lesson.id)).body.data.map((n: { id: string }) => n.id)).toEqual([noteId]);
  });
});
