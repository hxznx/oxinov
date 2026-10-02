import { accessEnds, reminderKey, reminderStage } from './renewal-rules';

const at = (iso: string) => new Date(iso);
const now = at('2026-10-02T06:00:00Z');

describe('renewal reminders (FR-COMM-704)', () => {
  it('chooses the 7-day, 1-day, and ended reminders by time left', () => {
    expect(reminderStage(at('2026-10-20T06:00:00Z'), now)).toBeNull();
    expect(reminderStage(at('2026-10-09T06:00:00Z'), now)).toBe('DAYS_7');
    expect(reminderStage(at('2026-10-03T06:00:01Z'), now)).toBe('DAYS_7');
    expect(reminderStage(at('2026-10-03T06:00:00Z'), now)).toBe('DAYS_1');
    expect(reminderStage(at('2026-10-02T06:30:00Z'), now)).toBe('DAYS_1');
    expect(reminderStage(at('2026-10-02T06:00:00Z'), now)).toBe('ENDED');
    expect(reminderStage(at('2026-09-29T06:00:00Z'), now)).toBe('ENDED');
    // Old endings are not reported after a long outage.
    expect(reminderStage(at('2026-09-28T06:00:00Z'), now)).toBeNull();
  });

  it('keys each reminder by stage, course, and end date', () => {
    expect(reminderKey('DAYS_7', 'c1', at('2026-10-09T06:00:00Z'))).toBe('renewal:DAYS_7:c1:2026-10-09T06:00:00.000Z');
  });

  it('takes the latest end per learner and course, and skips lifetime or free access', () => {
    const ends = accessEnds([
      { userId: 'u1', courseId: 'c1', endsAt: at('2026-10-05T00:00:00Z') },
      { userId: 'u1', courseId: 'c1', endsAt: at('2027-10-05T00:00:00Z') },
      { userId: 'u1', courseId: 'c2', endsAt: at('2026-10-05T00:00:00Z') },
      { userId: 'u1', courseId: 'c2', endsAt: null },
      { userId: 'u2', courseId: 'c1', endsAt: null },
      { userId: 'u2', courseId: 'c1', endsAt: at('2026-10-05T00:00:00Z') },
      { userId: 'u3', courseId: 'c1', endsAt: at('2026-10-04T00:00:00Z') },
    ]);
    expect(ends).toEqual([
      { userId: 'u1', courseId: 'c1', endsAt: at('2027-10-05T00:00:00Z') },
      { userId: 'u3', courseId: 'c1', endsAt: at('2026-10-04T00:00:00Z') },
    ]);
  });
});
