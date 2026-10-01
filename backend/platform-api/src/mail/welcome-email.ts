/**
 * FR-NOTIF-2903: the "Welcome to Oxinov" email sent once after the first-sign-in welcome (FR-ID-2205).
 * Plain English for email-client translation (ADR-020); no external images, tracking pixels, or tracked links.
 */
export const WELCOME_SUBJECT = 'Welcome to Oxinov';
export const EDU_URL = 'https://edu.oxinov.com';
export const ACCOUNT_URL = 'https://app.oxinov.com';
export const SUPPORT_ADDRESS = 'support@oxinov.com';

export interface RenderedEmail {
  subject: string;
  text: string;
  html: string;
}

const HTML_ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Escapes text for HTML element content and quoted attribute values. */
export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char] ?? char);
}

/** The person's chosen name, without control characters or line breaks, trimmed; null when nothing is left. */
export function cleanDisplayName(value: string | null | undefined): string | null {
  if (!value) return null;
  // Control characters (C0, DEL, C1) and Unicode line and paragraph separators become spaces.
  const cleaned = value.replace(/[\p{Cc}\p{Zl}\p{Zp}]+/gu, ' ').replace(/\s+/g, ' ').trim();
  return cleaned.length > 0 ? cleaned.slice(0, 120) : null;
}

export function renderWelcomeEmail(input: { displayName: string | null | undefined }): RenderedEmail {
  const name = cleanDisplayName(input.displayName);
  const greeting = name ? `Hello ${name},` : 'Hello,';

  const text = [
    greeting,
    '',
    'Welcome to Oxinov. Your Oxinov account is ready, and it works across every Oxinov product.',
    '',
    'What you can do next:',
    `- Start learning on Oxinov Edu: ${EDU_URL}`,
    `- Manage your account: ${ACCOUNT_URL}`,
    '',
    `Need help? Write to ${SUPPORT_ADDRESS}.`,
    '',
    'The Oxinov team',
    '',
    'You received this email because you created an Oxinov account. We send it only once.',
    '',
  ].join('\n');

  const htmlGreeting = name ? `Hello ${escapeHtml(name)},` : 'Hello,';
  const link = (href: string, label: string) =>
    `<a href="${escapeHtml(href)}" style="color:#0b57d0;text-decoration:underline">${label}</a>`;
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(WELCOME_SUBJECT)}</title>
</head>
<body style="margin:0;padding:0;background:#ffffff;color:#1f1f1f;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.5">
<div style="max-width:560px;margin:0 auto;padding:24px 16px">
<h1 style="font-size:22px;margin:0 0 16px">Welcome to <span translate="no">Oxinov</span></h1>
<p style="margin:0 0 16px">${htmlGreeting}</p>
<p style="margin:0 0 16px">Your <span translate="no">Oxinov</span> account is ready, and it works across every <span translate="no">Oxinov</span> product.</p>
<p style="margin:0 0 8px">What you can do next:</p>
<ul style="margin:0 0 16px;padding-left:20px">
<li>Start learning on <span translate="no">Oxinov Edu</span>: ${link(EDU_URL, 'edu.oxinov.com')}</li>
<li>Manage your account: ${link(ACCOUNT_URL, 'app.oxinov.com')}</li>
</ul>
<p style="margin:0 0 16px">Need help? Write to ${link(`mailto:${SUPPORT_ADDRESS}`, SUPPORT_ADDRESS)}.</p>
<p style="margin:0 0 24px">The <span translate="no">Oxinov</span> team</p>
<p style="margin:0;font-size:13px;color:#5f6368">You received this email because you created an <span translate="no">Oxinov</span> account. We send it only once.</p>
</div>
</body>
</html>
`;

  return { subject: WELCOME_SUBJECT, text, html };
}
