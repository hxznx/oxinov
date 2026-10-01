import { Inject, Injectable } from '@nestjs/common';
import { JsonLogger, LOGGER } from '@oxinov/server-kit';
import { MAILER, type Mailer } from './mailer';
import { renderWelcomeEmail } from './welcome-email';

export interface WelcomeRecipient {
  readonly userId: string;
  /** The verified address on the account; null skips the email. */
  readonly email: string | null;
  readonly displayName: string | null;
}

/**
 * FR-NOTIF-2903: sends the welcome email after the welcome transaction commits. It never throws: a failed send
 * must not fail the welcome, so failures become one structured warning without the address or the email body.
 */
@Injectable()
export class WelcomeEmailService {
  constructor(
    @Inject(MAILER) private readonly mailer: Mailer,
    @Inject(LOGGER) private readonly logger: JsonLogger,
  ) {}

  async send(recipient: WelcomeRecipient): Promise<void> {
    if (!this.mailer.enabled) {
      this.logger.event('info', 'mail.welcome.skipped', { userId: recipient.userId, reason: 'mail_disabled' });
      return;
    }
    if (!recipient.email) {
      this.logger.event('warn', 'mail.welcome.skipped', { userId: recipient.userId, reason: 'no_address' });
      return;
    }
    try {
      await this.mailer.send({ to: recipient.email, ...renderWelcomeEmail({ displayName: recipient.displayName }) });
      this.logger.event('info', 'mail.welcome.sent', { userId: recipient.userId });
    } catch (error: unknown) {
      this.logger.event('warn', 'mail.welcome.failed', { userId: recipient.userId, ...describeFailure(error) });
    }
  }
}

/** Only the error class and SMTP status: provider messages can echo the recipient address. */
function describeFailure(error: unknown): { errorName: string; smtpStatus?: number; errorCode?: string } {
  if (typeof error !== 'object' || error === null) return { errorName: 'Error' };
  const { name, responseCode, code } = error as { name?: unknown; responseCode?: unknown; code?: unknown };
  return {
    errorName: typeof name === 'string' ? name.slice(0, 60) : 'Error',
    smtpStatus: typeof responseCode === 'number' ? responseCode : undefined,
    errorCode: typeof code === 'string' && /^[A-Z_]{1,40}$/.test(code) ? code : undefined,
  };
}
