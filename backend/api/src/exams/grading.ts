/**
 * Pure exam rules (FR-ASSESS-502, FR-EXAM-1203/1204). No framework or database imports so the
 * rules are unit-testable and could move to packages/domain if web or mobile need them.
 */

export type QuestionType = 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'FILL_BLANK';

export interface Choice {
  id: string;
  text: string;
}

/** What a learner submits for one item. */
export type AnswerResponse = { choiceIds: string[] } | { text: string };

export interface GradableItem {
  type: QuestionType;
  choices: readonly Choice[];
  answerKey: readonly string[];
  marks: number;
  sectionKey: string;
  response: AnswerResponse | null;
}

export interface SectionSpec {
  sectionKey: string;
  title: string;
}

export interface SectionScore {
  sectionKey: string;
  title: string;
  score: number;
  maxScore: number;
}

export interface GradedAttempt {
  items: { isCorrect: boolean; marksAwarded: number }[];
  score: number;
  maxScore: number;
  passed: boolean;
  sectionBreakdown: SectionScore[];
}

const MAX_TEXT_ANSWER = 500;

/** Normalizes free-text answers: Unicode NFKC (full-width → half-width), trim, case, spaces. */
export function normalizeText(value: string): string {
  return value.normalize('NFKC').trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Validates a response against the item it answers. Returns an error message, or null when valid.
 * Unknown choice IDs are rejected rather than silently graded wrong, so client bugs surface.
 */
export function validateResponse(
  item: Pick<GradableItem, 'type' | 'choices'>,
  response: unknown,
): string | null {
  if (typeof response !== 'object' || response === null) return 'response must be an object';

  if (item.type === 'FILL_BLANK') {
    const text = (response as { text?: unknown }).text;
    if (typeof text !== 'string') return 'response.text must be a string';
    if (text.length > MAX_TEXT_ANSWER) return `response.text must be at most ${MAX_TEXT_ANSWER} characters`;
    return null;
  }

  const choiceIds = (response as { choiceIds?: unknown }).choiceIds;
  if (!Array.isArray(choiceIds) || !choiceIds.every((id) => typeof id === 'string')) {
    return 'response.choiceIds must be an array of strings';
  }
  const known = new Set(item.choices.map((choice) => choice.id));
  if (!choiceIds.every((id) => known.has(id))) return 'response.choiceIds contains an unknown choice';
  if (new Set(choiceIds).size !== choiceIds.length) return 'response.choiceIds contains duplicates';
  if (item.type !== 'MULTIPLE_CHOICE' && choiceIds.length > 1) {
    return 'this question accepts one choice';
  }
  return null;
}

export function isCorrect(item: Pick<GradableItem, 'type' | 'answerKey' | 'response'>): boolean {
  const { response } = item;
  if (!response) return false;

  if (item.type === 'FILL_BLANK') {
    if (!('text' in response)) return false;
    const given = normalizeText(response.text);
    return given.length > 0 && item.answerKey.some((accepted) => normalizeText(accepted) === given);
  }

  if (!('choiceIds' in response)) return false;
  const given = new Set(response.choiceIds);
  const expected = new Set(item.answerKey);
  return given.size === expected.size && [...expected].every((id) => given.has(id));
}

/** Server-side grading; unanswered items score zero. Pass when score/max ≥ passPercent. */
export function gradeAttempt(
  items: readonly GradableItem[],
  sections: readonly SectionSpec[],
  passPercent: number,
): GradedAttempt {
  const breakdown = new Map<string, SectionScore>(
    sections.map((section) => [
      section.sectionKey,
      { sectionKey: section.sectionKey, title: section.title, score: 0, maxScore: 0 },
    ]),
  );

  const graded = items.map((item) => {
    const correct = isCorrect(item);
    const marksAwarded = correct ? item.marks : 0;
    const section = breakdown.get(item.sectionKey);
    if (section) {
      section.maxScore += item.marks;
      section.score += marksAwarded;
    }
    return { isCorrect: correct, marksAwarded };
  });

  const score = graded.reduce((sum, item) => sum + item.marksAwarded, 0);
  const maxScore = items.reduce((sum, item) => sum + item.marks, 0);
  // Integer comparison avoids floating-point edge cases at the pass boundary.
  const passed = maxScore > 0 && score * 100 >= passPercent * maxScore;

  return { items: graded, score, maxScore, passed, sectionBreakdown: [...breakdown.values()] };
}

/**
 * Picks `count` questions from a pool. With `shuffle`, uses the supplied random source
 * (Fisher–Yates); otherwise keeps pool order. Throws if the pool is too small.
 */
export function pickQuestions<T>(
  pool: readonly T[],
  count: number,
  shuffle: boolean,
  random: () => number = Math.random,
): T[] {
  if (pool.length < count) {
    throw new RangeError(`question pool has ${pool.length} items; blueprint needs ${count}`);
  }
  const copy = [...pool];
  if (shuffle) {
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(random() * (i + 1));
      [copy[i], copy[j]] = [copy[j] as T, copy[i] as T];
    }
  }
  return copy.slice(0, count);
}
