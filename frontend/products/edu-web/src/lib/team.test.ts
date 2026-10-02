// Unit tests for the team and audit helpers. Run: pnpm --filter @oxinov/edu-web test
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { PERMISSIONS, ROLES, describeAudit } from './team.ts';

describe('team and roles helpers (FR-AUTH-102)', () => {
  it('describes audit events in plain English', () => {
    assert.equal(describeAudit({ action: 'payment.approved', metadata: { amountMinor: 1_500_000 }, reason: null }), 'Approved a payment of NPR 15,000');
    assert.equal(describeAudit({ action: 'notice.sent', metadata: { title: 'Dashain', recipients: 12 }, reason: null }), 'Sent the notice "Dashain" to 12 members');
    assert.equal(
      describeAudit({ action: 'tenant.member.updated', metadata: { from: { role: 'INSTRUCTOR', status: 'ACTIVE' }, to: { role: 'ADMIN', status: 'ACTIVE' } }, reason: null }),
      'Changed a member from Teacher to Administrator',
    );
    assert.equal(
      describeAudit({ action: 'tenant.member.updated', metadata: { from: { role: 'LEARNER', status: 'ACTIVE' }, to: { role: 'LEARNER', status: 'SUSPENDED' } }, reason: null }),
      'Suspended a member',
    );
    assert.equal(describeAudit({ action: 'course.review.rejected', metadata: {}, reason: 'Add a lesson' }), 'Sent a course back: Add a lesson');
    assert.equal(describeAudit({ action: 'store.settings.updated', metadata: {}, reason: null }), 'store settings updated');
    assert.equal(describeAudit({ action: 'access.granted', metadata: { length: 'MONTH_1', reason: 'Scholarship' }, reason: null }), 'Gave free access for 1 month: Scholarship');
  });

  it('lists a permission row for every role', () => {
    for (const row of PERMISSIONS) assert.deepEqual(Object.keys(row.cells).sort(), [...ROLES].sort());
  });
});
