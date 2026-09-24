import { Inject, Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { NextFunction, Response } from 'express';
import { JsonLogger } from '../common/json-logger';
import { routePath, type AppRequest } from '../common/request';
import { LOGGER } from '../common/tokens';
import { MetricsService } from './metrics.service';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Assigns a correlation ID (reusing a well-formed inbound X-Request-Id), records HTTP metrics
 * against the matched route template, and writes one structured access log per request.
 */
@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  constructor(
    private readonly metrics: MetricsService,
    @Inject(LOGGER) private readonly logger: JsonLogger,
  ) {}

  use(request: AppRequest, response: Response, next: NextFunction): void {
    const inbound = request.header('x-request-id');
    request.requestId = inbound && UUID.test(inbound) ? inbound : randomUUID();
    response.setHeader('X-Request-Id', request.requestId);

    const started = process.hrtime.bigint();
    const finishActive = this.metrics.requestStarted();

    response.on('finish', () => {
      finishActive();
      const seconds = Number(process.hrtime.bigint() - started) / 1e9;
      // Express sets route only when a handler matched; unmatched paths share one label value.
      const matched = routePath(request);
      const route = matched === undefined ? 'unmatched' : `${request.baseUrl ?? ''}${matched}`;
      if (route === '/metrics') return;
      this.metrics.requestFinished(request.method, route, response.statusCode, seconds);
      if (route.startsWith('/health')) return;
      this.logger.event(response.statusCode >= 500 ? 'error' : 'info', 'request.completed', {
        requestId: request.requestId,
        method: request.method,
        route,
        statusCode: response.statusCode,
        durationMs: Math.round(seconds * 1000),
        tenantId: request.tenant?.tenantId,
      });
    });

    next();
  }
}
