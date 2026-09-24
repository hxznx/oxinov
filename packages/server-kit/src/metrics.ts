import { Inject, Injectable } from '@nestjs/common';
import { Counter, Gauge, Histogram, Registry, collectDefaultMetrics } from 'prom-client';
import type { ServiceConfig } from './config';
import { APP_CONFIG } from './tokens';

/**
 * HTTP metrics following docs/devops/OBSERVABILITY.md: `oxinov_` prefix, base units, and bounded
 * labels only. Never label with tenant, user, or request IDs. APIs extend this class with their own
 * domain counters on the same registry.
 */
@Injectable()
export class HttpMetrics {
  readonly registry = new Registry();
  protected readonly service: string;

  private readonly requests: Counter<'service' | 'method' | 'route' | 'status_code'>;
  private readonly duration: Histogram<'service' | 'method' | 'route' | 'status_code'>;
  private readonly active: Gauge<'service'>;

  constructor(@Inject(APP_CONFIG) config: ServiceConfig) {
    this.service = config.serviceName;
    this.requests = new Counter({
      name: 'oxinov_http_requests_total',
      help: 'HTTP requests handled, by normalized route template.',
      labelNames: ['service', 'method', 'route', 'status_code'] as const,
      registers: [this.registry],
    });
    this.duration = new Histogram({
      name: 'oxinov_http_request_duration_seconds',
      help: 'HTTP request duration in seconds, by normalized route template.',
      labelNames: ['service', 'method', 'route', 'status_code'] as const,
      buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [this.registry],
    });
    this.active = new Gauge({
      name: 'oxinov_active_requests',
      help: 'HTTP requests currently in flight.',
      labelNames: ['service'] as const,
      registers: [this.registry],
    });
    this.registry.setDefaultLabels({ service: this.service });
    collectDefaultMetrics({ register: this.registry, prefix: `oxinov_${this.service}_` });
  }

  requestStarted(): () => void {
    this.active.inc({ service: this.service });
    return () => this.active.dec({ service: this.service });
  }

  requestFinished(method: string, route: string, statusCode: number, seconds: number): void {
    const labels = { service: this.service, method, route, status_code: String(statusCode) };
    this.requests.inc(labels);
    this.duration.observe(labels, seconds);
  }
}
