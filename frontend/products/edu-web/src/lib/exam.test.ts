// Unit tests for exam screen helpers. Run: pnpm --filter @oxinov/edu-web test
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { formatClock, isAnswered, percent, selectChoice } from './exam.ts';

describe('exam clock', () => {
  it('formats minutes and hours and never goes negative', () => {
    assert.equal(formatClock(0), '00:00');
    assert.equal(formatClock(65), '01:05');
    assert.equal(formatClock(3600), '1:00:00');
    assert.equal(formatClock(3725.9), '1:02:05');
    assert.equal(formatClock(-4), '00:00');
  });
});

describe('answers', () => {
  it('knows when a question is answered', () => {
    assert.equal(isAnswered(null), false);
    assert.equal(isAnswered({ choiceIds: [] }), false);
    assert.equal(isAnswered({ choiceIds: ['a'] }), true);
    assert.equal(isAnswered({ text: '   ' }), false);
    assert.equal(isAnswered({ text: 'はい' }), true);
  });

  it('keeps one choice for single choice and true/false, toggles for multiple choice', () => {
    assert.deepEqual(selectChoice('SINGLE_CHOICE', { choiceIds: ['a'] }, 'b'), { choiceIds: ['b'] });
    assert.deepEqual(selectChoice('TRUE_FALSE', null, 'true'), { choiceIds: ['true'] });
    assert.deepEqual(selectChoice('MULTIPLE_CHOICE', { choiceIds: ['a'] }, 'b'), { choiceIds: ['a', 'b'] });
    assert.deepEqual(selectChoice('MULTIPLE_CHOICE', { choiceIds: ['a', 'b'] }, 'a'), { choiceIds: ['b'] });
  });

  it('rounds the score percentage', () => {
    assert.equal(percent(2, 3), 67);
    assert.equal(percent(0, 0), 0);
  });
});
