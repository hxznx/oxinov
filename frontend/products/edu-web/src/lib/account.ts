/**
 * Learner account centre helpers (FR-AUTH-104; design screens 10 and 12). Pure functions so the status
 * lines, the activity timeline, and share links are unit-tested without the API.
 */
import type { Certificate, Subscription } from './edu-api.ts';
import type { BankPayment } from './store.ts';

export type Tone = 'success' | 'warning' | 'danger' | 'muted' | 'brand';

const DAY = 24 * 60 * 60 * 1000;

/** How one subscription reads, and what the learner can do next. */
export function subscriptionStatus(sub: Pick<Subscription, 'state' | 'endsAt' | 'source'>, now: Date = new Date()): { label: string; tone: Tone; renew: boolean } {
  if (sub.state === 'ENDED') return { label: 'Ended', tone: 'muted', renew: true };
  if (sub.endsAt === null) return { label: sub.source === 'FREE' ? 'Free' : 'Lifetime', tone: 'success', renew: false };
  const days = Math.ceil((new Date(sub.endsAt).getTime() - now.getTime()) / DAY);
  if (days <= 7) return { label: days <= 1 ? 'Ends tomorrow' : `Ends in ${days} days`, tone: 'warning', renew: true };
  return { label: 'Active', tone: 'success', renew: false };
}

export interface ActivityEvent {
  at: string;
  title: string;
  detail: string;
  tone: Tone;
}

const PAYMENT_EVENT: Partial<Record<BankPayment['status'], { title: string; tone: Tone }>> = {
  PENDING_REVIEW: { title: 'Payment sent for review', tone: 'warning' },
  SUCCEEDED: { title: 'Payment approved', tone: 'success' },
  REJECTED: { title: 'Payment needs a fix', tone: 'danger' },
};

/**
 * What happened on the account, newest first: payments, access starting, and certificates. Built from data
 * the learner already sees; sign-in history lives on the Oxinov account page.
 */
export function activityTimeline(subs: Subscription[], payments: BankPayment[], certificates: Certificate[], limit = 30): ActivityEvent[] {
  const events: ActivityEvent[] = [];
  for (const payment of payments) {
    const kind = PAYMENT_EVENT[payment.status];
    if (!kind) continue;
    const at = payment.status === 'PENDING_REVIEW' ? payment.submittedAt : (payment.reviewedAt ?? payment.submittedAt);
    if (at) events.push({ at, title: kind.title, detail: `${payment.courseTitle} · ${payment.planLabel} · ${payment.reference}`, tone: kind.tone });
  }
  for (const sub of subs) {
    events.push({ at: sub.since, title: sub.source === 'FREE' ? 'Started a free course' : 'Access started', detail: sub.courseTitle, tone: 'brand' });
  }
  for (const certificate of certificates) {
    events.push({ at: certificate.issuedAt, title: 'Certificate earned', detail: certificate.courseTitle, tone: 'success' });
  }
  return events.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, limit);
}

/** Share targets for a link (design screen 10, "Invite friends"): each opens the network's own share page. */
export function shareLinks(url: string, text: string): { name: string; href: string }[] {
  const u = encodeURIComponent(url);
  const message = encodeURIComponent(`${text} ${url}`);
  return [
    { name: 'WhatsApp', href: `https://wa.me/?text=${message}` },
    { name: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { name: 'Viber', href: `viber://forward?text=${message}` },
    { name: 'Telegram', href: `https://t.me/share/url?url=${u}&text=${encodeURIComponent(text)}` },
    { name: 'Email', href: `mailto:?subject=${encodeURIComponent(text)}&body=${message}` },
  ];
}

/** Two letters for the profile mark, from the name or else the email. */
export function initials(name: string | null, email: string | null): string {
  const source = (name?.trim() || email?.split('@')[0] || 'Oxinov').replace(/[^\p{L}\p{N}\s._-]/gu, '');
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  const letters = parts.length >= 2 ? [parts[0]!, parts[1]!].map((part) => [...part][0]) : [...(parts[0] ?? 'OX')].slice(0, 2);
  return letters.join('').toUpperCase();
}
