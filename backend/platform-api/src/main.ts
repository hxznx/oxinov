import 'reflect-metadata';
import { JsonLogger } from '@oxinov/server-kit';
import { createApp } from './app.factory';
import { loadConfig } from './config';
import { createMailer, loadMailConfig } from './mail/mailer';

async function bootstrap(): Promise<void> {
  const config = loadConfig();
  const logger = new JsonLogger({ service: 'platform', environment: config.environment, version: config.serviceVersion });
  const mailer = createMailer(loadMailConfig());
  const app = await createApp({ config, logger, mailer });
  await app.listen(config.port, '0.0.0.0');
  logger.event('info', 'service.started', { port: config.port, mailEnabled: mailer.enabled });
}

bootstrap().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
