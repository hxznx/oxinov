/**
 * Turns what a teacher enters into the stored question shape used by the exam engine (FR-ASSESS-501):
 * choices get stable IDs "a", "b", …; true/false uses the IDs "true" and "false"; fill-in-the-blank keeps
 * its accepted answers, which grading compares after Unicode and case normalization.
 */
export type QuestionType = 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'FILL_BLANK';

export interface QuestionInput {
  type: QuestionType;
  choices?: string[];
  /** Indexes into `choices` that are correct (single and multiple choice). */
  correct?: number[];
  /** The correct statement value for true/false questions. */
  answer?: boolean;
  /** Accepted answers for fill-in-the-blank. */
  accepted?: string[];
}

export interface StoredAnswer {
  choices: { id: string; text: string }[];
  answerKey: string[];
}

export const TRUE_FALSE_CHOICES = [
  { id: 'true', text: 'True' },
  { id: 'false', text: 'False' },
];

const MAX_CHOICES = 8;
const MAX_ACCEPTED = 10;

/** Returns the stored form, or a message explaining what the teacher must fix. */
export function buildAnswer(input: QuestionInput): StoredAnswer | string {
  switch (input.type) {
    case 'TRUE_FALSE':
      if (typeof input.answer !== 'boolean') return 'Choose whether the statement is true or false.';
      return { choices: TRUE_FALSE_CHOICES, answerKey: [String(input.answer)] };

    case 'FILL_BLANK': {
      const accepted = [...new Set((input.accepted ?? []).map((answer) => answer.trim()).filter(Boolean))];
      if (accepted.length === 0) return 'Add at least one accepted answer.';
      if (accepted.length > MAX_ACCEPTED) return `Add at most ${MAX_ACCEPTED} accepted answers.`;
      if (accepted.some((answer) => answer.length > 200)) return 'Accepted answers must be at most 200 characters.';
      return { choices: [], answerKey: accepted };
    }

    case 'SINGLE_CHOICE':
    case 'MULTIPLE_CHOICE': {
      const texts = (input.choices ?? []).map((choice) => choice.trim());
      if (texts.length < 2 || texts.length > MAX_CHOICES) return `Add between 2 and ${MAX_CHOICES} choices.`;
      if (texts.some((text) => !text)) return 'Every choice needs text.';
      if (new Set(texts).size !== texts.length) return 'Two choices have the same text.';
      if (texts.some((text) => text.length > 500)) return 'Choices must be at most 500 characters.';
      const correct = [...new Set(input.correct ?? [])];
      if (correct.some((index) => !Number.isInteger(index) || index < 0 || index >= texts.length)) return 'Mark correct answers among the choices.';
      if (input.type === 'SINGLE_CHOICE' && correct.length !== 1) return 'Mark exactly one correct choice.';
      if (input.type === 'MULTIPLE_CHOICE' && correct.length === 0) return 'Mark at least one correct choice.';
      const choices = texts.map((text, index) => ({ id: String.fromCharCode(97 + index), text }));
      return { choices, answerKey: correct.sort((a, b) => a - b).map((index) => choices[index]!.id) };
    }

    default:
      return 'Choose a question type.';
  }
}

/** Section keys pick a question pool; each quiz section gets its own pool unless a quiz is copied. */
export function newSectionKey(random: () => number = Math.random): string {
  return `s${Math.floor(random() * 36 ** 8)
    .toString(36)
    .padStart(8, '0')}`;
}
