import { Injectable } from '@nestjs/common';
import { Errors } from '../common/errors';
import type { AuthUser, TenantScope } from '../common/request';
import { DatabaseContext, type Tx } from '../database/database-context.service';
import { NotificationsService } from '../notifications/notifications.service';
import type { LearnerSupportDto, SupportMessageDto, SupportThreadDto, SupportThreadSummaryDto } from './support.dto';

/** A learner may send this many messages an hour, so the inbox cannot be flooded. */
const LEARNER_MESSAGES_PER_HOUR = 20;
const THREAD_MESSAGES = 200;
const INBOX_THREADS = 200;

type ThreadRow = { lastMessageAt: Date; learnerReadAt: Date | null; staffReadAt: Date | null };
const unreadFor = (readAt: Date | null, thread: ThreadRow) => readAt === null || readAt < thread.lastMessageAt;

/**
 * Support messages (FR-CHAT-1301, learner-to-support; FR-AUTH-104 Messages). Each learner has one private
 * thread per workspace; the workspace's administrators answer from the Studio inbox and the learner gets an
 * in-app notice for each reply. Row-level security limits a learner to their own thread. Posting a message
 * sets the sender's read time to the message time, so only the other side sees it as unread.
 */
@Injectable()
export class SupportService {
  constructor(private readonly db: DatabaseContext) {}

  /** The learner's own thread, newest messages last; reading it clears their unread marker. */
  mine(scope: TenantScope, user: AuthUser): Promise<LearnerSupportDto> {
    return this.db.run({ tenantId: scope.tenantId, userId: user.userId }, async (tx) => {
      const thread = await tx.supportThread.findUnique({ where: { tenantId_userId: { tenantId: scope.tenantId, userId: user.userId } } });
      if (!thread) return { threadId: null, unread: false, messages: [] };
      const unread = unreadFor(thread.learnerReadAt, thread);
      if (unread) await tx.supportThread.update({ where: { id: thread.id }, data: { learnerReadAt: new Date() } });
      return { threadId: thread.id, unread, messages: await this.messages(tx, scope.tenantId, thread.id) };
    });
  }

  /** Whether support has replied since the learner last looked, for menu badges. */
  learnerUnread(scope: TenantScope, user: AuthUser): Promise<boolean> {
    return this.db.run({ tenantId: scope.tenantId, userId: user.userId }, async (tx) => {
      const thread = await tx.supportThread.findUnique({ where: { tenantId_userId: { tenantId: scope.tenantId, userId: user.userId } } });
      return thread ? unreadFor(thread.learnerReadAt, thread) : false;
    });
  }

  /** The learner writes to support; the thread starts with their first message. */
  send(scope: TenantScope, user: AuthUser, body: string): Promise<LearnerSupportDto> {
    return this.db.run({ tenantId: scope.tenantId, userId: user.userId }, async (tx) => {
      const now = new Date();
      const thread = await tx.supportThread.upsert({
        where: { tenantId_userId: { tenantId: scope.tenantId, userId: user.userId } },
        create: { tenantId: scope.tenantId, userId: user.userId, lastMessageAt: now, learnerReadAt: now },
        update: {},
      });
      const recent = await tx.supportMessage.count({
        where: { tenantId: scope.tenantId, threadId: thread.id, sender: 'LEARNER', createdAt: { gt: new Date(now.getTime() - 60 * 60 * 1000) } },
      });
      if (recent >= LEARNER_MESSAGES_PER_HOUR) throw Errors.conflict('You have sent many messages this hour. Support will reply soon; try again later.');
      await tx.supportMessage.create({ data: { tenantId: scope.tenantId, threadId: thread.id, authorUserId: user.userId, sender: 'LEARNER', body, createdAt: now } });
      await tx.supportThread.update({ where: { id: thread.id }, data: { lastMessageAt: now, learnerReadAt: now } });
      return { threadId: thread.id, unread: false, messages: await this.messages(tx, scope.tenantId, thread.id) };
    });
  }

  /** Administrators: every thread, most recent first, with an unread marker. */
  inbox(scope: TenantScope, user: AuthUser): Promise<SupportThreadSummaryDto[]> {
    return this.db.run({ tenantId: scope.tenantId, userId: user.userId }, async (tx) => {
      const threads = await tx.supportThread.findMany({
        where: { tenantId: scope.tenantId },
        orderBy: { lastMessageAt: 'desc' },
        take: INBOX_THREADS,
        include: {
          user: { select: { displayName: true, email: true } },
          messages: { orderBy: { createdAt: 'desc' }, take: 1, select: { body: true, sender: true } },
        },
      });
      return threads.map((thread) => ({
        id: thread.id,
        learnerName: thread.user.displayName,
        learnerEmail: thread.user.email,
        lastMessage: thread.messages[0]?.body.slice(0, 140) ?? '',
        lastSender: thread.messages[0]?.sender ?? 'LEARNER',
        lastMessageAt: thread.lastMessageAt,
        unread: unreadFor(thread.staffReadAt, thread),
      }));
    });
  }

  /** Administrators: one thread; opening it clears the staff unread marker. */
  thread(scope: TenantScope, user: AuthUser, threadId: string): Promise<SupportThreadDto> {
    return this.db.run({ tenantId: scope.tenantId, userId: user.userId }, async (tx) => {
      const thread = await tx.supportThread.findFirst({ where: { id: threadId, tenantId: scope.tenantId }, include: { user: { select: { displayName: true, email: true } } } });
      if (!thread) throw Errors.notFound('Conversation');
      if (unreadFor(thread.staffReadAt, thread)) await tx.supportThread.update({ where: { id: thread.id }, data: { staffReadAt: new Date() } });
      return { id: thread.id, learnerName: thread.user.displayName, learnerEmail: thread.user.email, messages: await this.messages(tx, scope.tenantId, thread.id) };
    });
  }

  /** Administrators reply; the learner gets an in-app notice that links to Messages. */
  reply(scope: TenantScope, user: AuthUser, threadId: string, body: string): Promise<SupportThreadDto> {
    return this.db.run({ tenantId: scope.tenantId, userId: user.userId }, async (tx) => {
      const thread = await tx.supportThread.findFirst({ where: { id: threadId, tenantId: scope.tenantId }, include: { user: { select: { displayName: true, email: true } } } });
      if (!thread) throw Errors.notFound('Conversation');
      const now = new Date();
      const message = await tx.supportMessage.create({ data: { tenantId: scope.tenantId, threadId: thread.id, authorUserId: user.userId, sender: 'STAFF', body, createdAt: now } });
      await tx.supportThread.update({ where: { id: thread.id }, data: { lastMessageAt: now, staffReadAt: now } });
      await NotificationsService.create(tx, {
        tenantId: scope.tenantId,
        userId: thread.userId,
        kind: 'NOTICE',
        title: 'Oxinov support replied',
        body: body.slice(0, 200),
        linkPath: '/account/messages?c=support',
        dedupeKey: `support-reply:${message.id}`,
      });
      return { id: thread.id, learnerName: thread.user.displayName, learnerEmail: thread.user.email, messages: await this.messages(tx, scope.tenantId, thread.id) };
    });
  }

  private async messages(tx: Tx, tenantId: string, threadId: string): Promise<SupportMessageDto[]> {
    const rows = await tx.supportMessage.findMany({
      where: { tenantId, threadId },
      orderBy: { createdAt: 'desc' },
      take: THREAD_MESSAGES,
      select: { id: true, sender: true, body: true, createdAt: true, author: { select: { displayName: true } } },
    });
    // Learners see "Oxinov support" for every staff message, never which administrator wrote it.
    return rows.reverse().map((row) => ({ id: row.id, sender: row.sender, body: row.body, createdAt: row.createdAt, authorName: row.sender === 'STAFF' ? null : row.author.displayName }));
  }
}
