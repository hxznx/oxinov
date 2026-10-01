import type { OutgoingMail } from './mailer';

/**
 * Plain-English learner emails for payments (FR-COMM-703). Every value from a person or the database is
 * HTML-escaped; there are no remote images or tracking. Wording matches the design canvas.
 */

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c);
}

const formatNpr = (minor: number): string => `NPR ${(minor / 100).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;

const formatDate = (date: Date): string =>
  date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kathmandu' });

interface Layout {
  readonly to: string;
  readonly subject: string;
  readonly title: string;
  readonly paragraphs: readonly string[];
  readonly details: readonly string[];
  readonly button: { readonly label: string; readonly url: string };
  readonly support: string;
  readonly footer: string;
}

function render(layout: Layout): OutgoingMail {
  const text = [
    layout.title,
    '',
    ...layout.paragraphs,
    '',
    ...layout.details,
    '',
    `${layout.button.label}: ${layout.button.url}`,
    '',
    `Questions? Write to ${layout.support}.`,
    '',
    layout.footer,
  ].join('\n');
  const html = `<!doctype html><html lang="en"><body style="margin:0;background:#f4f7fb;font-family:Segoe UI,Arial,sans-serif;color:#0a0a12">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff">
<tr><td style="background:#07070d;padding:18px 24px;color:#e6f1ff;font-weight:700;letter-spacing:4px">OXINOV</td></tr>
<tr><td style="padding:24px;font-size:15px;line-height:1.6">
<h1 style="margin:0 0 12px;font-size:22px">${escapeHtml(layout.title)}</h1>
${layout.paragraphs.map((p) => `<p style="margin:0 0 12px">${escapeHtml(p)}</p>`).join('\n')}
${layout.details.length ? `<p style="margin:0 0 16px;padding:12px 14px;background:#f4f7fb;border-left:3px solid #07070d">${layout.details.map(escapeHtml).join('<br>')}</p>` : ''}
<p style="margin:0 0 16px"><a href="${escapeHtml(layout.button.url)}" style="display:inline-block;padding:12px 22px;background:#07070d;color:#00f0ff;text-decoration:none;font-weight:700">${escapeHtml(layout.button.label)}</a></p>
<p style="margin:0;color:#4a5568;font-size:13px">Questions? Write to ${escapeHtml(layout.support)}.</p>
</td></tr>
<tr><td style="padding:14px 24px;background:#f4f7fb;color:#4a5568;font-size:11px">${escapeHtml(layout.footer)}</td></tr>
</table></td></tr></table></body></html>`;
  return { to: layout.to, subject: layout.subject, text, html };
}

export interface PaymentMailInput {
  readonly to: string;
  readonly courseTitle: string;
  readonly planLabel: string;
  readonly amountMinor: number;
  readonly reference: string;
  readonly endsAt: Date | null;
  readonly courseUrl: string;
  readonly support: string;
}

/** "Thank you for subscribing to {offering} ({plan})" after approval. */
export function thankYouMail(input: PaymentMailInput): OutgoingMail {
  return render({
    to: input.to,
    subject: `Thank you for subscribing to ${input.courseTitle} (${input.planLabel})`,
    title: 'You are in. Thank you for subscribing!',
    paragraphs: [`Your payment was approved and ${input.courseTitle} is now unlocked.`],
    details: [
      `Plan: ${input.planLabel} · ${formatNpr(input.amountMinor)}`,
      `Access: ${input.endsAt ? `until ${formatDate(input.endsAt)}` : 'lifetime, no end date'}`,
      `Reference: ${input.reference}`,
    ],
    button: { label: 'Open my course', url: input.courseUrl },
    support: input.support,
    footer: 'Ox Inov Pvt. Ltd. This is a payment notice for your Oxinov account and cannot be turned off.',
  });
}

/** The reviewer's reason and how to fix it, after a rejection. */
export function rejectedMail(input: Omit<PaymentMailInput, 'endsAt'> & { readonly reason: string; readonly fixUrl: string }): OutgoingMail {
  return render({
    to: input.to,
    subject: `We could not approve your payment for ${input.courseTitle}`,
    title: 'Your payment needs a quick fix',
    paragraphs: [
      'We checked your payment against our bank statement and could not approve it yet. Nothing is lost: fix the details and send them again.',
    ],
    details: [`Reason from our team: ${input.reason}`, `Plan: ${input.planLabel} · ${formatNpr(input.amountMinor)}`, `Reference: ${input.reference}`],
    button: { label: 'Fix and resubmit', url: input.fixUrl },
    support: input.support,
    footer: 'Ox Inov Pvt. Ltd. This is a payment notice for your Oxinov account and cannot be turned off.',
  });
}
