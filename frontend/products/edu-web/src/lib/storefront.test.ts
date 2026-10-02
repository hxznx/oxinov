// Unit tests for the store page helpers. Run: pnpm --filter @oxinov/edu-web test
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { StoreOffering } from './edu-api.ts';
import { cardGlyph, cardTag, isIntellectualProperty, parseKind, storeRails } from './storefront.ts';

const offering = (overrides: Partial<StoreOffering>): StoreOffering => ({
  id: overrides.slug ?? 'x',
  slug: 'x',
  title: 'Japanese JLPT N5',
  summary: 'Hiragana and first kanji',
  kind: 'COURSE',
  category: 'LANGUAGES',
  language: 'en',
  fromMinor: 500_000,
  currency: 'NPR',
  hasPlans: true,
  free: false,
  lessonCount: 10,
  freeLessonCount: 2,
  ...overrides,
});

describe('store helpers (ADR-028)', () => {
  it('groups offerings into rails: free first, then categories in order, without empty rails', () => {
    const rails = storeRails([
      offering({ slug: 'ml', title: 'Machine Learning', category: 'TECHNOLOGY' }),
      offering({ slug: 'ja', title: 'Japanese N5' }),
      offering({ slug: 'iot', title: 'Intro to IoT', category: 'TECHNOLOGY', free: true, hasPlans: false, fromMinor: 0 }),
      offering({ slug: 'idea', title: 'Tea export plan', kind: 'IDEA', category: 'IDEAS_RESEARCH' }),
    ]);
    assert.deepEqual(
      rails.map((rail) => [rail.key, rail.items.map((item) => item.slug)]),
      [
        ['free', ['iot']],
        ['LANGUAGES', ['ja']],
        ['TECHNOLOGY', ['ml']],
        ['IDEAS_RESEARCH', ['idea']],
      ],
    );
    assert.equal(rails[1]?.code, 'LANG.01');
    assert.equal(rails[3]?.code, 'THINK.TANK');
  });

  it('filters every rail by kind and by search text', () => {
    const list = [offering({ slug: 'ja' }), offering({ slug: 'idea', kind: 'IDEA', category: 'IDEAS_RESEARCH', title: 'Tea export plan', summary: 'Market notes' })];
    assert.deepEqual(
      storeRails(list, { kind: 'IDEA' }).flatMap((rail) => rail.items.map((item) => item.slug)),
      ['idea'],
    );
    assert.deepEqual(
      storeRails(list, { q: 'KANJI' }).flatMap((rail) => rail.items.map((item) => item.slug)),
      ['ja'],
    );
    assert.deepEqual(storeRails(list, { q: 'nothing like this' }), []);
  });

  it('makes a short card mark from the title', () => {
    assert.equal(cardGlyph('Programming from Zero'), 'PZ');
    assert.equal(cardGlyph('IoT and Robotics Lab'), 'IR');
    assert.equal(cardGlyph('ひらがな入門'), 'ひ');
    assert.equal(cardGlyph('Machine'), 'M');
  });

  it('labels what a visitor gets before paying', () => {
    assert.equal(cardTag({ free: true, freeLessonCount: 0 }), 'No plan needed');
    assert.equal(cardTag({ free: false, freeLessonCount: 3 }), 'Free preview');
    assert.equal(cardTag({ free: false, freeLessonCount: 0 }), 'Syllabus open');
  });

  it('knows which kinds carry a content license and reads kinds from the address', () => {
    assert.equal(isIntellectualProperty('THINK_TANK'), true);
    assert.equal(isIntellectualProperty('SKILL'), false);
    assert.equal(parseKind('IDEA'), 'IDEA');
    assert.equal(parseKind('idea'), undefined);
    assert.equal(parseKind(undefined), undefined);
  });
});
