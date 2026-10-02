import {
  type DynamicModule,
  type MiddlewareConsumer,
  Module,
  type NestModule,
  type Provider,
} from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import {
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
} from '@oxinov/server-kit';
import type { JWTVerifyGetKey } from 'jose';
import { IdentityService } from './auth/identity.service';
import { CatalogController } from './catalog/catalog.controller';
import { CatalogService } from './catalog/catalog.service';
import { APP_CONFIG, type AppConfig } from './config/app-config';
import { DatabaseContext } from './database/database-context.service';
import { PrismaService } from './database/prisma.service';
import { ExamsController } from './exams/exams.controller';
import { ExamsService } from './exams/exams.service';
import { HealthController } from './health/health.controller';
import { EnrollmentsController } from './learning/enrollments.controller';
import { EnrollmentsService } from './learning/enrollments.service';
import { MetricsService } from './observability/metrics.service';
import { TenantGuard } from './tenancy/tenant.guard';
import { AuthoringController } from './authoring/authoring.controller';
import { AuthoringService } from './authoring/authoring.service';
import { AssignmentsLearningController, AssignmentsTeachingController } from './assignments/assignments.controller';
import { AssignmentsService } from './assignments/assignments.service';
import { MediaController } from './media/media.controller';
import { NotesController } from './notes/notes.controller';
import { NotesService } from './notes/notes.service';
import { StreamController } from './stream/stream.controller';
import { StreamService } from './stream/stream.service';
import { QuizzesController } from './quizzes/quizzes.controller';
import { QuizzesService } from './quizzes/quizzes.service';
import { MediaService } from './media/media.service';
import { CertificatesController, CertificateVerificationController } from './certificates/certificates.controller';
import { CertificatesService } from './certificates/certificates.service';
import { MAILER, SmtpMailer, type Mailer } from './notifications/mailer';
import { PaymentsController } from './payments/payments.controller';
import { PaymentsService } from './payments/payments.service';
import { PAYMENT_PROVIDERS, providersFromConfig, type PaymentProviders } from './payments/providers';
import { ObjectStorage } from './media/object-storage';
import { InviteRedemptionController, TenantInvitesController } from './tenants/invites.controller';
import { InvitesService } from './tenants/invites.service';
import { StoreController } from './store/store.controller';
import { StoreService } from './store/store.service';
import { ListingController, StoreJoinController, StorefrontController } from './store/storefront.controller';
import { StorefrontService } from './store/storefront.service';
import { LiveSessionsController } from './live/live-sessions.controller';
import { MeController } from './account/me.controller';
import { NotificationsController } from './notifications/notifications.controller';
import { NotificationsService } from './notifications/notifications.service';
import { RenewalRemindersService } from './notifications/renewal-reminders.service';
import { LiveSessionsService } from './live/live-sessions.service';
import { TenantsController } from './tenants/tenants.controller';
import { TenantsService } from './tenants/tenants.service';

export interface AppModuleOptions {
  config: AppConfig;
  logger: JsonLogger;
  /** Tests inject a local key set instead of fetching the identity provider's JWKS. */
  jwks?: JWTVerifyGetKey;
  securityEventSink?: SecurityEventSink;
  /** Tests replace Khalti and eSewa with fakes; by default the providers come from the configuration. */
  paymentProviders?: PaymentProviders;
  /** Tests capture email instead of sending it through the mail relay. */
  mailer?: Mailer;
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
      // Shared middleware records HTTP metrics through the base class.
      { provide: HttpMetrics, useExisting: MetricsService },
      SecurityEventsService,
      TokenVerifier,
      IdentityService,
      { provide: IDENTITY_RESOLVER, useExisting: IdentityService },
      TenantGuard,
      TenantsService,
      InvitesService,
      AuthoringService,
      ObjectStorage,
      MediaService,
      QuizzesService,
      AssignmentsService,
      NotesService,
      StreamService,
      CatalogService,
      EnrollmentsService,
      ExamsService,
      { provide: PAYMENT_PROVIDERS, useValue: options.paymentProviders ?? providersFromConfig(options.config.payments) },
      PaymentsService,
      options.mailer ? { provide: MAILER, useValue: options.mailer } : { provide: MAILER, useClass: SmtpMailer },
      StoreService,
      StorefrontService,
      LiveSessionsService,
      NotificationsService,
      RenewalRemindersService,
      CertificatesService,
    ];
    return {
      module: AppModule,
      controllers: [
        HealthController,
        TenantsController,
        TenantInvitesController,
        InviteRedemptionController,
        CatalogController,
        AuthoringController,
        MediaController,
        QuizzesController,
        AssignmentsTeachingController,
        AssignmentsLearningController,
        NotesController,
        StreamController,
        EnrollmentsController,
        ExamsController,
        PaymentsController,
        StoreController,
        StorefrontController,
        StoreJoinController,
        ListingController,
        LiveSessionsController,
        MeController,
        NotificationsController,
        CertificatesController,
        CertificateVerificationController,
      ],
      providers,
    };
  }

  configure(consumer: MiddlewareConsumer): void {
    // Request ID first so throttled responses still carry one.
    consumer
      .apply(RequestContextMiddleware, SecurityHeadersMiddleware, RateLimitMiddleware)
      .forRoutes('*path');
  }
}
