// Unit tests for quiz builder helpers. Run: pnpm --filter @oxinov/lms-web test
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { answerSummary, questionFromForm } from './quiz.ts';

const form = (entries: [string, string][]) => {
  const data = new FormData();
  entries.forEach(([name, value]) => data.append(name, value));
  return data;
};

describe('question form', () => {
  it('drops blank choice rows and re-counts which rows are correct', () => {
    const body = questionFromForm(
      form([
        ['type', 'MULTIPLE_CHOICE'],
        ['prompt', 'Which commands list files?'],
        ['choice', 'ls'],
        ['choice', ''],
        ['choice', 'dir'],
        ['choice', 'rm'],
        ['correct', '0'],
        ['correct', '2'],
        ['marks', '2'],
      ]),
    );
    assert.deepEqual(body.choices, ['ls', 'dir', 'rm']);
    assert.deepEqual(body.correct, [0, 1]);
    assert.equal(body.marks, 2);
  });

  it('reads true/false and typed answers', () => {
    assert.equal(questionFromForm(form([['type', 'TRUE_FALSE'], ['answer', 'false']])).answer, false);
    assert.equal(questionFromForm(form([['type', 'TRUE_FALSE']])).answer, undefined);
    assert.deepEqual(questionFromForm(form([['type', 'FILL_BLANK'], ['accepted', 'mizu\n みず \n\n']])).accepted, ['mizu', 'みず']);
  });

  it('keeps marks within 1 to 10', () => {
    assert.equal(questionFromForm(form([['type', 'TRUE_FALSE'], ['marks', '99']])).marks, 10);
    assert.equal(questionFromForm(form([['type', 'TRUE_FALSE'], ['marks', 'x']])).marks, 1);
  });
});

describe('answer summary', () => {
  it('describes the correct answer for each type', () => {
    const choices = [
      { id: 'a', text: 'ひ' },
      { id: 'b', text: 'みず' },
    ];
    assert.equal(answerSummary({ type: 'SINGLE_CHOICE', choices, answerKey: ['a'] }), 'Correct: ひ');
    assert.equal(answerSummary({ type: 'TRUE_FALSE', choices: [], answerKey: ['false'] }), 'Answer: False');
    assert.equal(answerSummary({ type: 'FILL_BLANK', choices: [], answerKey: ['ki', 'き'] }), 'Accepts: ki, き');
  });
});
