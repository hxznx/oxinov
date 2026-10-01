import { Inject, Injectable } from '@nestjs/common';
import { createTransport, type Transporter } from 'nodemailer';
import { APP_CONFIG, type AppConfig } from '../config/app-config';

/** One email to one learner. Bodies are built by templates in ./templates. */
export interface OutgoingMail {
  readonly to: string;
  readonly subject: string;
  readonly text: string;
  readonly html: string;
}

/** Sends transactional email. Tests inject a fake; production uses the in-cluster mail relay. */
export interface Mailer {
  send(mail: OutgoingMail): Promise<void>;
}

export const MAILER = Symbol('MAILER');

/**
 * Sends through the cluster's `mail-relay` (SMTP, port 2525, no credentials; it accepts only the
 * configured sender and forwards to Brevo or Amazon SES). With no MAIL_SMTP_HOST, mail is off and
 * every send is a no-op, so local development never emails anyone by accident.
 */
@Injectable()
export class SmtpMailer implements Mailer {
  private readonly transport?: Transporter;
  private readonly from: string;

  constructor(@Inject(APP_CONFIG) config: AppConfig) {
    this.from = config.mail.from;
    if (config.mail.smtpHost) {
      this.transport = createTransport({ host: config.mail.smtpHost, port: config.mail.smtpPort, secure: false, ignoreTLS: true });
    }
  }

  async send(mail: OutgoingMail): Promise<void> {
    if (!this.transport) return;
    await this.transport.sendMail({ from: `Oxinov <${this.from}>`, to: mail.to, subject: mail.subject, text: mail.text, html: mail.html });
  }
}
