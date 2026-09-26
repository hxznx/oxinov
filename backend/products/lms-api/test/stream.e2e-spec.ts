/**
 * Class stream (FR-COMM-701/702): teacher announcements, lesson questions and answers with one accepted
 * answer and upvotes, author edits, teacher moderation with reasons (audited), no discussion for people
 * without course access, and questions staying with their lesson when the course is republished.
 */
import { SEED, createTestContext, ownerQuery, resetDatabase, type TestContext } from './helpers';

type Answer = {
  id: string;
  body: string;
  votes: number;
  voted: boolean;
  accepted: boolean;
  mine: boolean;
  hidden: { reason: string } | null;
  edited: boolean;
};
type Question = {
  id: string;
  body: string;
  lessonId: string | null;
  acceptedAnswerId: string | null;
  canAccept: boolean;
  hidden: { reason: string } | null;
  answers: Answer[];
};

describe('class stream', () => {
  let ctx: TestContext;
  const base = `/v1/tenants/${SEED.sakura}`;
  const auth = async (subject: string) => ({
    Authorization: `Bearer ${await ctx.devToken(subject)}`,
  });
  const api = async (
    subject: string,
    method: 'get' | 'post' | 'patch' | 'put' | 'delete',
    path: string,
    body?: object,
  ) => {
    const req = ctx.http[method](`${base}${path}`).set(await auth(subject));
    return body ? req.send(body) : req;
  };
  const { aiko, bikash, instructor, sakuraOwner } = SEED.users;
  const course = `/courses/${SEED.freeCourse}`;
  const lessonQuestions = async (subject: string, lessonId: string = SEED.freeLesson) =>
    (await api(subject, 'get', `${course}/lessons/${lessonId}/questions`)).body.data as {
      canModerate: boolean;
      questions: Question[];
    };
  let questionId = '';
  let bikashAnswer = '';
  let teacherAnswer = '';

  beforeAll(async () => {
    await resetDatabase();
    ctx = await createTestContext();
    await api(aiko, 'post', `${course}/enrollments`);
  });

  afterAll(async () => {
    await ctx?.app.close();
  });

  it('lets course teachers post announcements that enrolled learners read', async () => {
    const posted = await api(instructor, 'post', `${course}/announcements`, {
      body: '  Welcome! Live class on Friday at 7 pm.  ',
    });
    expect(posted.status).toBe(201);
    expect(posted.body.data).toMatchObject({
      body: 'Welcome! Live class on Friday at 7 pm.',
      author: { teacher: true },
      edited: false,
    });
    await api(sakuraOwner, 'post', `${course}/announcements`, {
      body: 'Fees for next term are now open.',
    });

    const seen = (await api(aiko, 'get', `${course}/announcements`)).body.data;
    expect(seen.canPost).toBe(false);
    expect(seen.announcements.map((a: { body: string }) => a.body)).toEqual([
      'Fees for next term are now open.',
      'Welcome! Live class on Friday at 7 pm.',
    ]);

    expect((await api(aiko, 'post', `${course}/announcements`, { body: 'hi all' })).status).toBe(
      403,
    );
    expect(
      (await api(aiko, 'patch', `/announcements/${posted.body.data.id}`, { body: 'x' })).status,
    ).toBe(403);
    expect((await api(bikash, 'get', `${course}/announcements`)).body.error.code).toBe(
      'NOT_ENTITLED',
    );
    expect((await api(instructor, 'post', `${course}/announcements`, { body: '   ' })).status).toBe(
      400,
    );

    const edited = await api(instructor, 'patch', `/announcements/${posted.body.data.id}`, {
      body: 'Live class moved to Saturday.',
    });
    expect(edited.body.data).toMatchObject({ body: 'Live class moved to Saturday.', edited: true });
    expect((await api(instructor, 'delete', `/announcements/${posted.body.data.id}`)).status).toBe(
      204,
    );
    expect(
      (await api(aiko, 'get', `${course}/announcements`)).body.data.announcements,
    ).toHaveLength(1);
  });

  it('runs lesson Q&A with answers, upvotes, and one accepted answer', async () => {
    const asked = await api(aiko, 'post', `${course}/lessons/${SEED.freeLesson}/questions`, {
      body: 'Why is き written with two strokes across?',
    });
    expect(asked.status).toBe(201);
    questionId = asked.body.data.id;
    expect(asked.body.data).toMatchObject({
      lessonId: SEED.freeLesson,
      lessonTitle: 'The か row',
      mine: true,
      canAccept: true,
      answers: [],
    });

    await api(bikash, 'post', `${course}/enrollments`);
    bikashAnswer = (
      await api(bikash, 'post', `/questions/${questionId}/answers`, {
        body: 'It comes from the kanji 幾.',
      })
    ).body.data.answers[0].id;
    const withTeacher = (
      await api(instructor, 'post', `/questions/${questionId}/answers`, {
        body: 'Both strokes go left to right.',
      })
    ).body.data as Question;
    teacherAnswer = withTeacher.answers.find((a) => a.body.startsWith('Both'))!.id;

    // Votes: one per person, undo works, no voting for yourself.
    expect((await api(aiko, 'put', `/answers/${teacherAnswer}/vote`)).status).toBe(200);
    expect((await api(aiko, 'put', `/answers/${teacherAnswer}/vote`)).status).toBe(200);
    await api(bikash, 'put', `/answers/${teacherAnswer}/vote`);
    expect((await api(bikash, 'put', `/answers/${bikashAnswer}/vote`)).status).toBe(409);
    let thread = (await lessonQuestions(aiko)).questions[0]!;
    expect(thread.answers.map((a) => [a.body.slice(0, 4), a.votes, a.voted])).toEqual([
      ['Both', 2, true],
      ['It c', 0, false],
    ]);
    await api(bikash, 'delete', `/answers/${teacherAnswer}/vote`);
    expect((await lessonQuestions(aiko)).questions[0]!.answers[0]!.votes).toBe(1);

    // Only the asker or a teacher accepts; the accepted answer is listed first.
    expect(
      (await api(bikash, 'post', `/questions/${questionId}/accept`, { answerId: bikashAnswer }))
        .status,
    ).toBe(403);
    thread = (
      await api(aiko, 'post', `/questions/${questionId}/accept`, { answerId: bikashAnswer })
    ).body.data;
    expect(thread.acceptedAnswerId).toBe(bikashAnswer);
    expect(thread.answers.map((a) => [a.id, a.accepted])).toEqual([
      [bikashAnswer, true],
      [teacherAnswer, false],
    ]);
    expect((await lessonQuestions(bikash)).questions[0]!.canAccept).toBe(false);

    // Authors edit their own posts only.
    expect((await api(bikash, 'patch', `/questions/${questionId}`, { body: 'x' })).status).toBe(
      403,
    );
    expect((await api(aiko, 'patch', `/answers/${bikashAnswer}`, { body: 'x' })).status).toBe(403);
    thread = (
      await api(bikash, 'patch', `/answers/${bikashAnswer}`, {
        body: 'It comes from the cursive form of 幾.',
      })
    ).body.data;
    expect(thread.answers[0]).toMatchObject({
      body: 'It comes from the cursive form of 幾.',
      edited: true,
    });
    expect(thread.answers[1]!.edited).toBe(false);
  });

  it('lets teachers hide posts with a reason, visible only to staff and the author', async () => {
    expect(
      (await api(aiko, 'post', `/answers/${bikashAnswer}/hide`, { reason: 'spam' })).status,
    ).toBe(403);
    expect(
      (await api(instructor, 'post', `/answers/${bikashAnswer}/hide`, { reason: '' })).status,
    ).toBe(400);

    const hidden = (
      await api(instructor, 'post', `/answers/${bikashAnswer}/hide`, {
        reason: 'Please keep answers in English or Japanese.',
      })
    ).body.data as Question;
    expect(hidden.acceptedAnswerId).toBeNull();
    expect(hidden.answers.find((a) => a.id === bikashAnswer)!.hidden).toMatchObject({
      reason: 'Please keep answers in English or Japanese.',
    });

    expect((await lessonQuestions(aiko)).questions[0]!.answers.map((a) => a.id)).toEqual([
      teacherAnswer,
    ]);
    const own = (await lessonQuestions(bikash)).questions[0]!.answers.find(
      (a) => a.id === bikashAnswer,
    )!;
    expect(own.hidden?.reason).toBe('Please keep answers in English or Japanese.');
    expect((await api(bikash, 'patch', `/answers/${bikashAnswer}`, { body: 'edit' })).status).toBe(
      409,
    );
    expect((await api(aiko, 'put', `/answers/${bikashAnswer}/vote`)).status).toBe(404);
    expect(
      (await api(aiko, 'post', `/questions/${questionId}/accept`, { answerId: bikashAnswer }))
        .status,
    ).toBe(404);

    await api(sakuraOwner, 'post', `/answers/${bikashAnswer}/restore`);
    expect((await lessonQuestions(aiko)).questions[0]!.answers).toHaveLength(2);

    await api(instructor, 'post', `/questions/${questionId}/hide`, {
      reason: 'Duplicate of the pinned question.',
    });
    expect((await lessonQuestions(bikash)).questions).toEqual([]);
    expect(
      (await api(bikash, 'post', `/questions/${questionId}/answers`, { body: 'x' })).status,
    ).toBe(404);
    expect((await lessonQuestions(aiko)).questions[0]!.hidden?.reason).toBe(
      'Duplicate of the pinned question.',
    );
    expect(
      (await api(aiko, 'post', `/questions/${questionId}/answers`, { body: 'x' })).status,
    ).toBe(409);
    const staffView = await lessonQuestions(instructor);
    expect(staffView.canModerate).toBe(true);
    expect(staffView.questions).toHaveLength(1);
    await api(instructor, 'post', `/questions/${questionId}/restore`);

    const audit = await ownerQuery<{ action: string; reason: string | null }>(
      "SELECT action, reason FROM audit_events WHERE tenant_id = $1 AND target_type IN ('lesson_question', 'lesson_answer') ORDER BY created_at",
      [SEED.sakura],
    );
    expect(audit.map((e) => [e.action, e.reason])).toEqual([
      ['answer.hidden', 'Please keep answers in English or Japanese.'],
      ['answer.restored', null],
      ['question.hidden', 'Duplicate of the pinned question.'],
      ['question.restored', null],
    ]);
  });

  it('shows no discussion to people without course access, even on free previews', async () => {
    // Another school's owner cannot reach this school's course, even through their own tenant.
    const crossTenant = await ctx.http
      .get(`/v1/tenants/${SEED.everest}${course}/questions`)
      .set(await auth(SEED.users.everestOwner));
    expect(crossTenant.status).toBe(404);
    expect(
      (
        await api(
          SEED.users.everestOwner,
          'get',
          `${course}/lessons/${SEED.freePreviewLesson}/questions`,
        )
      ).status,
    ).toBe(404);

    // A fresh paid-course preview: Aiko is not entitled there.
    const preview = await api(
      aiko,
      'get',
      `/courses/${SEED.paidCourse}/lessons/${SEED.paidPreviewLesson}/questions`,
    );
    expect(preview.body.error.code).toBe('NOT_ENTITLED');
    expect(
      (
        await api(
          aiko,
          'post',
          `/courses/${SEED.paidCourse}/lessons/${SEED.paidPreviewLesson}/questions`,
          { body: 'x' },
        )
      ).body.error.code,
    ).toBe('NOT_ENTITLED');
  });

  it('keeps questions with their lesson when the course is republished', async () => {
    const draft = (await api(instructor, 'post', `${course}/draft`)).body.data;
    const lesson = draft.sections
      .flatMap((s: { lessons: { id: string; title: string }[] }) => s.lessons)
      .find((l: { title: string }) => l.title === 'The か row');
    await api(instructor, 'post', `${course}/draft/submit`);
    await api(sakuraOwner, 'post', `${course}/draft/approve`);
    expect(lesson.id).not.toBe(SEED.freeLesson);

    expect((await lessonQuestions(aiko, lesson.id)).questions.map((q) => q.id)).toEqual([
      questionId,
    ]);
    const overview = (await api(bikash, 'get', `${course}/questions`)).body.data as {
      questions: Question[];
    };
    expect(overview.questions).toMatchObject([{ id: questionId, lessonId: lesson.id }]);
  });
});
