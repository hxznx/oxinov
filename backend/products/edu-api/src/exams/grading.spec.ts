import {
  gradeAttempt,
  isCorrect,
  normalizeText,
  pickQuestions,
  validateResponse,
  type GradableItem,
} from './grading';

const choices = [
  { id: 'a', text: 'を' },
  { id: 'b', text: 'は' },
  { id: 'c', text: 'に' },
];

function item(overrides: Partial<GradableItem>): GradableItem {
  return {
    type: 'SINGLE_CHOICE',
    choices,
    answerKey: ['b'],
    marks: 1,
    sectionKey: 'grammar',
    response: null,
    ...overrides,
  };
}

describe('isCorrect', () => {
  it('grades single choice by exact match', () => {
    expect(isCorrect(item({ response: { choiceIds: ['b'] } }))).toBe(true);
    expect(isCorrect(item({ response: { choiceIds: ['a'] } }))).toBe(false);
  });

  it('treats unanswered items as incorrect', () => {
    expect(isCorrect(item({ response: null }))).toBe(false);
    expect(isCorrect(item({ response: { choiceIds: [] } }))).toBe(false);
  });

  it('requires the exact set for multiple choice', () => {
    const multi = { type: 'MULTIPLE_CHOICE' as const, answerKey: ['a', 'c'] };
    expect(isCorrect(item({ ...multi, response: { choiceIds: ['c', 'a'] } }))).toBe(true);
    expect(isCorrect(item({ ...multi, response: { choiceIds: ['a'] } }))).toBe(false);
    expect(isCorrect(item({ ...multi, response: { choiceIds: ['a', 'b', 'c'] } }))).toBe(false);
  });

  it('normalizes fill-in-the-blank text', () => {
    const fill = { type: 'FILL_BLANK' as const, choices: [], answerKey: ['cat'] };
    expect(isCorrect(item({ ...fill, response: { text: '  CAT ' } }))).toBe(true);
    // Full-width Latin letters typed on a Japanese keyboard normalize to ASCII.
    expect(isCorrect(item({ ...fill, response: { text: 'ｃａｔ' } }))).toBe(true);
    expect(isCorrect(item({ ...fill, response: { text: 'dog' } }))).toBe(false);
    expect(isCorrect(item({ ...fill, response: { text: '' } }))).toBe(false);
  });

  it('does not accept a response of the wrong shape', () => {
    expect(isCorrect(item({ response: { text: 'b' } }))).toBe(false);
  });
});

describe('validateResponse', () => {
  it('accepts a known single choice', () => {
    expect(validateResponse(item({}), { choiceIds: ['a'] })).toBeNull();
  });

  it('rejects unknown, duplicate, or too many choices', () => {
    expect(validateResponse(item({}), { choiceIds: ['z'] })).toMatch(/unknown/);
    expect(validateResponse(item({ type: 'MULTIPLE_CHOICE' }), { choiceIds: ['a', 'a'] })).toMatch(/duplicates/);
    expect(validateResponse(item({}), { choiceIds: ['a', 'b'] })).toMatch(/one choice/);
  });

  it('checks fill-in-the-blank text', () => {
    const fill = item({ type: 'FILL_BLANK', choices: [] });
    expect(validateResponse(fill, { text: 'cat' })).toBeNull();
    expect(validateResponse(fill, { text: 5 })).toMatch(/string/);
    expect(validateResponse(fill, { text: 'x'.repeat(501) })).toMatch(/at most/);
  });

  it('rejects non-objects', () => {
    expect(validateResponse(item({}), null)).toMatch(/object/);
    expect(validateResponse(item({}), 'b')).toMatch(/object/);
  });
});

describe('gradeAttempt', () => {
  const sections = [
    { sectionKey: 'vocabulary', title: 'Vocabulary' },
    { sectionKey: 'grammar', title: 'Grammar' },
  ];

  it('scores sections and applies the pass rule at the boundary', () => {
    const items = [
      item({ sectionKey: 'vocabulary', response: { choiceIds: ['b'] } }),
      item({ sectionKey: 'vocabulary', response: { choiceIds: ['a'] } }),
      item({ sectionKey: 'grammar', marks: 3, response: { choiceIds: ['b'] } }),
      item({ sectionKey: 'grammar', response: null }),
    ];
    const result = gradeAttempt(items, sections, 66);
    expect(result.score).toBe(4);
    expect(result.maxScore).toBe(6);
    expect(result.passed).toBe(true); // 4/6 = 66.7%
    expect(gradeAttempt(items, sections, 67).passed).toBe(false);
    expect(result.sectionBreakdown).toEqual([
      { sectionKey: 'vocabulary', title: 'Vocabulary', score: 1, maxScore: 2 },
      { sectionKey: 'grammar', title: 'Grammar', score: 3, maxScore: 4 },
    ]);
    expect(result.items.map((graded) => graded.marksAwarded)).toEqual([1, 0, 3, 0]);
  });

  it('never passes an empty attempt', () => {
    expect(gradeAttempt([], sections, 0).passed).toBe(false);
  });
});

describe('pickQuestions', () => {
  it('keeps order without shuffle', () => {
    expect(pickQuestions([1, 2, 3, 4], 2, false)).toEqual([1, 2]);
  });

  it('shuffles with the given random source and never repeats', () => {
    const picked = pickQuestions([1, 2, 3, 4, 5], 5, true, () => 0);
    expect(picked).not.toEqual([1, 2, 3, 4, 5]);
    expect([...picked].sort()).toEqual([1, 2, 3, 4, 5]);
  });

  it('throws when the pool is too small', () => {
    expect(() => pickQuestions([1], 2, false)).toThrow(RangeError);
  });
});

describe('normalizeText', () => {
  it('collapses whitespace including full-width spaces', () => {
    expect(normalizeText('ねこ　 です')).toBe('ねこ です');
  });
});
