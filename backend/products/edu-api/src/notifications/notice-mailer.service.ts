import { Inject, Injectable } from '@nestjs/common';
import { LOGGER, type JsonLogger } from '@oxinov/server-kit';
import { APP_CONFIG, type AppConfig } from '../config/app-config';
import { DatabaseContext } from '../database/database-context.service';
import { BULK, allowanceDay, grantable, renewalFromKey, waitingCutoff } from './allowance-rules';
import { MAILER, type Mailer } from './mailer';
import { noticeMail, renewalMail } from './templates';

/** Most emails one flush sends, so a sweep never runs for long. */
const FLUSH_BATCH = 500;

export interface Allowance {
  limit: number;
  used: number;
  remaining: number;
}

/**
 * The email allowance (FR-COMM-705). Reminders and notices that should also be emailed are notifications
 * marked `emailWanted`; `flush` sends as many as today's share allows, oldest first, and leaves the rest for
 * the next day. Sign-in codes (sent by Keycloak) and payment and account emails never use this share. The
 * counter is reserved before sending, so concurrent flushes never exceed the share.
 */
@Injectable()
export class NoticeMailer {
  constructor(
    private readonly db: DatabaseContext,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
    @Inject(MAILER) private readonly mailer: Mailer,
    @Inject(LOGGER) private readonly logger: JsonLogger,
  ) {}

  /** Today's share for reminders and notices. */
  async allowance(now: Date = new Date()): Promise<Allowance> {
    const limit = this.config.mail.bulkDailyLimit;
    const rows = await this.db.run({}, (tx) =>
      tx.emailDailyUsage.findMany({ where: { day: new Date(`${allowanceDay(now)}T00:00:00Z`), category: BULK }, select: { sent: true } }),
    );
    const used = rows[0]?.sent ?? 0;
    return { limit, used, remaining: Math.max(0, limit - used) };
  }

  /**
   * Sends the workspace's waiting emails within today's share; returns how many were sent. `now` chooses the
   * allowance day (tests pass a clock); waiting age is measured on the real clock, like `createdAt`.
   */
  async flush(tenantId: string, now: Date = new Date()): Promise<number> {
    const { remaining } = await this.allowance(now);
    if (remaining === 0) return 0;
    const waiting = await this.db.run({ tenantId }, (tx) =>
      tx.notification.findMany({
        where: { tenantId, emailWanted: true, emailedAt: null, createdAt: { gte: waitingCutoff(new Date()) } },
        orderBy: { createdAt: 'asc' },
        take: Math.min(remaining, FLUSH_BATCH),
        select: { id: true, kind: true, title: true, body: true, linkPath: true, dedupeKey: true, user: { select: { email: true } } },
      }),
    );
    const granted = await this.reserve(waiting.length, now);
    if (granted === 0) return 0;
    const web = this.config.payments.webUrl;
    const support = this.config.mail.supportAddress;
    let sent = 0;
    for (const item of waiting.slice(0, granted)) {
      // Marked first: a crash mid-send never emails the same notice twice.
      const claimed = await this.db.run({ tenantId }, (tx) => tx.notification.updateMany({ where: { id: item.id, tenantId, emailedAt: null }, data: { emailedAt: new Date() } }));
      if (claimed.count === 0 || !item.user.email) continue;
      const url = `${web}${item.linkPath ?? '/account/notifications'}`;
      const renewal = item.kind === 'RENEWAL_DUE' ? renewalFromKey(item.dedupeKey) : null;
      const mail = renewal
        ? renewalMail({ to: item.user.email, courseTitle: courseTitleFrom(item.title), endsAt: renewal.endsAt, daysLeft: renewal.daysLeft, renewUrl: url, support })
        : noticeMail({ to: item.user.email, title: item.title, body: item.body, url, support });
      try {
        await this.mailer.send(mail);
        sent += 1;
      } catch (error) {
        // The in-app notice stands; email never decides the outcome and is not retried.
        this.logger.event('warn', 'mail.failed', { trigger: `notice.${item.kind.toLowerCase()}`, error: error instanceof Error ? error.name : 'unknown' });
      }
    }
    return sent;
  }

  /** Takes up to `wanted` emails from today's share and returns how many it got. */
  private reserve(wanted: number, now: Date): Promise<number> {
    if (wanted === 0) return Promise.resolve(0);
    const limit = this.config.mail.bulkDailyLimit;
    const day = new Date(`${allowanceDay(now)}T00:00:00Z`);
    return this.db.run({}, async (tx) => {
      await tx.emailDailyUsage.upsert({ where: { day_category: { day, category: BULK } }, create: { day, category: BULK, sent: 0 }, update: {} });
      // Lock today's counter so two flushes cannot both take the last emails.
      const [row] = await tx.$queryRaw<{ sent: number }[]>`SELECT "sent" FROM "email_daily_usage" WHERE "day" = ${day} AND "category" = ${BULK} FOR UPDATE`;
      const granted = grantable(wanted, limit, row?.sent ?? 0);
      if (granted > 0) await tx.emailDailyUsage.update({ where: { day_category: { day, category: BULK } }, data: { sent: { increment: granted } } });
      return granted;
    });
  }
}

/** "Your access to {title} ends in 7 days" → {title}, for the renewal email's wording. */
function courseTitleFrom(noticeTitle: string): string {
  return /^Your access to (.+) ends /.exec(noticeTitle)?.[1] ?? 'your course';
}
