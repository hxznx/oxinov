/** FR-NOTIF-2903: the welcome email's content and escaping. */
import { ACCOUNT_URL, EDU_URL, SUPPORT_ADDRESS, WELCOME_SUBJECT, cleanDisplayName, escapeHtml, renderWelcomeEmail } from './welcome-email';

describe('welcome email (FR-NOTIF-2903)', () => {
  it('greets the person by name and says what to do next, with the support address', () => {
    const email = renderWelcomeEmail({ displayName: 'Mina' });
    expect(email.subject).toBe(WELCOME_SUBJECT);
    expect(email.subject).toBe('Welcome to Oxinov');
    for (const part of [email.text, email.html]) {
      expect(part).toContain('Hello Mina,');
      expect(part).toContain('edu.oxinov.com');
      expect(part).toContain('app.oxinov.com');
      expect(part).toContain(SUPPORT_ADDRESS);
    }
    expect(email.text).toContain(EDU_URL);
    expect(email.text).toContain(ACCOUNT_URL);
    expect(email.html).toContain(`href="${EDU_URL}"`);
    expect(email.html).toContain(`href="${ACCOUNT_URL}"`);
    expect(email.html).toContain(`href="mailto:${SUPPORT_ADDRESS}"`);
  });

  it('escapes the display name in the HTML part', () => {
    const email = renderWelcomeEmail({ displayName: `<script>alert("x")</script> & <img src=x onerror='y'>` });
    expect(email.html).not.toContain('<script>');
    expect(email.html).not.toContain('<img');
    expect(email.html).toContain('Hello &lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &lt;img src=x onerror=&#39;y&#39;&gt;,');
    // The text part is plain text: shown as typed, never interpreted.
    expect(email.text).toContain(`Hello <script>alert("x")</script> & <img src=x onerror='y'>,`);
  });

  it('loads nothing external: no images, scripts, styles sheets, or tracking', () => {
    const { html } = renderWelcomeEmail({ displayName: 'Mina' });
    expect(html).not.toMatch(/<img|<script|<link|<iframe|url\(|src=/i);
    const links = [...html.matchAll(/href="([^"]+)"/g)].map((match) => match[1]);
    expect(links).toEqual([EDU_URL, ACCOUNT_URL, `mailto:${SUPPORT_ADDRESS}`]);
  });

  it('falls back to a plain greeting without a usable name', () => {
    for (const displayName of [null, undefined, '', '   ', '\r\n\t']) {
      const email = renderWelcomeEmail({ displayName });
      expect(email.text.startsWith('Hello,\n')).toBe(true);
      expect(email.html).toContain('<p style="margin:0 0 16px">Hello,</p>');
    }
  });

  it('removes line breaks and control characters from the name', () => {
    expect(cleanDisplayName('Mina\r\nBcc: someone\u0000 ')).toBe('Mina Bcc: someone');
    expect(cleanDisplayName('  Asha   Rai ')).toBe('Asha Rai');
    expect(renderWelcomeEmail({ displayName: 'Mina\nEvil' }).text).toContain('Hello Mina Evil,');
  });

  it('escapes every HTML special character', () => {
    expect(escapeHtml(`&<>"'`)).toBe('&amp;&lt;&gt;&quot;&#39;');
    expect(escapeHtml('Ram Bahadur')).toBe('Ram Bahadur');
  });
});
