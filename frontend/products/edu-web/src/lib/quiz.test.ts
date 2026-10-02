// Unit tests for quiz builder helpers. Run: pnpm --filter @oxinov/edu-web test
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { answerSummary, questionFromForm, quizSelection, shortPrompt } from './quiz.ts';

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

describe('quiz editor selection (design screen 10)', () => {
  const question = (id: string) => ({ id, type: 'SINGLE_CHOICE' as const, prompt: id, passage: null, choices: [], answerKey: [], explanation: null, marks: 1, version: 1 });
  const section = (id: string) => ({ id, sectionKey: id, title: id, position: 1, questionCount: 1, available: 1 });
  const quiz = { sections: [section('s1'), section('s2')], questions: { s1: [question('a'), question('b')], s2: [question('c')] } };

  it('numbers questions across sections and finds the one in the address', () => {
    assert.deepEqual(quizSelection(quiz, { q: 'c' }), { mode: 'edit', sectionId: 's2', question: question('c'), number: 3 });
    assert.deepEqual(quizSelection(quiz, { q: 'b' }), { mode: 'edit', sectionId: 's1', question: question('b'), number: 2 });
  });

  it('opens the add form for a known section and falls back to the first question otherwise', () => {
    assert.deepEqual(quizSelection(quiz, { add: 's2' }), { mode: 'add', sectionId: 's2' });
    assert.equal(quizSelection(quiz, { add: 'other', q: 'missing' }).mode, 'edit');
    assert.deepEqual(quizSelection({ sections: [section('s1')], questions: {} }, {}), { mode: 'add', sectionId: 's1' });
    assert.deepEqual(quizSelection({ sections: [], questions: {} }, { q: 'a' }), { mode: 'none' });
  });

  it('shortens prompts to one line', () => {
    assert.equal(shortPrompt('Which   character\nis "ki"?'), 'Which character is "ki"?');
    assert.equal(shortPrompt('x'.repeat(80), 10), `${'x'.repeat(9)}…`);
  });
});
