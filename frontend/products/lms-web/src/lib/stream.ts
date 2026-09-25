import type { Question } from './edu-api.ts';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const MAX_POST_LENGTH = 5000;

/** Every change a person can make in the class stream (FR-COMM-701/702). */
export type StreamAction =
  | { kind: 'announce'; courseId: string; body: string }
  | { kind: 'edit-announcement'; announcementId: string; body: string }
  | { kind: 'delete-announcement'; announcementId: string }
  | { kind: 'ask'; courseId: string; lessonId: string; body: string }
  | { kind: 'edit-question'; questionId: string; body: string }
  | { kind: 'answer'; questionId: string; body: string }
  | { kind: 'edit-answer'; answerId: string; body: string }
  | { kind: 'accept'; questionId: string; answerId: string | null }
  | { kind: 'vote'; answerId: string; up: boolean }
  | { kind: 'hide'; target: 'question' | 'answer'; id: string; reason: string }
  | { kind: 'restore'; target: 'question' | 'answer'; id: string };

export type StreamRequest = { method: 'POST' | 'PATCH' | 'PUT' | 'DELETE'; path: string; body?: object };

const text = (body: string) => body.trim().slice(0, MAX_POST_LENGTH);

/** The API call for an action, or an error message when the input is not usable. */
export function streamRequest(action: StreamAction): StreamRequest | { error: string } {
  const ids = Object.entries(action)
    .filter(([key]) => key.endsWith('Id') || key === 'id')
    .map(([, value]) => value as string | null);
  if (ids.some((id) => id !== null && !UUID.test(id))) return { error: 'This page is out of date. Reload and try again.' };
  if ('body' in action && !action.body.trim()) return { error: 'Write something first.' };
  if (action.kind === 'hide' && action.reason.trim().length < 3) return { error: 'Give a short reason (at least 3 characters).' };

  switch (action.kind) {
    case 'announce':
      return { method: 'POST', path: `/courses/${action.courseId}/announcements`, body: { body: text(action.body) } };
    case 'edit-announcement':
      return { method: 'PATCH', path: `/announcements/${action.announcementId}`, body: { body: text(action.body) } };
    case 'delete-announcement':
      return { method: 'DELETE', path: `/announcements/${action.announcementId}` };
    case 'ask':
      return { method: 'POST', path: `/courses/${action.courseId}/lessons/${action.lessonId}/questions`, body: { body: text(action.body) } };
    case 'edit-question':
      return { method: 'PATCH', path: `/questions/${action.questionId}`, body: { body: text(action.body) } };
    case 'answer':
      return { method: 'POST', path: `/questions/${action.questionId}/answers`, body: { body: text(action.body) } };
    case 'edit-answer':
      return { method: 'PATCH', path: `/answers/${action.answerId}`, body: { body: text(action.body) } };
    case 'accept':
      return { method: 'POST', path: `/questions/${action.questionId}/accept`, body: { answerId: action.answerId } };
    case 'vote':
      return { method: action.up ? 'PUT' : 'DELETE', path: `/answers/${action.answerId}/vote` };
    case 'hide':
      return { method: 'POST', path: `/${action.target}s/${action.id}/hide`, body: { reason: action.reason.trim().slice(0, 500) } };
    case 'restore':
      return { method: 'POST', path: `/${action.target}s/${action.id}/restore` };
  }
}

export type QuestionFilter = 'all' | 'unanswered' | 'mine';

export function filterQuestions(questions: Question[], filter: QuestionFilter): Question[] {
  if (filter === 'mine') return questions.filter((question) => question.mine);
  if (filter === 'unanswered') return questions.filter((question) => !question.hidden && !question.answers.some((answer) => !answer.hidden));
  return questions;
}

/** A short status line such as "Answered", "2 answers", or "No answers yet". */
export function questionStatus(question: Question): string {
  if (question.acceptedAnswerId) return 'Answered';
  const count = question.answers.filter((answer) => !answer.hidden).length;
  if (count === 0) return 'No answers yet';
  return count === 1 ? '1 answer' : `${count} answers`;
}
