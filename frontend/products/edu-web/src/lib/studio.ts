/**
 * Oxinov Studio helpers (ADR-028 point 12; design screen 8): what needs the administrator's attention, and
 * how an offering's sale state reads. Pure functions so they are unit-tested without the API.
 */
import type { OfferingCategory, OfferingKind } from './edu-api.ts';
import type { StoreSettings } from './store.ts';

export type Tone = 'brand' | 'success' | 'warning' | 'danger' | 'muted';

export interface TodoItem {
  key: string;
  title: string;
  sub: string;
  href: string;
  glyph: string;
  tone: Tone;
}

export interface OfferingRow {
  courseId: string;
  title: string;
  /** Published at least once, so learners can find it. */
  published: boolean;
  /** Has a draft waiting (being written or in review). */
  draftStatus: 'DRAFT' | 'IN_REVIEW' | null;
  hasPlans: boolean;
  /** Cheapest active plan, or the single price of a course without plans, in minor units. */
  fromMinor: number | null;
  kind: OfferingKind;
  category: OfferingCategory;
}

/**
 * The "Needs you" list, most urgent first: payments waiting, then anything that keeps checkout closed or
 * leaves learners without an answer, then published offerings that cannot be bought.
 */
export function studioTodo(input: { base: string; settings: StoreSettings; waiting: number; offerings: OfferingRow[] }): TodoItem[] {
  const { base, settings, waiting, offerings } = input;
  const items: TodoItem[] = [];
  if (waiting > 0) {
    items.push({
      key: 'waiting',
      title: `${waiting} payment${waiting === 1 ? '' : 's'} waiting for review`,
      sub: 'Check each one against your bank statement, oldest first.',
      href: `${base}/payments`,
      glyph: '₹',
      tone: 'warning',
    });
  }
  if (!settings.isSeller) {
    items.push({ key: 'seller', title: 'This workspace cannot sell yet', sub: 'Oxinov engineering adds the selling workspace in the server settings.', href: `${base}/settings`, glyph: '⛨', tone: 'danger' });
  }
  if (!settings.qrUrl) {
    items.push({ key: 'qr', title: 'Upload your bank QR', sub: 'Checkout stays closed until learners have a QR to scan.', href: `${base}/settings#payment`, glyph: '▣', tone: 'warning' });
  }
  if (!settings.accountName || !settings.accountNumber || !settings.bankName) {
    items.push({ key: 'bank', title: 'Add the bank and account details', sub: 'Learners see them under the QR, for paying by account number.', href: `${base}/settings#payment`, glyph: '₹', tone: 'warning' });
  }
  if (!settings.refundPolicy.trim()) {
    items.push({ key: 'refund', title: 'Write the refund or change policy', sub: 'Shown at checkout so learners know the rules before they pay.', href: `${base}/settings#policies`, glyph: '§', tone: 'warning' });
  }
  if (!settings.helpContact) {
    items.push({ key: 'help', title: 'Add a payment help number', sub: 'WhatsApp or Viber, for learners stuck at checkout.', href: `${base}/settings#payment`, glyph: '☎', tone: 'muted' });
  }
  const unpriced = offerings.filter((offering) => offering.published && !offering.hasPlans);
  if (unpriced.length > 0) {
    items.push({
      key: 'plans',
      title: `${unpriced.length} published offering${unpriced.length === 1 ? ' has' : 's have'} no plans`,
      sub: 'Learners cannot buy access until plans and prices are saved.',
      href: `${base}/offerings`,
      glyph: '▦',
      tone: 'brand',
    });
  }
  return items;
}

/** One line for an offering's sale state, as the Offerings list shows it. */
export function saleState(offering: OfferingRow, formatMinor: (minor: number) => string): { text: string; tone: Tone } {
  if (!offering.published) return { text: offering.draftStatus === 'IN_REVIEW' ? 'In review' : 'Draft, not published', tone: 'muted' };
  if (offering.hasPlans && offering.fromMinor !== null) return { text: `On sale from ${formatMinor(offering.fromMinor)}`, tone: 'success' };
  if (offering.fromMinor !== null && offering.fromMinor > 0) return { text: `${formatMinor(offering.fromMinor)}, no plans`, tone: 'warning' };
  return { text: 'Free, no plans', tone: 'warning' };
}

/** Sum of approved amounts in minor units (the review queue returns at most the latest 100). */
export function approvedTotal(items: { amountMinor: number }[]): number {
  return items.reduce((sum, item) => sum + item.amountMinor, 0);
}
