import { Injectable } from '@nestjs/common';
import { Counter, Gauge, Histogram, Registry, collectDefaultMetrics } from 'prom-client';

const SERVICE = 'api';

/**
 * Prometheus metrics following docs/devops/OBSERVABILITY.md: `oxinov_` prefix, base units, and
 * bounded labels only. Never label with tenant, user, course, or request IDs.
 */
@Injectable()
export class MetricsService {
  readonly registry = new Registry();

  private readonly requests = new Counter({
    name: 'oxinov_http_requests_total',
    help: 'HTTP requests handled, by normalized route template.',
    labelNames: ['service', 'method', 'route', 'status_code'] as const,
    registers: [this.registry],
  });

  private readonly duration = new Histogram({
    name: 'oxinov_http_request_duration_seconds',
    help: 'HTTP request duration in seconds, by normalized route template.',
    labelNames: ['service', 'method', 'route', 'status_code'] as const,
    buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    registers: [this.registry],
  });

  private readonly active = new Gauge({
    name: 'oxinov_active_requests',
    help: 'HTTP requests currently in flight.',
    labelNames: ['service'] as const,
    registers: [this.registry],
  });

  private readonly examSubmissionFailures = new Counter({
    name: 'oxinov_exam_submission_failures_total',
    help: 'Exam submissions that failed, by stable reason code.',
    labelNames: ['reason_code'] as const,
    registers: [this.registry],
  });

  constructor() {
    this.registry.setDefaultLabels({ service: SERVICE });
    collectDefaultMetrics({ register: this.registry, prefix: 'oxinov_api_' });
  }

  requestStarted(): () => void {
    this.active.inc({ service: SERVICE });
    return () => this.active.dec({ service: SERVICE });
  }

  requestFinished(method: string, route: string, statusCode: number, seconds: number): void {
    const labels = { service: SERVICE, method, route, status_code: String(statusCode) };
    this.requests.inc(labels);
    this.duration.observe(labels, seconds);
  }

  examSubmissionFailed(reasonCode: string): void {
    this.examSubmissionFailures.inc({ reason_code: reasonCode });
  }
}
