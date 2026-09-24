import { loadServiceConfig, type ServiceConfig } from '@oxinov/server-kit';

/** The platform API uses the shared service configuration (ADR-007, ADR-011). */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): ServiceConfig {
  return loadServiceConfig(env, { serviceName: 'platform', defaultPort: 4200 });
}
