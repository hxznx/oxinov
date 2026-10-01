import type { INestApplication } from '@nestjs/common';
import Ajv2020 from 'ajv/dist/2020';
import addFormats from 'ajv-formats';
import { exportJWK, generateKeyPair, SignJWT, createLocalJWKSet, type JWTVerifyGetKey } from 'jose';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { Client } from 'pg';
import request from 'supertest';
import { createApp } from '../src/app.factory';
import { JsonLogger, type SecurityEvent } from '@oxinov/server-kit';
import type { Mailer } from '../src/notifications/mailer';
import { loadConfig } from '../src/config/app-config';
import type { PaymentProviders } from '../src/payments/providers';

const ROOT = path.resolve(__dirname, '../../../..');

/** Deterministic IDs from database/products/edu/seeds/dev_seed.sql. */
export const SEED = {
  sakura: 'aaaaaaaa-0000-4000-8000-000000000001',
  everest: 'bbbbbbbb-0000-4000-8000-000000000001',
  freeCourse: 'aaaaaaaa-0000-4000-8000-000000000201',
  paidCourse: 'aaaaaaaa-0000-4000-8000-000000000202',
  draftCourse: 'aaaaaaaa-0000-4000-8000-000000000203',
  everestCourse: 'bbbbbbbb-0000-4000-8000-000000000201',
  freePreviewLesson: 'aaaaaaaa-0000-4000-8000-000000000451',
  freeLesson: 'aaaaaaaa-0000-4000-8000-000000000452',
  paidPreviewLesson: 'aaaaaaaa-0000-4000-8000-000000000454',
  paidLesson: 'aaaaaaaa-0000-4000-8000-000000000455',
  practiceExam: 'aaaaaaaa-0000-4000-8000-000000000501',
  mockExam: 'aaaaaaaa-0000-4000-8000-000000000502',
  draftExam: 'aaaaaaaa-0000-4000-8000-000000000503',
  everestExam: 'bbbbbbbb-0000-4000-8000-000000000501',
  sakuraProgram: 'aaaaaaaa-0000-4000-8000-000000000101',
  everestProgram: 'bbbbbbbb-0000-4000-8000-000000000101',
  users: {
    sakuraOwner: 'dev|sakura-owner',
    instructor: 'dev|sakura-instructor',
    aiko: 'dev|learner-aiko',
    everestOwner: 'dev|everest-owner',
    bikash: 'dev|learner-bikash',
  },
} as const;

function ownerUrl(): string {
  const url = process.env.TEST_MIGRATION_DATABASE_URL;
  if (!url) throw new Error('TEST_MIGRATION_DATABASE_URL is required for integration tests');
  const name = new URL(url).pathname.replace(/^\//, '');
  if (!name.endsWith('_test')) {
    throw new Error(`Refusing to reset "${name}": the test database name must end in _test`);
  }
  if (!process.env.TEST_DATABASE_URL) throw new Error('TEST_DATABASE_URL is required');
  return url;
}

/** Owner-role SQL for arranging scenarios the API cannot create yet (e.g. paid entitlements). */
export async function ownerQuery<T extends Record<string, unknown> = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> {
  const client = new Client({ connectionString: ownerUrl() });
  await client.connect();
  try {
    return (await client.query<T>(sql, params)).rows;
  } finally {
    await client.end();
  }
}

/** Drops the schema, applies every migration in order, and loads the seed. */
export async function resetDatabase(): Promise<void> {
  const client = new Client({ connectionString: ownerUrl() });
  await client.connect();
  try {
    await client.query('DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;');
    const migrations = path.join(ROOT, 'database/products/edu/migrations');
    for (const folder of readdirSync(migrations).filter((name) => /^\d{14}_/.test(name)).sort()) {
      await client.query(readFileSync(path.join(migrations, folder, 'migration.sql'), 'utf8'));
    }
    await client.query(readFileSync(path.join(ROOT, 'database/products/edu/seeds/dev_seed.sql'), 'utf8'));
  } finally {
    await client.end();
  }
}

export interface TestContext {
  app: INestApplication;
  http: ReturnType<typeof request>;
  securityEvents: SecurityEvent[];
  logs: string[];
  /** Local development token (HS256). */
  devToken: (subject: string, options?: { emailVerified?: boolean }) => Promise<string>;
  /** Identity-provider style token (RS256, verified through the injected JWKS). */
  idpToken: (subject: string, claims?: Record<string, unknown>) => Promise<string>;
}

export async function createTestContext(options: { paymentProviders?: PaymentProviders; mailer?: Mailer } = {}): Promise<TestContext> {
  const config = loadConfig();
  const logs: string[] = [];
  const logger = new JsonLogger(
    { service: 'api', environment: config.environment, version: config.serviceVersion },
    (line) => logs.push(line),
  );
  const securityEvents: SecurityEvent[] = [];

  const { publicKey, privateKey } = await generateKeyPair('RS256');
  const jwk = { ...(await exportJWK(publicKey)), kid: 'test-key', alg: 'RS256' };
  const jwks: JWTVerifyGetKey = createLocalJWKSet({ keys: [jwk] });

  const app = await createApp({
    config,
    logger,
    jwks,
    securityEventSink: (event) => securityEvents.push(event),
    paymentProviders: options.paymentProviders,
    mailer: options.mailer,
  });
  await app.init();

  const secret = new TextEncoder().encode(config.auth.devJwtSecret);
  return {
    app,
    http: request(app.getHttpServer()),
    securityEvents,
    logs,
    devToken: (subject, options = {}) =>
      new SignJWT({ email_verified: options.emailVerified ?? true })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuer('oxinov-dev')
        .setSubject(subject)
        .setIssuedAt()
        .setExpirationTime('10m')
        .sign(secret),
    idpToken: (subject, claims = {}) =>
      new SignJWT(claims)
        .setProtectedHeader({ alg: 'RS256', kid: 'test-key' })
        .setIssuer(config.auth.issuer as string)
        .setSubject(subject)
        .setIssuedAt()
        .setExpirationTime('10m')
        .sign(privateKey),
  };
}

let validator: ReturnType<Ajv2020['compile']> | undefined;

/** Validates against security/soc/event-schema.json, the contract the SIEM pipeline consumes. */
export function assertValidSecurityEvent(event: unknown): void {
  if (!validator) {
    const ajv = new Ajv2020({ allErrors: true, strict: false });
    addFormats(ajv);
    const schema = JSON.parse(
      readFileSync(path.join(ROOT, 'security/soc/event-schema.json'), 'utf8'),
    ) as object;
    validator = ajv.compile(schema);
  }
  if (!validator(event)) {
    throw new Error(`Invalid security event: ${JSON.stringify(validator.errors)}`);
  }
  const forbidden = /(password|token|secret|cookie|authorization|raw_body|request_body|response_body|private_message|exam_answer|prompt)/i;
  const walk = (value: unknown, where: string): void => {
    if (value && typeof value === 'object') {
      for (const [key, child] of Object.entries(value)) {
        if (forbidden.test(key)) throw new Error(`Security event contains prohibited field ${where}.${key}`);
        walk(child, `${where}.${key}`);
      }
    }
  };
  walk(event, '$');
}
