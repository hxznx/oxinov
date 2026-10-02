/**
 * OXI, the rule-based course advisor (FR-AI-1705). Until the AI gateway exists, OXI matches the learner's
 * goal, language, level, and budget words to the store's published offerings, with no model call and no
 * stored conversation. It recommends only offerings it is given, explains each pick in one line, and hands
 * anything it cannot answer to a human. Pure functions, unit-tested.
 */

export interface OxiOffering {
  slug: string;
  title: string;
  summary: string;
  kind: string;
  category: string;
  fromMinor: number;
  free: boolean;
  freeLessonCount: number;
}

export interface OxiPlan {
  label: string;
  priceMinor: number;
}

export interface OxiPick {
  slug: string;
  title: string;
  kind: string;
  category: string;
  why: string;
}

export interface OxiAnswer {
  reply: string;
  picks: OxiPick[];
  /** The learner asked for a person: the web app offers to pass the question to support. */
  handoff: boolean;
}

/** Words that point at a store category, matched as whole words or prefixes ("program" → programming). */
const TOPICS: { category: string; words: string[]; label: string }[] = [
  { category: 'LANGUAGES', label: 'languages', words: ['japan', 'japanese', 'jlpt', 'nihongo', 'n5', 'n4', 'n3', 'kanji', 'hiragana', 'katakana', 'ssw', 'korea', 'korean', 'eps', 'english', 'ielts', 'language', 'speak'] },
  { category: 'TECHNOLOGY', label: 'technology', words: ['program', 'coding', 'code', 'developer', 'python', 'javascript', 'web', 'software', 'computer', 'network', 'cloud', 'data', 'ai', 'it', 'tech'] },
  { category: 'IDEAS_RESEARCH', label: 'ideas and research', words: ['idea', 'research', 'business', 'startup', 'paper', 'report', 'thesis'] },
];
const HUMAN = ['human', 'person', 'agent', 'support', 'staff', 'someone', 'talk', 'call', 'refund', 'complain', 'problem', 'payment', 'paid', 'bank'];
const FREE = ['free', 'cheap', 'budget', 'no money', 'without paying'];
const PLANS = ['plan', 'plans', 'price', 'prices', 'cost', 'how much', 'fee', 'fees', 'compare'];
const STOP = new Set(['the', 'and', 'for', 'want', 'learn', 'with', 'what', 'where', 'how', 'can', 'start', 'should', 'need', 'about', 'from', 'into', 'year', 'month', 'courses', 'course', 'class', 'classes', 'me', 'my', 'to', 'in', 'a', 'an', 'of', 'i', 'do', 'is', 'it']);

const npr = (minor: number) => `NPR ${(minor / 100).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

function words(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFKC')
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean);
}

const has = (tokens: string[], text: string, list: string[]) => list.some((word) => (word.includes(' ') ? text.includes(word) : tokens.some((token) => token === word || (word.length >= 4 && token.startsWith(word)))));

/** Budget in rupees from text like "under 5000" or "below NPR 3,000"; null when none is given. */
export function budgetMinor(text: string): number | null {
  const match = /(?:under|below|less than|max(?:imum)?|up to|within|budget(?: of| is)?)\s*(?:npr|rs\.?|rupees)?\s*([\d][\d,]*)/i.exec(text);
  if (!match?.[1]) return null;
  const value = Number(match[1].replace(/,/g, ''));
  return Number.isFinite(value) && value > 0 ? value * 100 : null;
}

/** OXI's answer to one question about what to learn. */
export function oxiAnswer(question: string, offerings: readonly OxiOffering[], plans: readonly OxiPlan[]): OxiAnswer {
  const text = question.toLowerCase();
  const tokens = words(question);
  if (tokens.length === 0) {
    return { reply: 'Tell me what you want to achieve, for example "work in Japan" or "learn programming", and I will suggest offerings from the store.', picks: [], handoff: false };
  }
  if (has(tokens, text, HUMAN)) {
    return {
      reply: 'That is one for a person. Choose "Talk to a human" and I will pass your question to Oxinov support; they usually reply within a day.',
      picks: [],
      handoff: true,
    };
  }
  if (has(tokens, text, PLANS) && !TOPICS.some((topic) => has(tokens, text, topic.words))) {
    const lines = plans.map((plan) => `${plan.label}: ${npr(plan.priceMinor)}`);
    return {
      reply: lines.length
        ? `Most offerings have these plans: ${lines.join(' · ')}. Longer plans cost less per month, and renewing adds time to the end of your current plan. Each offering page shows its exact prices.`
        : 'Each offering page shows its plans and prices. Tell me what you want to learn and I will point you to the right one.',
      picks: [],
      handoff: false,
    };
  }

  const wantsFree = has(tokens, text, FREE);
  const budget = budgetMinor(question);
  const topics = TOPICS.filter((topic) => has(tokens, text, topic.words));
  const keywords = tokens.filter((token) => token.length >= 3 && !STOP.has(token));

  const scored = offerings
    .map((offering) => {
      const haystack = words(`${offering.title} ${offering.summary}`);
      const matched = keywords.filter((word) => haystack.some((token) => token === word || (word.length >= 4 && token.startsWith(word))));
      let score = matched.length * 3;
      if (topics.some((topic) => topic.category === offering.category)) score += 4;
      if (wantsFree) score += offering.free ? 4 : offering.freeLessonCount > 0 ? 2 : -3;
      if (budget !== null) score += offering.free || offering.fromMinor <= budget ? 2 : -5;
      return { offering, score, matched };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || Number(b.offering.free) - Number(a.offering.free) || a.offering.title.localeCompare(b.offering.title))
    .slice(0, 3);

  if (scored.length === 0) {
    const fallback = offerings
      .filter((offering) => offering.free || offering.freeLessonCount > 0)
      .slice(0, 3)
      .map((offering) => pick(offering, [], wantsFree, budget));
    return {
      reply: fallback.length
        ? 'I could not find a close match in the store yet. These have free lessons you can try today, or choose "Talk to a human" and support will help.'
        : 'I could not find a match in the store yet. Choose "Talk to a human" and Oxinov support will help you.',
      picks: fallback,
      handoff: false,
    };
  }
  const topicText = topics.length ? ` for ${topics.map((topic) => topic.label).join(' and ')}` : '';
  return {
    reply: `Here ${scored.length === 1 ? 'is a pick' : `are ${scored.length} picks`}${topicText} from the Oxinov store.${scored.some((item) => item.offering.free || item.offering.freeLessonCount > 0) ? ' Start with the free lessons to see if it suits you.' : ''}`,
    picks: scored.map((item) => pick(item.offering, item.matched, wantsFree, budget)),
    handoff: false,
  };
}

function pick(offering: OxiOffering, matched: string[], wantsFree: boolean, budget: number | null): OxiPick {
  const reasons: string[] = [];
  if (matched.length) reasons.push(`Matches "${matched.slice(0, 2).join('", "')}"`);
  if (offering.free) reasons.push('free to join');
  else if (offering.freeLessonCount > 0) reasons.push(`${offering.freeLessonCount} free ${offering.freeLessonCount === 1 ? 'lesson' : 'lessons'} to try`);
  if (!offering.free && (budget !== null || !wantsFree)) reasons.push(`from ${npr(offering.fromMinor)}`);
  const why = reasons.join('; ') || 'Popular in the store';
  return { slug: offering.slug, title: offering.title, kind: offering.kind, category: offering.category, why: why.charAt(0).toUpperCase() + why.slice(1) };
}
