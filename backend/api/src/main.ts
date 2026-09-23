import 'reflect-metadata';
import { SwaggerModule } from '@nestjs/swagger';
import { buildOpenApi, createApp } from './app.factory';
import { JsonLogger } from './common/json-logger';
import { loadConfig } from './config/app-config';

async function bootstrap(): Promise<void> {
  const config = loadConfig();
  const logger = new JsonLogger({
    service: 'api',
    environment: config.environment,
    version: config.serviceVersion,
  });

  const app = await createApp({ config, logger });
  if (config.environment === 'local' || config.environment === 'ci') {
    SwaggerModule.setup('docs', app, buildOpenApi(app, config.serviceVersion));
  }

  await app.listen(config.port, '0.0.0.0');
  logger.event('info', 'service.started', { port: config.port });
}

bootstrap().catch((error: unknown) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
