import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule, type AppModuleOptions } from './app.module';

export async function createApp(options: AppModuleOptions): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule.forRoot(options), { logger: options.logger, bufferLogs: false });

  const http = app.getHttpAdapter().getInstance() as { disable?: (setting: string) => void; set?: (k: string, v: unknown) => void };
  http.disable?.('x-powered-by');
  // One proxy hop (ingress) so request.ip reflects the client for rate limits and audit.
  http.set?.('trust proxy', 1);

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true, stopAtFirstError: false }));
  app.enableShutdownHooks();
  return app;
}
