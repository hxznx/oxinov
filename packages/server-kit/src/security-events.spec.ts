import Ajv2020 from 'ajv/dist/2020';
import addFormats from 'ajv-formats';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { ServiceConfig } from './config';
import { SecurityEventsService, type SecurityEvent } from './security-events';

const schema = JSON.parse(
  readFileSync(path.resolve(__dirname, '../../../security/soc/event-schema.json'), 'utf8'),
) as object;

const config = { serviceName: 'api', serviceVersion: '1.2.3', environment: 'ci' } as ServiceConfig;

describe('SecurityEventsService', () => {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  const validate = ajv.compile(schema);

  it('emits events that satisfy security/soc/event-schema.json', () => {
    const emitted: SecurityEvent[] = [];
    const service = new SecurityEventsService(config, (event) => emitted.push(event));
    service.emit({
      action: 'tenant.cross_access.denied',
      category: 'tenant_isolation',
      outcome: 'failure',
      severity: 8,
      reasonCode: 'TENANT_MEMBERSHIP_MISMATCH',
      tenantId: '0f8fad5b-d9cb-469f-a165-70867728950e',
      actor: { id: '7c9e6679-7425-40de-944b-e07fc1f90ae7', type: 'user' },
      request: { correlation_id: '16fd2706-8baf-433b-82eb-8c7fada847da', route: '/v1/tenants/:tenantId', method: 'GET' },
      target: { type: 'tenant', id: '0f8fad5b-d9cb-469f-a165-70867728950e' },
    });
    expect(emitted).toHaveLength(1);
    expect(validate(emitted[0])).toBe(true);
    expect(emitted[0]?.service).toEqual({ name: 'api', version: '1.2.3' });
  });

  it('omits optional blocks rather than emitting empty objects', () => {
    const emitted: SecurityEvent[] = [];
    new SecurityEventsService(config, (event) => emitted.push(event)).emit({
      action: 'authorization.denied',
      category: 'authorization',
      outcome: 'failure',
      severity: 3,
      reasonCode: 'ROLE_INSUFFICIENT',
    });
    expect(validate(emitted[0])).toBe(true);
    expect(emitted[0]).not.toHaveProperty('tenant');
  });

  it('is caught by the schema when a reason code is malformed', () => {
    const emitted: SecurityEvent[] = [];
    new SecurityEventsService(config, (event) => emitted.push(event)).emit({
      action: 'authorization.denied',
      category: 'authorization',
      outcome: 'failure',
      severity: 3,
      reasonCode: 'lowercase is invalid',
    });
    expect(validate(emitted[0])).toBe(false);
  });

  it('names the platform service in a schema-valid way', () => {
    const emitted: SecurityEvent[] = [];
    new SecurityEventsService({ ...config, serviceName: 'platform' }, (event) => emitted.push(event)).emit({
      action: 'auth.policy.accepted',
      category: 'authentication',
      outcome: 'success',
      severity: 1,
      reasonCode: 'POLICY_ACCEPTED',
    });
    expect(validate(emitted[0])).toBe(true);
    expect(emitted[0]?.service.name).toBe('platform');
  });
});
