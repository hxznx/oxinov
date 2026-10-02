/**
 * Team and roles helpers (FR-AUTH-102; design screen 22): role names, what each role can do, and the audit
 * log in plain English. Pure functions, unit-tested without the API.
 */
import type { AuditEvent, TenantRole } from './edu-api.ts';

export const ROLE_NAMES: Record<TenantRole, string> = { LEARNER: 'Learner', INSTRUCTOR: 'Teacher', ADMIN: 'Administrator', OWNER: 'Owner' };
export const ROLES: readonly TenantRole[] = ['LEARNER', 'INSTRUCTOR', 'ADMIN', 'OWNER'];

/** What each role can do today, as the Edu API enforces it (● yes, ◐ own items only, · no). */
export const PERMISSIONS: { label: string; cells: Record<TenantRole, '●' | '◐' | '·'> }[] = [
  { label: 'Learn: open courses they have access to', cells: { LEARNER: '●', INSTRUCTOR: '●', ADMIN: '●', OWNER: '●' } },
  { label: 'Write courses, lessons, quizzes, live classes', cells: { LEARNER: '·', INSTRUCTOR: '◐', ADMIN: '●', OWNER: '●' } },
  { label: 'Publish courses (approve review)', cells: { LEARNER: '·', INSTRUCTOR: '·', ADMIN: '●', OWNER: '●' } },
  { label: 'Approve or reject payments', cells: { LEARNER: '·', INSTRUCTOR: '·', ADMIN: '●', OWNER: '●' } },
  { label: 'Send notices, share kit, join codes', cells: { LEARNER: '·', INSTRUCTOR: '·', ADMIN: '●', OWNER: '●' } },
  { label: 'Manage learners and teachers', cells: { LEARNER: '·', INSTRUCTOR: '·', ADMIN: '●', OWNER: '●' } },
  { label: 'Set prices, bank QR, coupons', cells: { LEARNER: '·', INSTRUCTOR: '·', ADMIN: '·', OWNER: '●' } },
  { label: 'Manage administrators and owners', cells: { LEARNER: '·', INSTRUCTOR: '·', ADMIN: '·', OWNER: '●' } },
];

const npr = (minor: unknown) => (typeof minor === 'number' ? `NPR ${(minor / 100).toLocaleString('en-US')}` : '');
const text = (value: unknown) => (typeof value === 'string' ? value : '');
const role = (value: unknown) => (typeof value === 'string' && value in ROLE_NAMES ? ROLE_NAMES[value as TenantRole] : text(value));

/** One audit event as a short sentence an owner can read. Unknown actions fall back to their name. */
export function describeAudit(event: Pick<AuditEvent, 'action' | 'metadata' | 'reason'>): string {
  const m = event.metadata ?? {};
  switch (event.action) {
    case 'payment.approved':
      return `Approved a payment of ${npr(m.amountMinor)}`.trim();
    case 'payment.rejected':
      return `Rejected a payment${text(m.reason) ? `: ${text(m.reason)}` : ''}`;
    case 'notice.sent':
      return `Sent the notice "${text(m.title)}" to ${typeof m.recipients === 'number' ? m.recipients : 0} members`;
    case 'tenant.member.updated': {
      const from = (m.from ?? {}) as Record<string, unknown>;
      const to = (m.to ?? {}) as Record<string, unknown>;
      if (from.status !== to.status) return to.status === 'SUSPENDED' ? 'Suspended a member' : 'Restored a member';
      return `Changed a member from ${role(from.role)} to ${role(to.role)}`;
    }
    case 'tenant.member.joined':
      return `Joined with a code as ${role(m.role)}`;
    case 'tenant.member.joined_store':
      return 'Joined the store as a learner';
    case 'tenant.invite.created':
      return `Created a join code for ${role(m.role)}s`;
    case 'course.created':
      return 'Created a course';
    case 'course.review.submitted':
      return 'Sent a course for review';
    case 'course.review.rejected':
      return `Sent a course back${event.reason ? `: ${event.reason}` : ''}`;
    case 'course.published':
      return 'Published a course';
    case 'course.listing.updated':
      return 'Changed an offering’s kind or category';
    case 'live_session.created':
      return 'Scheduled a live class';
    case 'live_session.cancelled':
      return 'Cancelled a live class';
    case 'access.granted': {
      const lengths: Record<string, string> = { DAYS_7: '7 days', MONTH_1: '1 month', MONTH_6: '6 months', YEAR_1: '1 year', LIFETIME: 'lifetime' };
      return `Gave free access for ${lengths[text(m.length)] ?? 'a period'}${text(m.reason) ? `: ${text(m.reason)}` : ''}`;
    }
    case 'access.revoked':
      return `Ended free access${text(m.reason) ? `: ${text(m.reason)}` : ''}`;
    case 'certificate.revoked':
      return 'Revoked a certificate';
    default:
      return event.action.replace(/[._]/g, ' ');
  }
}
