import { Injectable } from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client';
import { PrismaService } from './prisma.service';

export type Tx = Prisma.TransactionClient;

export interface DbContext {
  /** Active workspace. Omit only for identity and workspace-listing operations. */
  tenantId?: string;
  /** Resolved user profile ID of the caller. */
  userId?: string;
  /** Identity-provider subject; used only while resolving the caller's profile. */
  authSubject?: string;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The only way request code touches tenant data. Each call runs in one transaction on one pooled
 * connection and sets PostgreSQL context with set_config(..., true), which is transaction-local,
 * so context can never leak to the next request that borrows the connection. Row-level security
 * then filters every statement; application checks remain the first boundary.
 */
@Injectable()
export class DatabaseContext {
  constructor(private readonly prisma: PrismaService) {}

  run<T>(context: DbContext, work: (tx: Tx) => Promise<T>): Promise<T> {
    for (const key of ['tenantId', 'userId'] as const) {
      const value = context[key];
      if (value !== undefined && !UUID.test(value)) {
        throw new Error(`DatabaseContext.${key} must be a UUID`);
      }
    }
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT
        set_config('app.tenant_id', ${context.tenantId ?? ''}, true),
        set_config('app.user_id', ${context.userId ?? ''}, true),
        set_config('app.auth_subject', ${context.authSubject ?? ''}, true)`;
      return work(tx);
    });
  }

  /** Readiness probe: proves the pool can reach PostgreSQL. */
  async ping(): Promise<void> {
    await this.prisma.$queryRaw`SELECT 1`;
  }
}
