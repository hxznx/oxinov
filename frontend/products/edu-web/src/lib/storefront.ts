/**
 * Store home and offering page helpers (ADR-028; design screens 1, 2, 6 and 13). Pure functions so the
 * grouping, labels, and syllabus states are unit-tested without the API.
 */
import type { OfferingCategory, OfferingKind, StoreOffering } from './edu-api.ts';

export const KIND_LABELS: Record<OfferingKind, string> = {
  COURSE: 'Course',
  TRAINING: 'Training',
  IDEA: 'Idea',
  THINK_TANK: 'Think tank',
  SKILL: 'Skill',
};

export const CATEGORY_LABELS: Record<OfferingCategory, string> = {
  LANGUAGES: 'Languages',
  TECHNOLOGY: 'Technology',
  IDEAS_RESEARCH: 'Ideas and research',
  OTHER: 'More from Oxinov',
};

/** HUD code shown beside each rail title, as in the design (`LANG.07`, `THINK.TANK`). */
export const CATEGORY_CODES: Record<OfferingCategory, string> = {
  LANGUAGES: 'LANG',
  TECHNOLOGY: 'TECH',
  IDEAS_RESEARCH: 'THINK.TANK',
  OTHER: 'MORE',
};

/** Design-system color variable per category; ideas and research use magenta like the design. */
export const CATEGORY_TONES: Record<OfferingCategory, string> = {
  LANGUAGES: '--ox-color-brand',
  TECHNOLOGY: '--ox-color-brand-mid',
  IDEAS_RESEARCH: '--ox-color-brand-2',
  OTHER: '--ox-color-highlight',
};

export const KINDS: readonly OfferingKind[] = ['COURSE', 'TRAINING', 'IDEA', 'THINK_TANK', 'SKILL'];
export const CATEGORIES: readonly OfferingCategory[] = ['LANGUAGES', 'TECHNOLOGY', 'IDEAS_RESEARCH', 'OTHER'];

/** Ideas and think-tank research carry a content license (design screen 13). */
export function isIntellectualProperty(kind: OfferingKind): boolean {
  return kind === 'IDEA' || kind === 'THINK_TANK';
}

export function parseKind(value: string | undefined): OfferingKind | undefined {
  return KINDS.find((kind) => kind === value);
}

/** Two- or three-character mark for a card, from the title's first words ("Programming from Zero" → "PZ"). */
export function cardGlyph(title: string): string {
  const words = title
    .split(/[\s\-–—:·,]+/)
    .filter((word) => word.length > 0 && !['a', 'an', 'and', 'the', 'of', 'for', 'to', 'from', 'with', 'in'].includes(word.toLowerCase()));
  const first = words[0] ?? title;
  // Scripts without capitals (Japanese, Devanagari) read better as their first character.
  if (!/[A-Za-z0-9]/.test(first[0] ?? '')) return [...first][0] ?? '◆';
  return words
    .slice(0, 2)
    .map((word) => [...word][0]!.toUpperCase())
    .join('');
}

export interface Rail {
  key: string;
  title: string;
  code: string;
  tone: string;
  items: StoreOffering[];
}

/**
 * Store home rails: free offerings first, then each category in a fixed order. Empty rails are left out,
 * an offering appears once, and a search or kind filter applies to every rail.
 */
export function storeRails(offerings: StoreOffering[], filter: { kind?: OfferingKind; q?: string } = {}): Rail[] {
  const q = filter.q?.trim().toLowerCase();
  const shown = offerings.filter(
    (offering) =>
      (!filter.kind || offering.kind === filter.kind) && (!q || offering.title.toLowerCase().includes(q) || offering.summary.toLowerCase().includes(q)),
  );
  const rails: Rail[] = [
    { key: 'free', title: 'Free to learn', code: 'FREE.ACCESS', tone: '--ox-color-success', items: shown.filter((offering) => offering.free) },
    ...CATEGORIES.map((category) => ({
      key: category,
      title: CATEGORY_LABELS[category],
      code: CATEGORY_CODES[category],
      tone: CATEGORY_TONES[category],
      items: shown.filter((offering) => !offering.free && offering.category === category),
    })),
  ];
  return rails.filter((rail) => rail.items.length > 0).map((rail) => ({ ...rail, code: rail.key === 'free' || rail.key === 'IDEAS_RESEARCH' ? rail.code : `${rail.code}.${String(rail.items.length).padStart(2, '0')}` }));
}

/** The small tag on a card: what a visitor gets before paying. */
export function cardTag(offering: Pick<StoreOffering, 'free' | 'freeLessonCount'>): string {
  if (offering.free) return 'No plan needed';
  if (offering.freeLessonCount > 0) return 'Free preview';
  return 'Syllabus open';
}

export type ShareFormat = 'fb' | 'square' | 'story';
/** Pixel sizes of the share images (design screen 19): Facebook link post, Instagram square, story or status. */
export const SHARE_SIZES: Record<ShareFormat, { width: number; height: number; label: string }> = {
  fb: { width: 1200, height: 630, label: 'Facebook post' },
  square: { width: 1080, height: 1080, label: 'Instagram square' },
  story: { width: 1080, height: 1920, label: 'Story, Reel, or WhatsApp status' },
};

export function parseShareFormat(value: string | null | undefined): ShareFormat {
  return value === 'square' || value === 'story' ? value : 'fb';
}

/**
 * A ready caption for a share post (design screen 19), from the offering's own words and price. It never
 * promises jobs, visas, or results; the author edits it before posting.
 */
export function shareCaption(offering: Pick<StoreOffering, 'title' | 'summary' | 'free' | 'hasPlans' | 'fromMinor' | 'freeLessonCount' | 'category'>, coupon?: string): string {
  const price = offering.free ? 'Free to learn.' : offering.hasPlans ? `Plans from NPR ${(offering.fromMinor / 100).toLocaleString('en-US')}.` : '';
  const preview = offering.free ? 'Start now:' : offering.freeLessonCount > 0 ? 'Watch the free lesson today:' : 'Read the syllabus:';
  const tags = ['#Oxinov', '#Nepal', offering.category === 'LANGUAGES' ? '#LearnLanguages' : offering.category === 'TECHNOLOGY' ? '#Tech' : '#Learning'];
  return [
    `${offering.title} on Oxinov.`,
    offering.summary,
    [price, coupon ? `Use code ${coupon} at checkout.` : ''].filter(Boolean).join(' '),
    preview,
    tags.join(' '),
  ]
    .filter((line) => line.trim().length > 0)
    .join('\n');
}

/** The offering link with the channel named, so later analytics can tell which post brought a visit. */
export function trackedLink(origin: string, slug: string, channel: string): string {
  return `${origin.replace(/\/$/, '')}/o/${encodeURIComponent(slug)}?utm_source=${encodeURIComponent(channel)}&utm_medium=social&utm_campaign=share-kit`;
}
