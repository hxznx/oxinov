import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule, type OpenAPIObject } from '@nestjs/swagger';
import { AppModule, type AppModuleOptions } from './app.module';

export async function createApp(options: AppModuleOptions): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule.forRoot(options), {
    logger: options.logger,
    bufferLogs: false,
  });

  const http = app.getHttpAdapter().getInstance() as { disable?: (setting: string) => void; set?: (k: string, v: unknown) => void };
  http.disable?.('x-powered-by');
  // One proxy hop (ingress) so request.ip reflects the client for rate limits and audit.
  http.set?.('trust proxy', 1);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      stopAtFirstError: false,
    }),
  );
  app.enableShutdownHooks();
  return app;
}

export function buildOpenApi(app: INestApplication, version: string): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('Oxinov Edu API')
    .setDescription(
      'Versioned API for web and mobile clients. Tenant routes require an active membership. ' +
        'Errors use {"error":{"code","message","requestId"}}.',
    )
    .setVersion(version)
    .addBearerAuth()
    .build();
  return SwaggerModule.createDocument(app, config);
}
