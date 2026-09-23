import {
  type DynamicModule,
  type MiddlewareConsumer,
  Module,
  type NestModule,
  type Provider,
} from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import type { JWTVerifyGetKey } from 'jose';
import { AuthGuard } from './auth/auth.guard';
import { IdentityService } from './auth/identity.service';
import { JWKS_RESOLVER, TokenVerifier } from './auth/token-verifier';
import { CatalogController } from './catalog/catalog.controller';
import { CatalogService } from './catalog/catalog.service';
import { HttpExceptionFilter } from './common/http-exception.filter';
import { JsonLogger } from './common/json-logger';
import { LOGGER } from './common/tokens';
import { APP_CONFIG, type AppConfig } from './config/app-config';
import { DatabaseContext } from './database/database-context.service';
import { PrismaService } from './database/prisma.service';
import { ExamsController } from './exams/exams.controller';
import { ExamsService } from './exams/exams.service';
import { HealthController } from './health/health.controller';
import { EnrollmentsController } from './learning/enrollments.controller';
import { EnrollmentsService } from './learning/enrollments.service';
import { MetricsService } from './observability/metrics.service';
import { RequestContextMiddleware } from './observability/request-context.middleware';
import {
  SECURITY_EVENT_SINK,
  SecurityEventsService,
  stdoutSecuritySink,
  type SecurityEventSink,
} from './observability/security-events.service';
import { TenantGuard } from './tenancy/tenant.guard';
import { TenantsController } from './tenants/tenants.controller';
import { TenantsService } from './tenants/tenants.service';

export interface AppModuleOptions {
  config: AppConfig;
  logger: JsonLogger;
  /** Tests inject a local key set instead of fetching the identity provider's JWKS. */
  jwks?: JWTVerifyGetKey;
  securityEventSink?: SecurityEventSink;
}

/**
 * Single module for the first slice. Split into feature modules (tenancy, catalog, learning,
 * exams, billing) once each gains enough providers to justify its own boundary.
 */
@Module({})
export class AppModule implements NestModule {
  static forRoot(options: AppModuleOptions): DynamicModule {
    const providers: Provider[] = [
      { provide: APP_CONFIG, useValue: options.config },
      { provide: LOGGER, useValue: options.logger },
      { provide: JWKS_RESOLVER, useValue: options.jwks ?? null },
      { provide: SECURITY_EVENT_SINK, useValue: options.securityEventSink ?? stdoutSecuritySink },
      { provide: APP_GUARD, useClass: AuthGuard },
      { provide: APP_FILTER, useClass: HttpExceptionFilter },
      PrismaService,
      DatabaseContext,
      MetricsService,
      SecurityEventsService,
      TokenVerifier,
      IdentityService,
      TenantGuard,
      TenantsService,
      CatalogService,
      EnrollmentsService,
      ExamsService,
    ];
    return {
      module: AppModule,
      controllers: [
        HealthController,
        TenantsController,
        CatalogController,
        EnrollmentsController,
        ExamsController,
      ],
      providers,
    };
  }

  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestContextMiddleware).forRoutes('*path');
  }
}
