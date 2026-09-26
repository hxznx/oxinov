import { buildAnswer, newSectionKey } from './question-rules';

describe('question builder rules', () => {
  it('stores single and multiple choice with stable choice IDs', () => {
    expect(buildAnswer({ type: 'SINGLE_CHOICE', choices: ['みず', ' ひ ', 'き'], correct: [0] })).toEqual({
      choices: [
        { id: 'a', text: 'みず' },
        { id: 'b', text: 'ひ' },
        { id: 'c', text: 'き' },
      ],
      answerKey: ['a'],
    });
    expect(buildAnswer({ type: 'MULTIPLE_CHOICE', choices: ['cd', 'ls', 'rm'], correct: [2, 0] })).toMatchObject({ answerKey: ['a', 'c'] });
  });

  it('stores true/false and fill-in-the-blank answers', () => {
    expect(buildAnswer({ type: 'TRUE_FALSE', answer: false })).toEqual({
      choices: [
        { id: 'true', text: 'True' },
        { id: 'false', text: 'False' },
      ],
      answerKey: ['false'],
    });
    expect(buildAnswer({ type: 'FILL_BLANK', accepted: [' mizu ', 'みず', 'mizu', ''] })).toEqual({ choices: [], answerKey: ['mizu', 'みず'] });
  });

  it('explains what the teacher must fix', () => {
    expect(buildAnswer({ type: 'SINGLE_CHOICE', choices: ['a', 'b'], correct: [0, 1] })).toBe('Mark exactly one correct choice.');
    expect(buildAnswer({ type: 'SINGLE_CHOICE', choices: ['only one'], correct: [0] })).toMatch(/between 2 and 8/);
    expect(buildAnswer({ type: 'MULTIPLE_CHOICE', choices: ['a', 'b'], correct: [] })).toBe('Mark at least one correct choice.');
    expect(buildAnswer({ type: 'SINGLE_CHOICE', choices: ['a', 'a'], correct: [0] })).toBe('Two choices have the same text.');
    expect(buildAnswer({ type: 'SINGLE_CHOICE', choices: ['a', ''], correct: [0] })).toBe('Every choice needs text.');
    expect(buildAnswer({ type: 'SINGLE_CHOICE', choices: ['a', 'b'], correct: [5] })).toBe('Mark correct answers among the choices.');
    expect(buildAnswer({ type: 'TRUE_FALSE' })).toMatch(/true or false/);
    expect(buildAnswer({ type: 'FILL_BLANK', accepted: ['  '] })).toBe('Add at least one accepted answer.');
  });

  it('creates distinct section keys', () => {
    expect(newSectionKey(() => 0)).toBe('s00000000');
    expect(newSectionKey()).toMatch(/^s[0-9a-z]{8}$/);
    expect(new Set(Array.from({ length: 50 }, () => newSectionKey())).size).toBe(50);
  });
});
