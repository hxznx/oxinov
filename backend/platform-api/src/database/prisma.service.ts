import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { APP_CONFIG, type ServiceConfig } from '@oxinov/server-kit';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

/**
 * Prisma client connected as the least-privilege request role (DATABASE_URL). Person-owned data
 * must be read through DatabaseContext, which sets row-level-security context per transaction.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor(@Inject(APP_CONFIG) config: ServiceConfig) {
    super({ adapter: new PrismaPg({ connectionString: config.databaseUrl }) });
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
