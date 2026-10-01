import { createTransport } from 'nodemailer';

/** Injection token for the outgoing mail port (FR-NOTIF-2903). Tests provide a fake. */
export const MAILER = Symbol('MAILER');

export interface MailMessage {
  /** One recipient: the person's verified address. */
  readonly to: string;
  readonly subject: string;
  readonly text: string;
  readonly html: string;
}

export interface Mailer {
  /** False when MAIL_SMTP_HOST is empty: callers log that email is off and send nothing. */
  readonly enabled: boolean;
  send(message: MailMessage): Promise<void>;
}

export interface MailConfig {
  /** SMTP relay host; undefined turns email off. In the cluster this is the `mail-relay` service. */
  readonly smtpHost?: string;
  readonly smtpPort: number;
  /** Envelope and header sender. The relay accepts only its own configured sender (no-reply@oxinov.com). */
  readonly from: string;
}

const DEFAULT_FROM = 'no-reply@oxinov.com';
const DEFAULT_PORT = 2525;
const ADDRESS = /^[^\s@<>"'(),;:]+@[^\s@<>"'(),;:]+\.[^\s@<>"'(),;:]+$/;

/** Reads MAIL_SMTP_HOST, MAIL_SMTP_PORT, and MAIL_FROM once at startup and fails fast on bad values. */
export function loadMailConfig(env: NodeJS.ProcessEnv = process.env): MailConfig {
  const smtpHost = env.MAIL_SMTP_HOST?.trim() || undefined;
  const rawPort = env.MAIL_SMTP_PORT?.trim() || String(DEFAULT_PORT);
  const from = env.MAIL_FROM?.trim() || DEFAULT_FROM;
  const errors: string[] = [];
  const smtpPort = Number(rawPort);
  if (!/^\d+$/.test(rawPort) || smtpPort < 1 || smtpPort > 65535) errors.push('MAIL_SMTP_PORT must be 1-65535');
  if (!ADDRESS.test(from)) errors.push('MAIL_FROM must be a plain email address, e.g. no-reply@oxinov.com');
  if (smtpHost && !/^[A-Za-z0-9.-]+$/.test(smtpHost)) errors.push('MAIL_SMTP_HOST must be a host name or IP address');
  if (errors.length > 0) throw new Error(`Invalid mail configuration: ${errors.join('; ')}`);
  return { smtpHost, smtpPort, from };
}

/** Email is off (no MAIL_SMTP_HOST): nothing is sent. */
export class DisabledMailer implements Mailer {
  readonly enabled = false;
  send(): Promise<void> {
    // Callers check `enabled` and log that email is off.
    return Promise.resolve();
  }
}

/**
 * Plain SMTP to the in-cluster relay (backend/workers/mail-relay): private network, no login. The relay
 * forwards to the provider (Brevo or Amazon SES). Short timeouts keep a stuck relay from holding a request.
 */
export class SmtpMailer implements Mailer {
  readonly enabled = true;
  private readonly transport: ReturnType<typeof createTransport>;

  constructor(private readonly config: MailConfig & { smtpHost: string }) {
    this.transport = createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpPort === 465,
      connectionTimeout: 5_000,
      greetingTimeout: 5_000,
      socketTimeout: 10_000,
    });
  }

  async send(message: MailMessage): Promise<void> {
    await this.transport.sendMail({
      from: { name: 'Oxinov', address: this.config.from },
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });
  }
}

export function createMailer(config: MailConfig): Mailer {
  return config.smtpHost ? new SmtpMailer({ ...config, smtpHost: config.smtpHost }) : new DisabledMailer();
}
