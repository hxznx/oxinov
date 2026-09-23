import { Controller, Get, Header, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import type { Response } from 'express';
import { Public } from '../auth/auth.guard';
import { DatabaseContext } from '../database/database-context.service';
import { MetricsService } from '../observability/metrics.service';

/**
 * Liveness, readiness, and Prometheus metrics (NFR-12). /metrics must be reachable only on the
 * private network; the public ingress must not route it (docs/devops/OBSERVABILITY.md).
 */
@ApiExcludeController()
@Public()
@Controller()
export class HealthController {
  constructor(
    private readonly db: DatabaseContext,
    private readonly metrics: MetricsService,
  ) {}

  @Get('health/live')
  live(): { status: 'ok' } {
    return { status: 'ok' };
  }

  @Get('health/ready')
  async ready(@Res({ passthrough: true }) response: Response): Promise<{ status: string; checks: Record<string, string> }> {
    try {
      await this.db.ping();
      return { status: 'ok', checks: { database: 'ok' } };
    } catch {
      response.status(503);
      return { status: 'unavailable', checks: { database: 'unavailable' } };
    }
  }

  @Get('metrics')
  @Header('Cache-Control', 'no-store')
  async scrape(@Res() response: Response): Promise<void> {
    response.setHeader('Content-Type', this.metrics.registry.contentType);
    response.send(await this.metrics.registry.metrics());
  }
}
