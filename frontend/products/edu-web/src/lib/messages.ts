/**
 * Messages helpers (FR-AUTH-104 Messages, FR-CHAT-1301, FR-AI-1705; design screen 15): conversation names,
 * OXI's starter chips, and the support hand-off text. Pure functions, unit-tested without the API.
 */

export type Conversation = 'oxi' | 'support';

export function parseConversation(value: string | string[] | undefined): Conversation {
  const text = Array.isArray(value) ? value[0] : value;
  return text === 'support' ? 'support' : 'oxi';
}

/** Quick questions under OXI's box, as in the design. */
export const OXI_CHIPS = ['Free courses for me', 'Learn Japanese', 'Learn programming', 'Compare plans'] as const;

export const OXI_WELCOME = 'Hi! Tell me what you want to achieve and I’ll suggest courses, classes, skills, or ideas from the Oxinov store.';

/** What support receives when a learner chooses "Talk to a human" after asking OXI. */
export function handoffMessage(question: string): string {
  const text = question.trim().slice(0, 3800);
  return text ? `(Passed on from OXI) ${text}` : '(Passed on from OXI) I would like to talk to a person, please.';
}

/** Message body check shared by learner and staff forms: 1 to 4,000 characters after trimming. */
export function messageProblem(body: string): string | null {
  const text = body.trim();
  if (!text) return 'Write a message first.';
  if (text.length > 4000) return 'Keep the message under 4,000 characters.';
  return null;
}

/** "09:58" today, "Mon" this week, otherwise "3 Oct", in the reader's time zone. */
export function messageTime(value: string, now: Date, timeZone: string): string {
  const date = new Date(value);
  const day = (d: Date) => d.toLocaleDateString('en-CA', { timeZone });
  if (day(date) === day(now)) return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone });
  if (now.getTime() - date.getTime() < 6 * 24 * 60 * 60 * 1000) return date.toLocaleDateString('en-GB', { weekday: 'short', timeZone });
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone });
}
