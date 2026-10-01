import { type DynamicModule, type MiddlewareConsumer, Module, type NestModule, type Provider } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import {
  APP_CONFIG,
  AuthGuard,
  HttpExceptionFilter,
  HttpMetrics,
  IDENTITY_RESOLVER,
  JWKS_RESOLVER,
  JsonLogger,
  LOGGER,
  RateLimitMiddleware,
  RequestContextMiddleware,
  SECURITY_EVENT_SINK,
  SecurityEventsService,
  SecurityHeadersMiddleware,
  TokenVerifier,
  stdoutSecuritySink,
  type SecurityEventSink,
  type ServiceConfig,
} from '@oxinov/server-kit';
import type { JWTVerifyGetKey } from 'jose';
import { AccountsService } from './accounts/accounts.service';
import { ActiveAccountGuard } from './accounts/active-account.guard';
import { IdentityService } from './accounts/identity.service';
import { MeController } from './accounts/me.controller';
import { CatalogController } from './catalog/catalog.controller';
import { DatabaseContext } from './database/database-context.service';
import { PrismaService } from './database/prisma.service';
import { HealthController } from './health/health.controller';
import { MAILER, type Mailer } from './mail/mailer';
import { WelcomeEmailService } from './mail/welcome-email.service';

export interface AppModuleOptions {
  config: ServiceConfig;
  logger: JsonLogger;
  /** Tests inject a local key set instead of fetching the identity provider's JWKS. */
  jwks?: JWTVerifyGetKey;
  securityEventSink?: SecurityEventSink;
  /** Outgoing email (FR-NOTIF-2903): SMTP to the mail relay, disabled, or a test fake. */
  mailer: Mailer;
}

/** Platform control plane, first slice: accounts, policies, product catalogue, entitlements. */
@Module({})
export class AppModule implements NestModule {
  static forRoot(options: AppModuleOptions): DynamicModule {
    const providers: Provider[] = [
      { provide: APP_CONFIG, useValue: options.config },
      { provide: LOGGER, useValue: options.logger },
      { provide: JWKS_RESOLVER, useValue: options.jwks ?? null },
      { provide: SECURITY_EVENT_SINK, useValue: options.securityEventSink ?? stdoutSecuritySink },
      { provide: MAILER, useValue: options.mailer },
      { provide: APP_GUARD, useClass: AuthGuard },
      { provide: APP_FILTER, useClass: HttpExceptionFilter },
      PrismaService,
      DatabaseContext,
      HttpMetrics,
      SecurityEventsService,
      TokenVerifier,
      IdentityService,
      { provide: IDENTITY_RESOLVER, useExisting: IdentityService },
      WelcomeEmailService,
      AccountsService,
      ActiveAccountGuard,
    ];
    return {
      module: AppModule,
      controllers: [HealthController, MeController, CatalogController],
      providers,
    };
  }

  configure(consumer: MiddlewareConsumer): void {
    // Request ID first so throttled responses still carry one.
    consumer.apply(RequestContextMiddleware, SecurityHeadersMiddleware, RateLimitMiddleware).forRoutes('*path');
  }
}
