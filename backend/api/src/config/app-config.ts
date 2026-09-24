import { loadServiceConfig, type ServiceConfig } from '@oxinov/server-kit';

export { APP_CONFIG } from '@oxinov/server-kit';
export type { DeployEnvironment } from '@oxinov/server-kit';

/** The Edu API (internal name `api`) uses the shared service configuration (ADR-007). */
export type AppConfig = ServiceConfig;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  return loadServiceConfig(env, { serviceName: 'api', defaultPort: 4000 });
}
