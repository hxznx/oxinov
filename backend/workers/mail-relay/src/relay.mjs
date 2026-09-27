// SMTP-to-Amazon-SES relay for the starter server (ADR-017). Keycloak speaks SMTP; this forwards each
// message to the SES API using the EC2 instance role, so no SMTP credentials or access keys exist.
// It listens only on the private Docker network and refuses any sender other than the configured one.
import { SMTPServer } from 'smtp-server';

// SES errors that retrying cannot fix (for example an unverified recipient while the account is in the SES
// sandbox); the relay answers them with a permanent SMTP failure instead of "try again later".
const PERMANENT_ERRORS = new Set(['MessageRejected', 'MailFromDomainNotVerifiedException']);

/** SES's reason for a failure, safe to log: email addresses removed, length capped. */
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
 */
export function createRelay({ send, allowedFrom, maxBytes = 512 * 1024, maxRecipients = 5, log = () => {} }) {
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
    onRcptTo(_address, session, callback) {
      if (session.envelope.rcptTo.length >= maxRecipients) {
        return callback(Object.assign(new Error('Too many recipients'), { responseCode: 452 }));
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
            const permanent = PERMANENT_ERRORS.has(error?.name);
            log({
              event: 'mail.failed',
              error: error?.name ?? 'Error',
              status: error?.$metadata?.httpStatusCode,
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
