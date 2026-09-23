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
