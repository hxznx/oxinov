import type { QuestionType, Quiz, QuizQuestion } from './edu-api.ts';

export const QUESTION_TYPES: [QuestionType, string][] = [
  ['SINGLE_CHOICE', 'One correct choice'],
  ['MULTIPLE_CHOICE', 'Several correct choices'],
  ['TRUE_FALSE', 'True or false'],
  ['FILL_BLANK', 'Type the answer'],
];

/** Reads the question form into the quiz builder API body. Choice rows are `choice` fields in order. */
export function questionFromForm(form: { get(name: string): unknown; getAll(name: string): unknown[] }) {
  const type = String(form.get('type') ?? 'SINGLE_CHOICE') as QuestionType;
  const choices = form.getAll('choice').map(String);
  // Blank trailing rows are ignored; indexes of correct rows are re-counted over the kept rows.
  const kept: number[] = [];
  choices.forEach((text, index) => text.trim() && kept.push(index));
  const correctRows = new Set(form.getAll('correct').map(Number));
  const body: Record<string, unknown> = {
    type,
    prompt: String(form.get('prompt') ?? ''),
    passage: String(form.get('passage') ?? ''),
    explanation: String(form.get('explanation') ?? ''),
    marks: Math.max(1, Math.min(10, Number(form.get('marks') ?? 1) || 1)),
  };
  if (type === 'SINGLE_CHOICE' || type === 'MULTIPLE_CHOICE') {
    body.choices = kept.map((index) => choices[index]!);
    body.correct = kept.flatMap((index, position) => (correctRows.has(index) ? [position] : []));
  } else if (type === 'TRUE_FALSE') {
    const answer = form.get('answer');
    if (answer === 'true' || answer === 'false') body.answer = answer === 'true';
  } else {
    body.accepted = String(form.get('accepted') ?? '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
  }
  return body;
}

/** The correct answer in words, for the teacher's question list. */
export function answerSummary(question: Pick<QuizQuestion, 'type' | 'choices' | 'answerKey'>): string {
  if (question.type === 'FILL_BLANK') return `Accepts: ${question.answerKey.join(', ')}`;
  if (question.type === 'TRUE_FALSE') return `Answer: ${question.answerKey[0] === 'true' ? 'True' : 'False'}`;
  const texts = question.choices.filter((choice) => question.answerKey.includes(choice.id)).map((choice) => choice.text);
  return `Correct: ${texts.join(', ')}`;
}

/** A question prompt cut to one line for the question list (design screen 10). */
export function shortPrompt(prompt: string, max = 60): string {
  const line = prompt.replace(/\s+/g, ' ').trim();
  return line.length > max ? `${line.slice(0, max - 1).trimEnd()}…` : line;
}

export type QuizSelection =
  | { mode: 'edit'; sectionId: string; question: QuizQuestion; number: number }
  | { mode: 'add'; sectionId: string }
  | { mode: 'none' };

/**
 * Which question the editor shows, from the address (`?q=` a question, `?add=` a section). Unknown values
 * fall back to the first question, then to adding to the first section, so the editor is never empty while
 * the quiz has a section.
 */
export function quizSelection(quiz: Pick<Quiz, 'sections' | 'questions'>, wanted: { q?: string; add?: string }): QuizSelection {
  const numbered = quiz.sections.flatMap((section) => (quiz.questions?.[section.id] ?? []).map((question) => ({ sectionId: section.id, question })));
  if (wanted.add && quiz.sections.some((section) => section.id === wanted.add)) return { mode: 'add', sectionId: wanted.add };
  const index = Math.max(0, numbered.findIndex((item) => item.question.id === wanted.q));
  const item = numbered[index];
  if (item) return { mode: 'edit', sectionId: item.sectionId, question: item.question, number: index + 1 };
  const first = quiz.sections[0];
  return first ? { mode: 'add', sectionId: first.id } : { mode: 'none' };
}
