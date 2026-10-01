/**
 * FR-NOTIF-2903 with FR-ID-2205: the welcome sends one email after the transaction, and a failed send never
 * fails the welcome. PostgreSQL behaviour (row-level security, the real transaction) is covered by
 * test/accounts.e2e-spec.ts; here the transaction is an in-memory fake.
 */
import { JsonLogger, type SecurityEventsService } from '@oxinov/server-kit';
import type { DatabaseContext, Tx } from '../database/database-context.service';
import type { Mailer, MailMessage } from '../mail/mailer';
import { WelcomeEmailService } from '../mail/welcome-email.service';
import type { AccountUser } from './account.types';
import type { WelcomeDto } from './accounts.dto';
import { AccountsService } from './accounts.service';

const USER_ID = '22222222-0000-4000-8000-000000000001';
const ADDRESS = 'mina@example.test';

const user: AccountUser = {
  userId: USER_ID,
  authSubject: 'google|mina',
  email: ADDRESS,
  emailVerified: true,
  status: 'PENDING_WELCOME',
  trustLevel: 'T1',
};

const input = {
  displayName: 'Mina',
  country: 'NP',
  ageConfirmed: true,
  accepted: [{ policyId: 'terms', version: 1 }],
  channel: 'WEB',
  locale: 'en',
} as WelcomeDto;

/** One account row and no current policies; just enough of Prisma for AccountsService.welcome. */
function fakeDatabase(status: 'PENDING_WELCOME' | 'ACTIVE' = 'PENDING_WELCOME') {
  const row = {
    id: USER_ID,
    email: ADDRESS,
    emailVerified: true,
    displayName: null as string | null,
    country: null as string | null,
    status: status as string,
    trustLevel: 'T1',
  };
  const tx = {
    userAccount: {
      findUniqueOrThrow: jest.fn(() => Promise.resolve({ ...row })),
      updateMany: jest.fn(({ where, data }: { where: { status: string }; data: Record<string, unknown> }) => {
        if (row.status !== where.status) return Promise.resolve({ count: 0 });
        Object.assign(row, { displayName: data.displayName, country: data.country, status: data.status });
        return Promise.resolve({ count: 1 });
      }),
    },
    policy: { findMany: jest.fn(() => Promise.resolve([])) },
    policyAcceptance: { findMany: jest.fn(() => Promise.resolve([])), createMany: jest.fn() },
    product: { findMany: jest.fn(() => Promise.resolve([])) },
    entitlement: { createMany: jest.fn() },
    auditEvent: { create: jest.fn(() => Promise.resolve({})) },
  };
  const db = { run: jest.fn((_context: unknown, work: (tx: Tx) => Promise<unknown>) => work(tx as unknown as Tx)) };
  return { db: db as unknown as DatabaseContext, tx, row };
}

function setup(mailer: Mailer, status?: 'PENDING_WELCOME' | 'ACTIVE') {
  const lines: string[] = [];
  const logger = new JsonLogger({ service: 'platform', environment: 'ci', version: 'test' }, (line) => lines.push(line));
  const { db, tx } = fakeDatabase(status);
  const securityEvents = { emit: jest.fn() } as unknown as SecurityEventsService;
  const service = new AccountsService(db, securityEvents, new WelcomeEmailService(mailer, logger));
  const events = () => lines.map((line) => JSON.parse(line) as Record<string, unknown>);
  return { service, tx, lines, events };
}

class RecordingMailer implements Mailer {
  readonly enabled = true;
  readonly sent: MailMessage[] = [];
  send(message: MailMessage): Promise<void> {
    this.sent.push(message);
    return Promise.resolve();
  }
}

describe('AccountsService.welcome email (FR-NOTIF-2903)', () => {
  it('sends one welcome email to the verified address after activating the account', async () => {
    const mailer = new RecordingMailer();
    const { service, events } = setup(mailer);
    const view = await service.welcome(user, input);
    expect(view.status).toBe('ACTIVE');
    expect(mailer.sent).toHaveLength(1);
    expect(mailer.sent[0]).toMatchObject({ to: ADDRESS, subject: 'Welcome to Oxinov' });
    expect(mailer.sent[0]?.text).toContain('Hello Mina,');
    expect(events()).toEqual([expect.objectContaining({ level: 'info', event: 'mail.welcome.sent', userId: USER_ID })]);
  });

  it('sends nothing when the account was already welcomed', async () => {
    const mailer = new RecordingMailer();
    const { service, tx } = setup(mailer, 'ACTIVE');
    const view = await service.welcome({ ...user, status: 'ACTIVE' }, input);
    expect(view.status).toBe('ACTIVE');
    expect(tx.userAccount.updateMany).not.toHaveBeenCalled();
    expect(mailer.sent).toHaveLength(0);
  });

  it('sends nothing when a concurrent welcome moved the account first', async () => {
    const mailer = new RecordingMailer();
    const { service, tx } = setup(mailer);
    tx.userAccount.updateMany.mockResolvedValueOnce({ count: 0 });
    await service.welcome(user, input);
    expect(mailer.sent).toHaveLength(0);
    expect(tx.auditEvent.create).not.toHaveBeenCalled();
  });

  it('still completes the welcome when the send fails, and logs a warning without the address or body', async () => {
    const failure = Object.assign(new Error(`Mailbox unavailable for ${ADDRESS}: Welcome to Oxinov`), { responseCode: 550 });
    const send = jest.fn(() => Promise.reject(failure));
    const { service, lines, events } = setup({ enabled: true, send });

    const view = await service.welcome(user, input);

    expect(view).toMatchObject({ status: 'ACTIVE', welcomeRequired: false });
    expect(send).toHaveBeenCalledTimes(1);
    expect(events()).toEqual([
      expect.objectContaining({ level: 'warn', event: 'mail.welcome.failed', userId: USER_ID, errorName: 'Error', smtpStatus: 550 }),
    ]);
    const log = lines.join('\n');
    expect(log).not.toContain(ADDRESS);
    expect(log).not.toContain('Welcome to Oxinov');
    expect(log).not.toContain('Hello Mina');
  });

  it('still completes the welcome when the mailer throws synchronously', async () => {
    const mailer: Mailer = {
      enabled: true,
      send: () => {
        throw new TypeError('broken transport');
      },
    };
    const { service, events } = setup(mailer);
    await expect(service.welcome(user, input)).resolves.toMatchObject({ status: 'ACTIVE' });
    expect(events()).toEqual([expect.objectContaining({ level: 'warn', event: 'mail.welcome.failed', errorName: 'TypeError' })]);
  });

  it('logs that email is off and sends nothing when the mailer is disabled', async () => {
    const send = jest.fn(() => Promise.resolve());
    const { service, events } = setup({ enabled: false, send });
    await expect(service.welcome(user, input)).resolves.toMatchObject({ status: 'ACTIVE' });
    expect(send).not.toHaveBeenCalled();
    expect(events()).toEqual([expect.objectContaining({ level: 'info', event: 'mail.welcome.skipped', reason: 'mail_disabled' })]);
  });
});
