// Starts the relay: SMTP in on the private network; out through an SMTP provider when MAIL_SMTP_HOST is set
// (Brevo, while Amazon SES is refused production access and delivers only to verified addresses), otherwise
// through the Amazon SES API with the instance role.
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';
import { createRateLimiter, createRelay, createSmtpSender } from './relay.mjs';

const from = process.env.MAIL_FROM?.trim();
if (!from) throw new Error('MAIL_FROM is required, e.g. no-reply@oxinov.com');
const port = Number(process.env.PORT ?? '2525');

const log = (entry) => console.log(JSON.stringify({ timestamp: new Date().toISOString(), service: 'mail-relay', ...entry }));

// Defaults: 5 messages per address per 15 minutes, 60 messages a minute overall (see createRateLimiter).
const limit = (name, fallback) => {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isInteger(value) || value < 1) throw new Error(`${name} must be a positive whole number`);
  return value;
};
const limiter = createRateLimiter({
  perRecipient: limit('MAIL_LIMIT_PER_RECIPIENT', 5),
  windowSeconds: limit('MAIL_LIMIT_WINDOW_SECONDS', 900),
  globalPerMinute: limit('MAIL_LIMIT_PER_MINUTE', 60),
});

/** @type {(message: { from: string; to: string[]; raw: Buffer }) => Promise<void>} */
let send;
let upstream;
const smtpHost = process.env.MAIL_SMTP_HOST?.trim();
if (smtpHost) {
  // A provider's SMTP login and key come from Parameter Store through the app Secret; never logged.
  send = createSmtpSender({
    host: smtpHost,
    port: Number(process.env.MAIL_SMTP_PORT ?? '587'),
    user: process.env.MAIL_SMTP_USER?.trim() || undefined,
    password: process.env.MAIL_SMTP_PASSWORD || undefined,
  });
  upstream = 'smtp';
} else {
  const ses = new SESv2Client({ region: process.env.AWS_REGION ?? 'ap-south-1' });
  const configurationSet = process.env.SES_CONFIGURATION_SET?.trim() || undefined;
  send = async ({ from: sender, to, raw }) => {
    await ses.send(
      new SendEmailCommand({
        FromEmailAddress: sender,
        Destination: { ToAddresses: to },
        Content: { Raw: { Data: raw } },
        ConfigurationSetName: configurationSet,
      }),
    );
  };
  upstream = 'ses';
}

const relay = createRelay({ allowedFrom: from, log, limiter, send });

relay.listen(port, '0.0.0.0', () => log({ event: 'started', port, upstream }));
for (const signal of ['SIGTERM', 'SIGINT']) process.on(signal, () => relay.close(() => process.exit(0)));
