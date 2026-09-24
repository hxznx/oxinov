// Unit tests for teacher-tool helpers. Run: pnpm --filter @oxinov/lms-web test
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { courseState, majorUnits } from './teach.ts';

describe('course state labels', () => {
  it('describes drafts, review, and published courses', () => {
    assert.equal(courseState({ courseStatus: 'DRAFT', draftStatus: 'DRAFT' }), 'Draft');
    assert.equal(courseState({ courseStatus: 'PUBLISHED', draftStatus: 'DRAFT' }), 'Published · changes in draft');
    assert.equal(courseState({ courseStatus: 'DRAFT', draftStatus: 'IN_REVIEW' }), 'Waiting for review');
    assert.equal(courseState({ courseStatus: 'PUBLISHED', draftStatus: null }), 'Published');
    assert.equal(courseState({ courseStatus: 'ARCHIVED', draftStatus: null }), 'Archived');
  });
});

describe('prices for editing', () => {
  it('converts minor units back to what teachers type', () => {
    assert.equal(majorUnits(250000, 'NPR'), 2500);
    assert.equal(majorUnits(4900, 'JPY'), 4900);
  });
});
