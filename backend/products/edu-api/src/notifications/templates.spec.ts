import { escapeHtml, rejectedMail, renewalMail, thankYouMail } from './templates';

describe('payment emails (FR-COMM-703)', () => {
  const base = {
    to: 'learner@example.com',
    courseTitle: 'Japanese <b>N5</b>',
    planLabel: '1 year',
    amountMinor: 1_500_000,
    reference: 'OXE-7F3K2Q',
    courseUrl: 'https://edu.oxinov.com/w/oxinov/courses/c1',
    support: 'support@oxinov.com',
  };

  it('thanks the learner with the plan, amount, end date, and reference', () => {
    const mail = thankYouMail({ ...base, endsAt: new Date('2027-10-01T06:00:00Z') });
    expect(mail.subject).toBe('Thank you for subscribing to Japanese <b>N5</b> (1 year)');
    expect(mail.text).toContain('Plan: 1 year · NPR 15,000');
    expect(mail.text).toContain('Access: until 1 Oct 2027');
    expect(mail.text).toContain('Reference: OXE-7F3K2Q');
    expect(mail.text).toContain('Open my course: https://edu.oxinov.com/w/oxinov/courses/c1');
  });

  it('says lifetime when the plan has no end', () => {
    expect(thankYouMail({ ...base, endsAt: null }).text).toContain('Access: lifetime, no end date');
  });

  it('escapes every value in the HTML body', () => {
    const mail = rejectedMail({ ...base, reason: '<script>alert(1)</script>', fixUrl: 'https://edu.oxinov.com/x?a=1&b="2"' });
    expect(mail.html).not.toContain('<script>');
    expect(mail.html).not.toContain('<b>N5</b>');
    expect(mail.html).toContain('&lt;script&gt;');
    expect(mail.html).toContain('a=1&amp;b=&quot;2&quot;');
    expect(mail.text).toContain('Reason from our team: <script>alert(1)</script>');
  });

  it('escapes the five HTML special characters', () => {
    expect(escapeHtml(`&<>"'`)).toBe('&amp;&lt;&gt;&quot;&#39;');
  });
});

describe('renewal reminder email (FR-COMM-704)', () => {
  const base = { to: 'learner@example.com', courseTitle: 'Japanese <N5>', endsAt: new Date('2026-10-09T06:00:00Z'), renewUrl: 'https://edu.oxinov.com/o/jlpt?a=1&b=2', support: 'support@oxinov.com' };

  it('says when access ends and how to renew, escaping every value', () => {
    const week = renewalMail({ ...base, daysLeft: 7 });
    expect(week.subject).toBe('Your access to Japanese <N5> ends in 7 days');
    expect(week.text).toContain('ends on 9 Oct 2026');
    expect(week.text).toContain('Renew my plan: https://edu.oxinov.com/o/jlpt?a=1&b=2');
    expect(week.html).toContain('Japanese &lt;N5&gt;');
    expect(week.html).toContain('href="https://edu.oxinov.com/o/jlpt?a=1&amp;b=2"');
    expect(week.html).not.toContain('<N5>');
    expect(renewalMail({ ...base, daysLeft: 1 }).subject).toBe('Your access to Japanese <N5> ends tomorrow');
  });
});
