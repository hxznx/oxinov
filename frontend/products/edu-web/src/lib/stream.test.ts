// Unit tests for class stream helpers. Run: pnpm --filter @oxinov/edu-web test
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Answer, Question } from './edu-api.ts';
import { filterQuestions, questionStatus, streamRequest } from './stream.ts';

const ID = '6f5b09b3-c798-4b22-bdc1-21e034766201';
const OTHER = '4a17ea60-1c06-4cdd-8f80-b89bc4c713b4';

const answer = (overrides: Partial<Answer> = {}): Answer => ({
  id: OTHER,
  body: 'answer',
  author: { name: 'Aiko', teacher: false },
  mine: false,
  votes: 0,
  voted: false,
  accepted: false,
  hidden: null,
  createdAt: '2026-09-26T00:00:00Z',
  edited: false,
  ...overrides,
});

const question = (overrides: Partial<Question> = {}): Question => ({
  id: ID,
  lessonId: ID,
  lessonTitle: 'Lesson',
  body: 'question',
  author: { name: 'Bikash', teacher: false },
  mine: false,
  acceptedAnswerId: null,
  canAccept: false,
  hidden: null,
  createdAt: '2026-09-26T00:00:00Z',
  edited: false,
  answers: [],
  ...overrides,
});

describe('streamRequest', () => {
  it('builds API calls with trimmed text', () => {
    assert.deepEqual(streamRequest({ kind: 'ask', courseId: ID, lessonId: OTHER, body: '  Why?  ' }), {
      method: 'POST',
      path: `/courses/${ID}/lessons/${OTHER}/questions`,
      body: { body: 'Why?' },
    });
    assert.deepEqual(streamRequest({ kind: 'vote', answerId: ID, up: false }), { method: 'DELETE', path: `/answers/${ID}/vote` });
    assert.deepEqual(streamRequest({ kind: 'accept', questionId: ID, answerId: null }), { method: 'POST', path: `/questions/${ID}/accept`, body: { answerId: null } });
    assert.deepEqual(streamRequest({ kind: 'hide', target: 'answer', id: ID, reason: ' Off topic ' }), { method: 'POST', path: `/answers/${ID}/hide`, body: { reason: 'Off topic' } });
    assert.deepEqual(streamRequest({ kind: 'restore', target: 'question', id: ID }), { method: 'POST', path: `/questions/${ID}/restore` });
  });

  it('refuses blank posts, short reasons, and malformed ids', () => {
    assert.ok('error' in streamRequest({ kind: 'announce', courseId: ID, body: '   ' }));
    assert.ok('error' in streamRequest({ kind: 'hide', target: 'question', id: ID, reason: 'no' }));
    assert.ok('error' in streamRequest({ kind: 'edit-answer', answerId: '../admin', body: 'x' }));
    assert.ok('error' in streamRequest({ kind: 'accept', questionId: ID, answerId: 'nope' }));
  });

  it('caps text at the API limit', () => {
    const request = streamRequest({ kind: 'answer', questionId: ID, body: 'a'.repeat(6000) });
    assert.ok(!('error' in request));
    assert.equal((request.body as { body: string }).body.length, 5000);
  });
});

describe('question lists', () => {
  const open = question({ id: 'open' });
  const answered = question({ id: 'answered', answers: [answer()] });
  const onlyHidden = question({ id: 'hidden-answer', answers: [answer({ hidden: { reason: 'x', at: '' } })] });
  const mine = question({ id: 'mine', mine: true, acceptedAnswerId: OTHER, answers: [answer({ accepted: true })] });

  it('filters unanswered and my questions', () => {
    const all = [open, answered, onlyHidden, mine];
    assert.deepEqual(filterQuestions(all, 'all'), all);
    assert.deepEqual(
      filterQuestions(all, 'unanswered').map((q) => q.id),
      ['open', 'hidden-answer'],
    );
    assert.deepEqual(
      filterQuestions(all, 'mine').map((q) => q.id),
      ['mine'],
    );
  });

  it('describes a question status', () => {
    assert.equal(questionStatus(open), 'No answers yet');
    assert.equal(questionStatus(answered), '1 answer');
    assert.equal(questionStatus(question({ answers: [answer(), answer()] })), '2 answers');
    assert.equal(questionStatus(onlyHidden), 'No answers yet');
    assert.equal(questionStatus(mine), 'Answered');
  });
});
