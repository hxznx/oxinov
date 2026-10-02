import { allowanceDay, grantable, renewalFromKey, waitingCutoff } from './allowance-rules';
import { reminderKey } from './renewal-rules';

describe('email allowance rules (FR-COMM-705)', () => {
  it('counts days in UTC, as the email provider does', () => {
    expect(allowanceDay(new Date('2026-10-03T23:59:59Z'))).toBe('2026-10-03');
    expect(allowanceDay(new Date('2026-10-04T00:00:00Z'))).toBe('2026-10-04');
  });

  it('grants only what is left of today’s share', () => {
    expect(grantable(400, 150, 0)).toBe(150);
    expect(grantable(10, 150, 145)).toBe(5);
    expect(grantable(3, 150, 150)).toBe(0);
    expect(grantable(3, 150, 170)).toBe(0);
    expect(grantable(0, 150, 0)).toBe(0);
  });

  it('drops emails that waited more than two days', () => {
    expect(waitingCutoff(new Date('2026-10-05T10:00:00Z')).toISOString()).toBe('2026-10-03T10:00:00.000Z');
  });

  it('reads a renewal reminder back from its key', () => {
    const endsAt = new Date('2026-10-12T06:15:00.000Z');
    const courseId = 'aaaaaaaa-0000-4000-8000-000000000202';
    expect(renewalFromKey(reminderKey('DAYS_7', courseId, endsAt))).toEqual({ daysLeft: 7, endsAt });
    expect(renewalFromKey(reminderKey('DAYS_1', courseId, endsAt))).toEqual({ daysLeft: 1, endsAt });
    expect(renewalFromKey(reminderKey('ENDED', courseId, endsAt))).toBeNull();
    expect(renewalFromKey(null)).toBeNull();
    expect(renewalFromKey('renewal:DAYS_7:not-a-uuid:2026-10-12')).toBeNull();
  });
});
