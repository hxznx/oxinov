import { budgetMinor, oxiAnswer, type OxiOffering } from './oxi-rules';

const offering = (over: Partial<OxiOffering>): OxiOffering => ({
  slug: 'x',
  title: 'Course',
  summary: '',
  kind: 'COURSE',
  category: 'OTHER',
  fromMinor: 500_000,
  free: false,
  freeLessonCount: 0,
  ...over,
});

const STORE: OxiOffering[] = [
  offering({ slug: 'jlpt-n5', title: 'Japanese JLPT N5 Foundations', summary: 'Hiragana, katakana, and first kanji', category: 'LANGUAGES', freeLessonCount: 2 }),
  offering({ slug: 'open-class', title: 'Open class: start Japanese', summary: 'Live and free', kind: 'CLASS', category: 'LANGUAGES', free: true, fromMinor: 0 }),
  offering({ slug: 'python', title: 'Python for beginners', summary: 'Programming from zero', category: 'TECHNOLOGY', fromMinor: 1_000_000 }),
  offering({ slug: 'ideas', title: 'Startup idea pack', summary: 'Business research', category: 'IDEAS_RESEARCH', fromMinor: 2_000_000 }),
];
const PLANS = [
  { label: '1 month', priceMinor: 500_000 },
  { label: '1 year', priceMinor: 1_500_000 },
];

describe('OXI rule-based advisor (FR-AI-1705)', () => {
  it('recommends only store offerings that fit a Japan goal, each with a reason', () => {
    const answer = oxiAnswer('I want to work in Japan in one year. Where do I start?', STORE, PLANS);
    expect(answer.handoff).toBe(false);
    expect(answer.picks.map((item) => item.slug).sort()).toEqual(['jlpt-n5', 'open-class']);
    expect(answer.picks.every((item) => STORE.some((store) => store.slug === item.slug))).toBe(true);
    expect(answer.picks.every((item) => item.why.length > 0)).toBe(true);
    expect(answer.reply).toMatch(/languages/);
  });

  it('matches programming and prefers free items when asked', () => {
    expect(oxiAnswer('Learn programming', STORE, PLANS).picks[0]?.slug).toBe('python');
    expect(oxiAnswer('Free courses for me', STORE, PLANS).picks[0]?.slug).toBe('open-class');
  });

  it('respects a budget', () => {
    expect(budgetMinor('something under 6,000 rupees')).toBe(600_000);
    expect(budgetMinor('anything')).toBeNull();
    const answer = oxiAnswer('japanese course under 6000', STORE, PLANS);
    expect(answer.picks.every((item) => item.slug !== 'python' && item.slug !== 'ideas')).toBe(true);
  });

  it('explains plans and hands people questions to a human', () => {
    expect(oxiAnswer('Compare plans', STORE, PLANS).reply).toMatch(/1 month: NPR 5,000 · 1 year: NPR 15,000/);
    const human = oxiAnswer('Talk to a human', STORE, PLANS);
    expect(human).toMatchObject({ handoff: true, picks: [] });
    expect(oxiAnswer('My bank payment is missing', STORE, PLANS).handoff).toBe(true);
  });

  it('falls back to free items when nothing matches, and never invents offerings', () => {
    const answer = oxiAnswer('underwater basket weaving', STORE, PLANS);
    expect(answer.picks.map((item) => item.slug)).toEqual(['jlpt-n5', 'open-class']);
    expect(oxiAnswer('underwater basket weaving', [], PLANS)).toMatchObject({ picks: [] });
    expect(oxiAnswer('   ', STORE, PLANS).reply).toMatch(/Tell me what you want/);
  });
});
