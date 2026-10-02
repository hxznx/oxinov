import { DELETION_WAIT_DAYS, deletionDate, deletionProblem, deletionState } from './deletion-rules';

describe('account deletion rules (FR-PRIV-3202)', () => {
  it('waits 14 days, as the owner chose', () => {
    expect(DELETION_WAIT_DAYS).toBe(14);
    expect(deletionDate(new Date('2026-10-03T10:00:00Z')).toISOString()).toBe('2026-10-17T10:00:00.000Z');
  });

  it('needs the confirmation word and refuses workspace owners', () => {
    expect(deletionProblem({ confirm: ' DELETE ', ownsWorkspaces: [] })).toBeNull();
    expect(deletionProblem({ confirm: 'delete', ownsWorkspaces: [] })).toBe('Type DELETE to confirm.');
    expect(deletionProblem({ confirm: 'DELETE', ownsWorkspaces: ['OxinovJP'] })).toMatch(/You own OxinovJP\. Make another member the owner/);
  });

  it('reports the state of a request', () => {
    const at = new Date('2026-10-17T10:00:00Z');
    expect(deletionState(null)).toBe('NONE');
    expect(deletionState({ deleteAfter: at, cancelledAt: null, completedAt: null })).toBe('SCHEDULED');
    expect(deletionState({ deleteAfter: at, cancelledAt: new Date(), completedAt: null })).toBe('CANCELLED');
    expect(deletionState({ deleteAfter: at, cancelledAt: null, completedAt: new Date() })).toBe('NONE');
  });
});
