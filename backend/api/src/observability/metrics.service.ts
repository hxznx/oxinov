import { Inject, Injectable } from '@nestjs/common';
import { APP_CONFIG, HttpMetrics, type ServiceConfig } from '@oxinov/server-kit';
import { Counter } from 'prom-client';

/** Shared HTTP metrics plus Edu-specific counters (docs/devops/OBSERVABILITY.md). */
@Injectable()
export class MetricsService extends HttpMetrics {
  private readonly examSubmissionFailures: Counter<'reason_code'>;

  constructor(@Inject(APP_CONFIG) config: ServiceConfig) {
    super(config);
    this.examSubmissionFailures = new Counter({
      name: 'oxinov_exam_submission_failures_total',
      help: 'Exam submissions that failed, by stable reason code.',
      labelNames: ['reason_code'] as const,
      registers: [this.registry],
    });
  }

  examSubmissionFailed(reasonCode: string): void {
    this.examSubmissionFailures.inc({ reason_code: reasonCode });
  }
}
