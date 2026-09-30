// Mail relay for the starter server (ADR-017). Keycloak speaks SMTP to it; it forwards each message to an SMTP
// provider (Brevo) when one is configured, or to the Amazon SES API with the EC2 instance role. It listens only
// on the private network, refuses any sender other than the configured one, and limits volume per recipient.
import { createHash } from 'node:crypto';
import nodemailer from 'nodemailer';
import { SMTPServer } from 'smtp-server';

/**
 * Limits how much mail goes out, so "Send a new code" or repeated sign-in attempts cannot flood a person's
 * inbox or run up the SES bill (FR-ID-2202: codes are rate-limited; the email-code extension has no resend
 * limit of its own). Per recipient: `perRecipient` messages per `windowSeconds`. Overall: `globalPerMinute`.
 * State is in memory (one replica); recipients are keyed by a SHA-256 hash, never stored in clear.
 * @param {{ perRecipient?: number; windowSeconds?: number; globalPerMinute?: number; now?: () => number }} [options]
 */
export function createRateLimiter({ perRecipient = 5, windowSeconds = 900, globalPerMinute = 60, now = Date.now } = {}) {
  const windowMs = windowSeconds * 1000;
  /** @type {Map<string, number[]>} recipient hash -> send times within the window */
  const recent = new Map();
  /** @type {number[]} send times within the last minute, all recipients */
  let global = [];
  const key = (address) => createHash('sha256').update(address.trim().toLowerCase()).digest('hex');
  return {
    /** Records a send to `address` and returns null, or returns why it is refused ('recipient' or 'global'). */
    take(address) {
      const time = now();
      global = global.filter((at) => at > time - 60_000);
      if (global.length >= globalPerMinute) return 'global';
      const id = key(address);
      const times = (recent.get(id) ?? []).filter((at) => at > time - windowMs);
      if (times.length >= perRecipient) {
        recent.set(id, times);
        return 'recipient';
      }
      times.push(time);
      recent.set(id, times);
      global.push(time);
      // Forget recipients with nothing in the window, so memory stays small.
      if (recent.size > 10_000) {
        for (const [entry, list] of recent) if (!list.some((at) => at > time - windowMs)) recent.delete(entry);
      }
      return null;
    },
  };
}

// SES errors that retrying cannot fix (for example an unverified recipient while the account is in the SES
// sandbox); the relay answers them with a permanent SMTP failure instead of "try again later".
const PERMANENT_ERRORS = new Set(['MessageRejected', 'MailFromDomainNotVerifiedException']);

/**
 * Sends the message exactly as Keycloak wrote it (raw MIME) to an SMTP provider such as Brevo
 * (smtp-relay.brevo.com:587). With a login, the connection must upgrade to TLS (STARTTLS), or use TLS from the
 * start on port 465; without one (local Mailpit), it may stay plain.
 * @param {{ host: string; port?: number; user?: string; password?: string }} options
 */
export function createSmtpSender({ host, port = 587, user, password }) {
  const transport = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    requireTLS: Boolean(user) && port !== 465,
    auth: user ? { user, pass: password } : undefined,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
  return async ({ from, to, raw }) => {
    await transport.sendMail({ envelope: { from, to }, raw });
  };
}

/** Whether retrying cannot help: SES's permanent errors, or an SMTP provider's 5xx reply. */
export function isPermanent(error) {
  if (PERMANENT_ERRORS.has(error?.name)) return true;
  const code = Number(error?.responseCode);
  return code >= 500 && code < 600;
}

/** The provider's reason for a failure, safe to log: email addresses removed, length capped. */
export function failureReason(error) {
  const message = typeof error?.message === 'string' ? error.message : '';
  return message.replace(/[^\s@<>"'(),;:]+@[^\s@<>"'(),;:]+/g, '[address]').slice(0, 300);
}

/**
 * @param {object} options
 * @param {(message: { from: string; to: string[]; raw: Buffer }) => Promise<void>} options.send
 * @param {string} options.allowedFrom the only envelope sender accepted, e.g. no-reply@oxinov.com
 * @param {number} [options.maxBytes] largest accepted message
 * @param {number} [options.maxRecipients] recipients per message (sign-in mail has one)
 * @param {(event: object) => void} [options.log]
 * @param {{ take(address: string): string | null }} [options.limiter] from createRateLimiter
 */
export function createRelay({
  send,
  allowedFrom,
  maxBytes = 512 * 1024,
  maxRecipients = 5,
  log = () => {},
  limiter = createRateLimiter(),
}) {
  const sender = allowedFrom.toLowerCase();
  return new SMTPServer({
    name: 'mail-relay',
    banner: 'Oxinov mail relay',
    authOptional: true,
    disabledCommands: ['AUTH', 'STARTTLS'],
    size: maxBytes,
    logger: false,
    onMailFrom(address, _session, callback) {
      if (address.address.toLowerCase() !== sender) {
        log({ event: 'mail.refused', reason: 'sender' });
        return callback(Object.assign(new Error('Sender not allowed'), { responseCode: 550 }));
      }
      callback();
    },
    onRcptTo(address, session, callback) {
      if (session.envelope.rcptTo.length >= maxRecipients) {
        return callback(Object.assign(new Error('Too many recipients'), { responseCode: 452 }));
      }
      // A temporary refusal: Keycloak shows "try again later" and nothing reaches SES.
      const limited = limiter.take(address.address);
      if (limited) {
        log({ event: 'mail.limited', reason: limited });
        return callback(Object.assign(new Error('Too many messages, try again later'), { responseCode: 450 }));
      }
      callback();
    },
    onData(stream, session, callback) {
      const chunks = [];
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', () => {
        if (stream.sizeExceeded) {
          log({ event: 'mail.refused', reason: 'size' });
          return callback(Object.assign(new Error('Message too large'), { responseCode: 552 }));
        }
        const to = session.envelope.rcptTo.map((rcpt) => rcpt.address);
        send({ from: sender, to, raw: Buffer.concat(chunks) }).then(
          () => {
            // Never log addresses or content: only that a message went out and to how many people.
            log({ event: 'mail.sent', recipients: to.length });
            callback();
          },
          (error) => {
            const permanent = isPermanent(error);
            log({
              event: 'mail.failed',
              error: error?.name ?? 'Error',
              status: error?.$metadata?.httpStatusCode ?? error?.responseCode,
              permanent,
              reason: failureReason(error),
            });
            callback(
              permanent
                ? Object.assign(new Error('Message refused by the email service'), { responseCode: 550 })
                : Object.assign(new Error('Temporary delivery failure'), { responseCode: 451 }),
            );
          },
        );
      });
    },
  });
}
