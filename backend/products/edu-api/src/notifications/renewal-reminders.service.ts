import { Inject, Injectable, type OnApplicationBootstrap, type OnModuleDestroy } from '@nestjs/common';
import { LOGGER, type JsonLogger } from '@oxinov/server-kit';
import { APP_CONFIG, type AppConfig } from '../config/app-config';
import { DatabaseContext } from '../database/database-context.service';
import { MAILER, type Mailer } from './mailer';
import { NotificationsService } from './notifications.service';
import { accessEnds, reminderKey, reminderStage } from './renewal-rules';
import { renewalMail } from './templates';

const DAY = 24 * 60 * 60 * 1000;
/** First sweep a minute after start, so a deploy never delays sign-in or health checks. */
const FIRST_RUN_MS = 60_000;

export interface SweepResult {
  notified: number;
  emailed: number;
}

/**
 * Renewal reminders (FR-COMM-704; ADR-028 point 9). Every hour the API checks the seller workspaces'
 * time-limited access: 7 days and 1 day before it ends the learner gets an in-app notice and an email, and
 * when it has ended, an in-app notice. Each reminder has a unique key per stage, course, and end date, so a
 * restart, a second replica, or a repeated sweep never notifies or emails twice; renewing moves the end
 * date and starts fresh reminders.
 */
@Injectable()
export class RenewalRemindersService implements OnApplicationBootstrap, OnModuleDestroy {
  private timers: NodeJS.Timeout[] = [];

  constructor(
    private readonly db: DatabaseContext,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
    @Inject(MAILER) private readonly mailer: Mailer,
    @Inject(LOGGER) private readonly logger: JsonLogger,
  ) {}

  onApplicationBootstrap(): void {
    if (!this.config.reminders.enabled) return;
    const run = () => {
      this.sweep().catch((error: unknown) => this.logger.event('error', 'reminders.failed', { error: error instanceof Error ? error.name : 'unknown' }));
    };
    const first = setTimeout(run, FIRST_RUN_MS);
    const every = setInterval(run, this.config.reminders.intervalMinutes * 60_000);
    first.unref();
    every.unref();
    this.timers = [first, every];
  }

  onModuleDestroy(): void {
    for (const timer of this.timers) clearTimeout(timer);
  }

  /** One pass over every seller workspace; `now` is a parameter so tests choose the clock. */
  async sweep(now: Date = new Date()): Promise<SweepResult> {
    const total: SweepResult = { notified: 0, emailed: 0 };
    for (const tenantId of this.config.payments.sellerTenantIds) {
      const result = await this.sweepTenant(tenantId, now);
      total.notified += result.notified;
      total.emailed += result.emailed;
    }
    if (total.notified > 0) this.logger.event('info', 'reminders.sent', { ...total });
    return total;
  }

  private async sweepTenant(tenantId: string, now: Date): Promise<SweepResult> {
    const result: SweepResult = { notified: 0, emailed: 0 };
    const rows = await this.db.run({ tenantId }, (tx) =>
      tx.entitlement.findMany({
        where: {
          tenantId,
          revokedAt: null,
          enrollment: { status: 'ACTIVE' },
          OR: [{ endsAt: null }, { endsAt: { gte: new Date(now.getTime() - 3 * DAY) } }],
        },
        select: { userId: true, courseId: true, endsAt: true },
        take: 20_000,
      }),
    );
    const due = accessEnds(rows)
      .map((entry) => ({ ...entry, stage: reminderStage(entry.endsAt, now) }))
      .filter((entry) => entry.stage !== null);
    if (due.length === 0) return result;

    const web = this.config.payments.webUrl;
    for (const entry of due) {
      const stage = entry.stage!;
      // Each reminder commits on its own, so one failure never blocks the rest.
      const mail = await this.db.run({ tenantId }, async (tx) => {
        const [course, profile] = await Promise.all([
          tx.course.findFirst({ where: { id: entry.courseId, tenantId }, select: { slug: true, publishedVersion: { select: { title: true } } } }),
          tx.userProfile.findUnique({ where: { id: entry.userId }, select: { email: true } }),
        ]);
        const title = course?.publishedVersion?.title ?? 'your course';
        const renewPath = course ? `/o/${course.slug}` : '/';
        const created = await NotificationsService.create(tx, {
          tenantId,
          userId: entry.userId,
          kind: stage === 'ENDED' ? 'ACCESS_ENDED' : 'RENEWAL_DUE',
          title:
            stage === 'ENDED'
              ? `Your access to ${title} has ended`
              : `Your access to ${title} ends ${stage === 'DAYS_1' ? 'tomorrow' : 'in 7 days'}`,
          body:
            stage === 'ENDED'
              ? 'Your progress, notes, and certificates are kept. Renew to unlock the lessons again.'
              : 'Renew now and the new time is added to the end of your current plan.',
          linkPath: renewPath,
          dedupeKey: reminderKey(stage, entry.courseId, entry.endsAt),
        });
        if (!created) return null;
        return stage === 'ENDED' || !profile?.email ? { sent: false } : { sent: true, to: profile.email, title, renewUrl: `${web}${renewPath}` };
      });
      if (!mail) continue;
      result.notified += 1;
      if (mail.sent && mail.to && mail.title && mail.renewUrl) {
        try {
          await this.mailer.send(
            renewalMail({ to: mail.to, courseTitle: mail.title, endsAt: entry.endsAt, daysLeft: stage === 'DAYS_1' ? 1 : 7, renewUrl: mail.renewUrl, support: this.config.mail.supportAddress }),
          );
          result.emailed += 1;
        } catch (error) {
          // The in-app notice stands; email never decides the outcome and is not retried.
          this.logger.event('warn', 'mail.failed', { trigger: 'renewal.reminder', error: error instanceof Error ? error.name : 'unknown' });
        }
      }
    }
    return result;
  }
}
