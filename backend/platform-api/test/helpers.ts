import type { INestApplication } from '@nestjs/common';
import { JsonLogger, type SecurityEvent } from '@oxinov/server-kit';
import Ajv2020 from 'ajv/dist/2020';
import addFormats from 'ajv-formats';
import { exportJWK, generateKeyPair, SignJWT, createLocalJWKSet, type JWTVerifyGetKey } from 'jose';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { Client } from 'pg';
import request from 'supertest';
import { createApp } from '../src/app.factory';
import { loadConfig } from '../src/config';

const ROOT = path.resolve(__dirname, '../../..');

/** Deterministic IDs from database/platform/seeds/dev_seed.sql. */
export const SEED = {
  asha: { id: '11111111-0000-4000-8000-000000000001', subject: 'dev|member-asha' },
  bibek: { id: '11111111-0000-4000-8000-000000000002', subject: 'dev|member-bibek' },
} as const;

export const CURRENT_POLICIES = [
  { policyId: 'privacy', version: 1 },
  { policyId: 'terms', version: 1 },
];

function ownerUrl(): string {
  const url = process.env.TEST_MIGRATION_DATABASE_URL;
  if (!url) throw new Error('TEST_MIGRATION_DATABASE_URL is required for integration tests');
  const name = new URL(url).pathname.replace(/^\//, '');
  if (!name.endsWith('_test')) throw new Error(`Refusing to reset "${name}": the test database name must end in _test`);
  if (!process.env.TEST_DATABASE_URL) throw new Error('TEST_DATABASE_URL is required');
  return url;
}

/** Owner-role SQL for arranging scenarios the API deliberately cannot perform (e.g. launching a product). */
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

/** Drops the schema, applies every platform migration in order, and loads the seed. */
export async function resetDatabase(): Promise<void> {
  const client = new Client({ connectionString: ownerUrl() });
  await client.connect();
  try {
    await client.query('DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;');
    const migrations = path.join(ROOT, 'database/platform/migrations');
    for (const folder of readdirSync(migrations).filter((name) => /^\d{14}_/.test(name)).sort()) {
      await client.query(readFileSync(path.join(migrations, folder, 'migration.sql'), 'utf8'));
    }
    await client.query(readFileSync(path.join(ROOT, 'database/platform/seeds/dev_seed.sql'), 'utf8'));
  } finally {
    await client.end();
  }
}

export interface TestContext {
  app: INestApplication;
  http: ReturnType<typeof request>;
  securityEvents: SecurityEvent[];
  /** Identity-provider style token (RS256) for this API's audience unless overridden. */
  token: (subject: string, claims?: Record<string, unknown>) => Promise<string>;
}

export async function createTestContext(): Promise<TestContext> {
  const config = loadConfig();
  const logger = new JsonLogger({ service: 'platform', environment: config.environment, version: config.serviceVersion }, () => undefined);
  const securityEvents: SecurityEvent[] = [];

  const { publicKey, privateKey } = await generateKeyPair('RS256');
  const jwk = { ...(await exportJWK(publicKey)), kid: 'test-key', alg: 'RS256' };
  const jwks: JWTVerifyGetKey = createLocalJWKSet({ keys: [jwk] });

  const app = await createApp({ config, logger, jwks, securityEventSink: (event) => securityEvents.push(event) });
  await app.init();

  return {
    app,
    http: request(app.getHttpServer()),
    securityEvents,
    token: (subject, claims = {}) =>
      new SignJWT({ aud: config.auth.audience, email_verified: true, ...claims })
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
    validator = ajv.compile(JSON.parse(readFileSync(path.join(ROOT, 'security/soc/event-schema.json'), 'utf8')) as object);
  }
  if (!validator(event)) throw new Error(`Invalid security event: ${JSON.stringify(validator.errors)}`);
}
