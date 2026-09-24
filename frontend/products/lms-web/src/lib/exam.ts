import type { AnswerResponse, QuestionType } from './edu-api.ts';

/** mm:ss, or h:mm:ss for long exams. Never negative. */
export function formatClock(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (value: number) => String(value).padStart(2, '0');
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export function isAnswered(response: AnswerResponse | null | undefined): boolean {
  if (!response) return false;
  return 'choiceIds' in response ? response.choiceIds.length > 0 : response.text.trim().length > 0;
}

/** Applies a choice click: radio-style questions keep one choice, multiple choice toggles. */
export function selectChoice(type: QuestionType, current: AnswerResponse | null, choiceId: string): AnswerResponse {
  const selected = current && 'choiceIds' in current ? current.choiceIds : [];
  if (type !== 'MULTIPLE_CHOICE') return { choiceIds: [choiceId] };
  return { choiceIds: selected.includes(choiceId) ? selected.filter((id) => id !== choiceId) : [...selected, choiceId] };
}

export function percent(score: number, maxScore: number): number {
  return maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
}
