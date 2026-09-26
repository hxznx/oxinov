/**
 * Quiz builder (FR-ASSESS-501/502): teachers build sections and questions, publishing needs full pools,
 * learners take the published quiz, and structure freezes once anyone has taken it.
 */
import { SEED, createTestContext, ownerQuery, resetDatabase, type TestContext } from './helpers';

type Quiz = {
  id: string;
  status: string;
  editable: boolean;
  attempts: number;
  sections: { id: string; title: string; questionCount: number; available: number }[];
  questions?: Record<string, { id: string; prompt: string; version: number; answerKey: string[]; choices: { id: string; text: string }[] }[]>;
};

describe('quiz builder', () => {
  let ctx: TestContext;
  const base = `/v1/tenants/${SEED.sakura}`;
  const auth = async (subject: string) => ({ Authorization: `Bearer ${await ctx.devToken(subject)}` });
  const api = async (subject: string, method: 'get' | 'post' | 'patch' | 'put' | 'delete', path: string, body?: object) => {
    const req = ctx.http[method](`${base}${path}`).set(await auth(subject));
    return body ? req.send(body) : req;
  };
  const settings = { title: 'Kanji check', kind: 'PRACTICE', timeLimitMin: 5, passPercent: 50, maxAttempts: 3, answerRelease: 'AFTER_SUBMIT', shuffleQuestions: false };
  const teacher = SEED.users.instructor;
  let quizId = '';
  let sectionId = '';

  beforeAll(async () => {
    await resetDatabase();
    ctx = await createTestContext();
  });

  afterAll(async () => {
    await ctx?.app.close();
  });

  it('builds a quiz and refuses to publish until every pool is full', async () => {
    const created = await api(teacher, 'post', `/courses/${SEED.freeCourse}/quizzes`, settings);
    expect(created.status).toBe(201);
    quizId = created.body.data.id;
    expect(created.body.data).toMatchObject({ status: 'DRAFT', editable: true, timeLimitMin: 5, sections: [] });

    expect((await api(teacher, 'post', `/quizzes/${quizId}/publish`)).status).toBe(409);
    let quiz: Quiz = (await api(teacher, 'post', `/quizzes/${quizId}/sections`, { title: 'Kanji', questionCount: 2 })).body.data;
    sectionId = quiz.sections[0]!.id;
    const empty = await api(teacher, 'post', `/quizzes/${quizId}/publish`);
    expect(empty.body.error.message).toMatch(/draws 2 questions but has 0/);

    const badQuestion = await api(teacher, 'post', `/quizzes/${quizId}/sections/${sectionId}/questions`, { type: 'SINGLE_CHOICE', prompt: 'x', choices: ['a', 'b'], correct: [0, 1] });
    expect(badQuestion.status).toBe(400);
    expect(badQuestion.body.error.message).toBe('Mark exactly one correct choice.');

    await api(teacher, 'post', `/quizzes/${quizId}/sections/${sectionId}/questions`, {
      type: 'SINGLE_CHOICE',
      prompt: 'How is 「火」 read?',
      choices: ['ひ', 'みず', 'き'],
      correct: [0],
      explanation: '火 (ひ) means fire.',
    });
    quiz = (
      await api(teacher, 'post', `/quizzes/${quizId}/sections/${sectionId}/questions`, { type: 'FILL_BLANK', prompt: 'Write 「木」 in rōmaji.', accepted: ['ki', 'き'], marks: 2 })
    ).body.data;
    expect(quiz.sections[0]).toMatchObject({ questionCount: 2, available: 2 });
    expect(quiz.questions![sectionId]![0]).toMatchObject({ answerKey: ['a'], choices: [{ id: 'a', text: 'ひ' }, { id: 'b', text: 'みず' }, { id: 'c', text: 'き' }] });

    quiz = (await api(teacher, 'post', `/quizzes/${quizId}/publish`)).body.data;
    expect(quiz.status).toBe('APPROVED');
  });

  it('lets enrolled learners take the published quiz with correct grading', async () => {
    await api(SEED.users.aiko, 'post', `/courses/${SEED.freeCourse}/enrollments`);
    const exams = await api(SEED.users.aiko, 'get', `/courses/${SEED.freeCourse}/exams`);
    expect(exams.body.data.map((exam: { title: string }) => exam.title)).toContain('Kanji check');

    const attempt = (await api(SEED.users.aiko, 'post', `/exams/${quizId}/attempts`)).body.data;
    const [choiceItem, textItem] = attempt.items as { id: string; type: string }[];
    expect(attempt.items.map((item: { type: string }) => item.type)).toEqual(['SINGLE_CHOICE', 'FILL_BLANK']);
    await api(SEED.users.aiko, 'put', `/exam-attempts/${attempt.id}/answers`, {
      answers: [
        { itemId: choiceItem!.id, response: { choiceIds: ['a'] } },
        { itemId: textItem!.id, response: { text: ' KI ' } },
      ],
    });
    const result = (await api(SEED.users.aiko, 'post', `/exam-attempts/${attempt.id}/submit`)).body.data.result;
    expect(result).toMatchObject({ score: 3, maxScore: 3, passed: true });
  });

  it('freezes structure after attempts, keeps attempts on their question copies, and supports copy and close', async () => {
    const changed = await api(teacher, 'patch', `/quizzes/${quizId}`, { ...settings, timeLimitMin: 10 });
    expect(changed.status).toBe(409);
    expect((await api(teacher, 'post', `/quizzes/${quizId}/unpublish`)).status).toBe(409);
    expect((await api(teacher, 'post', `/quizzes/${quizId}/sections`, { title: 'More', questionCount: 1 })).status).toBe(409);

    // The pool is exactly as large as the quiz needs, so no question can be removed yet.
    let quiz: Quiz = (await api(teacher, 'get', `/quizzes/${quizId}`)).body.data;
    const first = quiz.questions![sectionId]![0]!;
    expect((await api(teacher, 'delete', `/quizzes/${quizId}/questions/${first.id}`)).status).toBe(409);

    // Correcting a question bumps its version; Aiko's finished attempt still shows the original text.
    quiz = (await api(teacher, 'patch', `/quizzes/${quizId}/questions/${first.id}`, { type: 'SINGLE_CHOICE', prompt: 'How do you read 「火」?', choices: ['ひ', 'みず'], correct: [0] })).body.data;
    expect(quiz.questions![sectionId]![0]).toMatchObject({ version: 2, prompt: 'How do you read 「火」?' });
    const [attemptRow] = await ownerQuery<{ id: string }>('SELECT id FROM exam_attempts WHERE blueprint_id = $1', [quizId]);
    const review = await api(SEED.users.aiko, 'get', `/exam-attempts/${attemptRow!.id}`);
    expect(review.body.data.items[0].prompt).toBe('How is 「火」 read?');

    const copy: Quiz = (await api(teacher, 'post', `/quizzes/${quizId}/duplicate`)).body.data;
    expect(copy).toMatchObject({ status: 'DRAFT', editable: true, attempts: 0 });
    expect(copy.sections[0]).toMatchObject({ title: 'Kanji', available: 2 });

    expect((await api(teacher, 'post', `/quizzes/${quizId}/close`)).body.data.status).toBe('RETIRED');
    const exams = await api(SEED.users.aiko, 'get', `/courses/${SEED.freeCourse}/exams`);
    expect(exams.body.data.map((exam: { id: string }) => exam.id)).not.toContain(quizId);
    expect((await api(teacher, 'post', `/quizzes/${quizId}/sections/${sectionId}/questions`, { type: 'TRUE_FALSE', prompt: 'x', answer: true })).status).toBe(409);
  });

  it('gives a course without a question bank its own, and limits who can build', async () => {
    const course = await api(SEED.users.sakuraOwner, 'post', '/courses', {
      slug: 'owner-it',
      title: 'Linux basics',
      summary: 'Commands every beginner needs on a Linux server.',
      language: 'en',
      priceMinor: 0,
      currency: 'NPR',
    });
    const courseId: string = course.body.data.id;
    const quiz = await api(SEED.users.sakuraOwner, 'post', `/courses/${courseId}/quizzes`, { ...settings, title: 'Commands' });
    expect(quiz.status).toBe(201);
    const [row] = await ownerQuery<{ program_id: string | null; name: string }>(
      'SELECT c.program_id, p.name FROM courses c JOIN programs p ON p.id = c.program_id WHERE c.id = $1',
      [courseId],
    );
    expect(row?.name).toBe('Linux basics question bank');

    expect((await api(teacher, 'get', `/courses/${courseId}/quizzes`)).status).toBe(403);
    expect((await api(teacher, 'get', `/quizzes/${quiz.body.data.id}`)).status).toBe(403);
    expect((await api(SEED.users.aiko, 'get', `/courses/${SEED.freeCourse}/quizzes`)).status).toBe(403);
    const other = await ctx.http.get(`/v1/tenants/${SEED.everest}/quizzes/${quizId}`).set(await auth(SEED.users.everestOwner));
    expect(other.status).toBe(404);
  });
});
