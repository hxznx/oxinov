import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { APP_CONFIG, type AppConfig } from '../config/app-config';

/**
 * Typed mirror of security/soc/event-schema.json (v1.0). A test validates emitted events against
 * that schema. Never add secrets, request bodies, private messages, exam answers, or prompts.
 */
export type SecurityCategory =
  | 'authentication'
  | 'authorization'
  | 'configuration'
  | 'data_access'
  | 'malware'
  | 'payment'
  | 'tenant_isolation'
  | 'threat'
  | 'vulnerability';

export interface SecurityEvent {
  schema_version: '1.0';
  timestamp: string;
  event_id: string;
  event: {
    action: string;
    category: SecurityCategory;
    outcome: 'success' | 'failure' | 'unknown';
    severity: number;
  };
  service: { name: 'api'; version: string };
  environment: AppConfig['environment'];
  tenant?: { id: string };
  actor?: { id?: string; type?: 'user' | 'service' | 'system' | 'anonymous'; role?: string };
  request?: { correlation_id?: string; route?: string; method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' };
  target?: { type?: string; id?: string; role?: string };
  reason_code: string;
  attributes?: Record<string, string | number | boolean>;
}

export interface SecurityEventInput {
  action: string;
  category: SecurityCategory;
  outcome: SecurityEvent['event']['outcome'];
  severity: number;
  reasonCode: string;
  tenantId?: string;
  actor?: SecurityEvent['actor'];
  request?: SecurityEvent['request'];
  target?: SecurityEvent['target'];
  attributes?: SecurityEvent['attributes'];
}

export const SECURITY_EVENT_SINK = Symbol('SECURITY_EVENT_SINK');
export type SecurityEventSink = (event: SecurityEvent) => void;

/** Default sink: one JSON line on stdout tagged for the security-event collector. */
export const stdoutSecuritySink: SecurityEventSink = (event) => {
  process.stdout.write(`${JSON.stringify({ log_type: 'security_event', ...event })}\n`);
};

@Injectable()
export class SecurityEventsService {
  constructor(
    @Inject(APP_CONFIG) private readonly config: AppConfig,
    @Inject(SECURITY_EVENT_SINK) private readonly sink: SecurityEventSink,
  ) {}

  emit(input: SecurityEventInput): SecurityEvent {
    const event: SecurityEvent = {
      schema_version: '1.0',
      timestamp: new Date().toISOString(),
      event_id: randomUUID(),
      event: {
        action: input.action,
        category: input.category,
        outcome: input.outcome,
        severity: input.severity,
      },
      service: { name: 'api', version: this.config.serviceVersion },
      environment: this.config.environment,
      reason_code: input.reasonCode,
      ...(input.tenantId ? { tenant: { id: input.tenantId } } : {}),
      ...(input.actor ? { actor: input.actor } : {}),
      ...(input.request ? { request: input.request } : {}),
      ...(input.target ? { target: input.target } : {}),
      ...(input.attributes ? { attributes: input.attributes } : {}),
    };
    this.sink(event);
    return event;
  }
}
