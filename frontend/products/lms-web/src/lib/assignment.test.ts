// Unit tests for assignment helpers. Run: pnpm --filter @oxinov/lms-web test
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { dueLabel, formatBytes, submissionContentType } from './assignment.ts';

describe('due dates', () => {
  const now = new Date('2026-09-25T00:00:00Z');
  it('shows the deadline in the workspace time zone', () => {
    assert.equal(dueLabel(null, 'Asia/Kathmandu', now), 'No deadline');
    assert.equal(dueLabel('2026-10-01T11:15:00Z', 'Asia/Kathmandu', now), 'Due 1 Oct 2026, 17:00');
    assert.equal(dueLabel('2026-09-20T00:00:00Z', 'UTC', now), 'Was due 20 Sept 2026, 00:00');
    assert.equal(dueLabel('2026-10-01T00:00:00Z', 'Not/AZone', now), 'Due 1 Oct 2026, 00:00');
  });
});

describe('files', () => {
  it('formats sizes and maps file names to accepted types', () => {
    assert.equal(formatBytes(900), '900 B');
    assert.equal(formatBytes(2048), '2 KB');
    assert.equal(formatBytes(3 * 1024 * 1024), '3.0 MB');
    assert.equal(submissionContentType({ name: 'Essay.PDF', type: '' }), 'application/pdf');
    assert.equal(submissionContentType({ name: 'report.docx', type: 'application/octet-stream' }), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    assert.equal(submissionContentType({ name: 'photo.jpeg', type: 'image/jpeg' }), 'image/jpeg');
    assert.equal(submissionContentType({ name: 'page.html', type: 'text/html' }), null);
  });
});
