import { Injectable } from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client';
import { PrismaService } from './prisma.service';

export type Tx = Prisma.TransactionClient;

export interface DbContext {
  /** Resolved Oxinov account ID of the caller. */
  userId?: string;
  /** Identity-provider subject; used only while resolving the caller's account. */
  authSubject?: string;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The only way request code touches person-owned data. Each call runs in one transaction and sets
 * PostgreSQL context with set_config(..., true), which is transaction-local, so context never leaks
 * to the next request on a pooled connection. Row-level security then filters every statement.
 */
@Injectable()
export class DatabaseContext {
  constructor(private readonly prisma: PrismaService) {}

  run<T>(context: DbContext, work: (tx: Tx) => Promise<T>): Promise<T> {
    if (context.userId !== undefined && !UUID.test(context.userId)) {
      throw new Error('DatabaseContext.userId must be a UUID');
    }
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT
        set_config('app.user_id', ${context.userId ?? ''}, true),
        set_config('app.auth_subject', ${context.authSubject ?? ''}, true)`;
      return work(tx);
    });
  }

  /** Global catalogues (products, policies) need no person context. */
  catalog<T>(work: (client: PrismaService) => Promise<T>): Promise<T> {
    return work(this.prisma);
  }

  /** Readiness probe: proves the pool can reach PostgreSQL. */
  async ping(): Promise<void> {
    await this.prisma.$queryRaw`SELECT 1`;
  }
}
