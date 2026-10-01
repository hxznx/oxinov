/** FR-NOTIF-2903: mail configuration (MAIL_SMTP_HOST, MAIL_SMTP_PORT, MAIL_FROM). */
import { DisabledMailer, SmtpMailer, createMailer, loadMailConfig } from './mailer';

describe('mail configuration', () => {
  it('turns email off when MAIL_SMTP_HOST is empty', () => {
    const config = loadMailConfig({ MAIL_SMTP_HOST: '  ' });
    expect(config).toEqual({ smtpHost: undefined, smtpPort: 2525, from: 'no-reply@oxinov.com' });
    const mailer = createMailer(config);
    expect(mailer).toBeInstanceOf(DisabledMailer);
    expect(mailer.enabled).toBe(false);
  });

  it('uses the relay when MAIL_SMTP_HOST is set', () => {
    const config = loadMailConfig({ MAIL_SMTP_HOST: 'mail-relay', MAIL_SMTP_PORT: '2525', MAIL_FROM: 'no-reply@oxinov.com' });
    expect(config).toEqual({ smtpHost: 'mail-relay', smtpPort: 2525, from: 'no-reply@oxinov.com' });
    const mailer = createMailer(config);
    expect(mailer).toBeInstanceOf(SmtpMailer);
    expect(mailer.enabled).toBe(true);
  });

  it('fails fast on a bad port, sender, or host', () => {
    expect(() => loadMailConfig({ MAIL_SMTP_PORT: '70000' })).toThrow('MAIL_SMTP_PORT');
    expect(() => loadMailConfig({ MAIL_SMTP_PORT: '25abc' })).toThrow('MAIL_SMTP_PORT');
    expect(() => loadMailConfig({ MAIL_FROM: 'Oxinov <no-reply@oxinov.com>' })).toThrow('MAIL_FROM');
    expect(() => loadMailConfig({ MAIL_SMTP_HOST: 'smtp://mail-relay' })).toThrow('MAIL_SMTP_HOST');
  });
});
