// Integration tests run against a real PostgreSQL database that they reset. To protect
// development data, the database name must end in "_test".
//   TEST_DATABASE_URL            oxinov_app role (RLS enforced) — used by the API under test
//   TEST_MIGRATION_DATABASE_URL  owner role — used only to reset, migrate, and seed
import 'dotenv/config';

process.env.NODE_ENV = 'test';
process.env.DEPLOY_ENVIRONMENT = 'ci';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? '';
process.env.AUTH_DEV_JWT_SECRET = 'integration-test-secret-0123456789abcdef';
process.env.AUTH_ISSUER = 'https://identity.test.oxinov.example';
process.env.AUTH_JWKS_URL = 'https://identity.test.oxinov.example/.well-known/jwks.json';
delete process.env.AUTH_AUDIENCE;
// Suites send many requests from one address; http-hardening.e2e-spec.ts enables the limiter itself.
process.env.RATE_LIMIT_PER_MINUTE = '0';
// Paid-course checkout (ADR-023): the Sakura school may sell; providers are fakes in test/payments.e2e-spec.ts.
process.env.PAYMENTS_SELLER_TENANT_IDS = 'aaaaaaaa-0000-4000-8000-000000000001';
process.env.EDU_WEB_URL = 'https://edu.test.oxinov.example';
// Tests run the renewal reminder sweep themselves with a chosen clock (test/notifications.e2e-spec.ts).
process.env.RENEWAL_REMINDERS = 'off';
delete process.env.KHALTI_SECRET_KEY;
delete process.env.ESEWA_PRODUCT_CODE;
delete process.env.ESEWA_SECRET_KEY;
// Lesson media runs against a real S3-compatible server when TEST_MEDIA_S3_ENDPOINT is set (CI starts
// SeaweedFS); otherwise media is disabled and test/media.e2e-spec.ts is skipped.
if (process.env.TEST_MEDIA_S3_ENDPOINT) {
  process.env.MEDIA_BUCKET = process.env.TEST_MEDIA_BUCKET ?? 'oxinov-lesson-media-test';
  process.env.MEDIA_S3_ENDPOINT = process.env.TEST_MEDIA_S3_ENDPOINT;
  process.env.AWS_ACCESS_KEY_ID = process.env.TEST_MEDIA_ACCESS_KEY ?? '';
  process.env.AWS_SECRET_ACCESS_KEY = process.env.TEST_MEDIA_SECRET_KEY ?? '';
} else {
  delete process.env.MEDIA_BUCKET;
  delete process.env.MEDIA_S3_ENDPOINT;
}
