import 'reflect-metadata';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { buildOpenApi, createApp } from './app.factory';
import { JsonLogger } from '@oxinov/server-kit';
import { loadConfig } from './config/app-config';

/**
 * Writes the OpenAPI contract to packages/contracts/openapi.json for web/mobile client
 * generation and CI contract diffs (docs/api/API-VERSIONING.md). No database connection is made.
 */
async function main(): Promise<void> {
  const config = loadConfig({
    ...process.env,
    DATABASE_URL: process.env.DATABASE_URL ?? 'postgresql://unused@localhost/unused',
    AUTH_DEV_JWT_SECRET: process.env.AUTH_DEV_JWT_SECRET ?? 'openapi-generation-only-secret-000000',
  });
  const logger = new JsonLogger({ service: 'api', environment: config.environment, version: config.serviceVersion }, () => undefined);
  const app = await createApp({ config, logger });
  const document = buildOpenApi(app, config.serviceVersion);
  const target = path.resolve(__dirname, '../../../packages/contracts/openapi.json');
  writeFileSync(target, `${JSON.stringify(document, null, 2)}\n`);
  await app.close();
  process.stdout.write(`OpenAPI written to ${target}\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
  process.exit(1);
});
