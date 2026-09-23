export type DeployEnvironment = 'local' | 'ci' | 'staging' | 'production';

export interface AppConfig {
  readonly nodeEnv: string;
  readonly port: number;
  readonly serviceVersion: string;
  readonly environment: DeployEnvironment;
  readonly databaseUrl: string;
  readonly auth: {
    readonly issuer?: string;
    readonly jwksUrl?: string;
    readonly audience?: string;
    /** Local HS256 secret for development tokens. Never allowed in production. */
    readonly devJwtSecret?: string;
  };
}

export const APP_CONFIG = Symbol('APP_CONFIG');

const ENVIRONMENTS: readonly DeployEnvironment[] = ['local', 'ci', 'staging', 'production'];

function optional(env: NodeJS.ProcessEnv, key: string): string | undefined {
  const value = env[key]?.trim();
  return value ? value : undefined;
}

/**
 * Reads and validates configuration once at startup so misconfiguration fails fast
 * instead of surfacing as a runtime authorization bug.
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const errors: string[] = [];
  const nodeEnv = optional(env, 'NODE_ENV') ?? 'development';

  const port = Number(optional(env, 'PORT') ?? '4000');
  if (!Number.isInteger(port) || port < 1 || port > 65535) errors.push('PORT must be 1-65535');

  const environment = (optional(env, 'DEPLOY_ENVIRONMENT') ?? 'local') as DeployEnvironment;
  if (!ENVIRONMENTS.includes(environment)) {
    errors.push(`DEPLOY_ENVIRONMENT must be one of ${ENVIRONMENTS.join(', ')}`);
  }

  const databaseUrl = optional(env, 'DATABASE_URL');
  if (!databaseUrl) errors.push('DATABASE_URL is required');

  const issuer = optional(env, 'AUTH_ISSUER');
  const jwksUrl = optional(env, 'AUTH_JWKS_URL');
  const audience = optional(env, 'AUTH_AUDIENCE');
  const devJwtSecret = optional(env, 'AUTH_DEV_JWT_SECRET');

  if (Boolean(issuer) !== Boolean(jwksUrl)) {
    errors.push('AUTH_ISSUER and AUTH_JWKS_URL must be set together');
  }
  if (devJwtSecret && devJwtSecret.length < 32) {
    errors.push('AUTH_DEV_JWT_SECRET must be at least 32 characters');
  }
  const isProduction = nodeEnv === 'production' || environment === 'production';
  if (isProduction && devJwtSecret) {
    errors.push('AUTH_DEV_JWT_SECRET is not allowed in production');
  }
  if (!issuer && !devJwtSecret) {
    errors.push('Configure AUTH_ISSUER/AUTH_JWKS_URL, or AUTH_DEV_JWT_SECRET for local development');
  }

  if (errors.length > 0) {
    throw new Error(`Invalid configuration:\n- ${errors.join('\n- ')}`);
  }

  return {
    nodeEnv,
    port,
    serviceVersion: optional(env, 'SERVICE_VERSION') ?? '0.0.0-dev',
    environment,
    databaseUrl: databaseUrl as string,
    auth: { issuer, jwksUrl, audience, devJwtSecret },
  };
}
