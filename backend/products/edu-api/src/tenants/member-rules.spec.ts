import { memberChangeProblem, type MemberChange } from './member-rules';

const change = (overrides: Partial<MemberChange>): MemberChange => ({
  actorUserId: 'owner',
  actorRole: 'OWNER',
  target: { userId: 'learner', role: 'LEARNER', status: 'ACTIVE' },
  activeOwners: 1,
  ...overrides,
});

describe('team and roles (FR-AUTH-102)', () => {
  it('lets administrators manage learners and teachers, and owners manage everyone', () => {
    expect(memberChangeProblem(change({ actorUserId: 'admin', actorRole: 'ADMIN', role: 'INSTRUCTOR' }))).toBeNull();
    expect(memberChangeProblem(change({ actorUserId: 'admin', actorRole: 'ADMIN', status: 'SUSPENDED' }))).toBeNull();
    expect(memberChangeProblem(change({ role: 'ADMIN' }))).toBeNull();
    expect(memberChangeProblem(change({ target: { userId: 'other', role: 'OWNER', status: 'ACTIVE' }, role: 'ADMIN', activeOwners: 2 }))).toBeNull();
  });

  it('refuses learners and teachers, self-changes, and administrators touching leaders', () => {
    expect(memberChangeProblem(change({ actorUserId: 'teacher', actorRole: 'INSTRUCTOR', role: 'INSTRUCTOR' }))).toMatch(/Only administrators/);
    expect(memberChangeProblem(change({ target: { userId: 'owner', role: 'OWNER', status: 'ACTIVE' }, role: 'ADMIN', activeOwners: 2 }))).toMatch(/your own/);
    expect(memberChangeProblem(change({ actorUserId: 'admin', actorRole: 'ADMIN', role: 'ADMIN' }))).toMatch(/Only the owner/);
    expect(memberChangeProblem(change({ actorUserId: 'admin', actorRole: 'ADMIN', target: { userId: 'a2', role: 'ADMIN', status: 'ACTIVE' }, status: 'SUSPENDED' }))).toMatch(
      /Only the owner/,
    );
  });

  it('never removes the last active owner', () => {
    const other = { userId: 'other', role: 'OWNER' as const, status: 'ACTIVE' as const };
    expect(memberChangeProblem(change({ target: other, role: 'ADMIN', activeOwners: 1 }))).toMatch(/at least one active owner/);
    expect(memberChangeProblem(change({ target: other, status: 'SUSPENDED', activeOwners: 1 }))).toMatch(/at least one active owner/);
    expect(memberChangeProblem(change({ target: other, status: 'SUSPENDED', activeOwners: 2 }))).toBeNull();
  });
});
