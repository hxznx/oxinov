import { loadServiceConfig } from './config';

const loadConfig = (env: NodeJS.ProcessEnv) => loadServiceConfig(env, { serviceName: 'api', defaultPort: 4000 });

const valid = {
  DATABASE_URL: 'postgresql://oxinov_app:x@localhost:5432/oxinov_edu',
  AUTH_DEV_JWT_SECRET: 'x'.repeat(32),
};

describe('loadConfig', () => {
  it('applies local defaults', () => {
    const config = loadConfig(valid);
    expect(config.port).toBe(4000);
    expect(config.environment).toBe('local');
    expect(config.serviceName).toBe('api');
  });

  it('uses the default port of each service', () => {
    expect(loadServiceConfig(valid, { serviceName: 'platform', defaultPort: 4100 }).port).toBe(4100);
  });

  it('refuses development tokens outside local and CI', () => {
    expect(() => loadConfig({ ...valid, NODE_ENV: 'production' })).toThrow(/not allowed in staging or production/);
    expect(() => loadConfig({ ...valid, DEPLOY_ENVIRONMENT: 'production' })).toThrow(/not allowed in staging or production/);
    expect(() => loadConfig({ ...valid, DEPLOY_ENVIRONMENT: 'staging' })).toThrow(/not allowed in staging or production/);
    expect(loadConfig({ ...valid, DEPLOY_ENVIRONMENT: 'ci' }).auth.devJwtSecret).toBe(valid.AUTH_DEV_JWT_SECRET);
  });

  it('requires a token audience for deployed environments (FR-ID-2207)', () => {
    const idp = {
      DATABASE_URL: valid.DATABASE_URL,
      AUTH_ISSUER: 'https://idp.example',
      AUTH_JWKS_URL: 'https://idp.example/.well-known/jwks.json',
    };
    expect(() => loadConfig({ ...idp, DEPLOY_ENVIRONMENT: 'staging' })).toThrow(/AUTH_AUDIENCE is required/);
    expect(() => loadConfig({ ...idp, NODE_ENV: 'production' })).toThrow(/AUTH_AUDIENCE is required/);
    expect(loadConfig({ ...idp, DEPLOY_ENVIRONMENT: 'local' }).auth.audiences).toEqual([]);
  });

  it('validates the rate limit', () => {
    expect(loadConfig(valid).rateLimitPerMinute).toBe(600);
    expect(loadConfig({ ...valid, RATE_LIMIT_PER_MINUTE: '0' }).rateLimitPerMinute).toBe(0);
    expect(() => loadConfig({ ...valid, RATE_LIMIT_PER_MINUTE: '-1' })).toThrow(/RATE_LIMIT_PER_MINUTE/);
  });

  it('requires an identity configuration and a database', () => {
    expect(() => loadConfig({ DATABASE_URL: valid.DATABASE_URL })).toThrow(/AUTH_ISSUER/);
    expect(() => loadConfig({ AUTH_DEV_JWT_SECRET: valid.AUTH_DEV_JWT_SECRET })).toThrow(/DATABASE_URL/);
  });

  it('requires issuer and JWKS together and a strong dev secret', () => {
    expect(() => loadConfig({ ...valid, AUTH_ISSUER: 'https://idp.example' })).toThrow(/together/);
    expect(() => loadConfig({ ...valid, AUTH_DEV_JWT_SECRET: 'short' })).toThrow(/32 characters/);
  });

  it('accepts a production identity-provider configuration', () => {
    const config = loadConfig({
      DATABASE_URL: valid.DATABASE_URL,
      NODE_ENV: 'production',
      DEPLOY_ENVIRONMENT: 'production',
      AUTH_ISSUER: 'https://idp.example',
      AUTH_JWKS_URL: 'https://idp.example/.well-known/jwks.json',
      AUTH_AUDIENCE: 'oxinov-edu-api',
    });
    expect(config.auth.devJwtSecret).toBeUndefined();
    expect(config.auth.audiences).toEqual(['oxinov-edu-api']);
  });

  it('accepts a comma-separated audience list while an audience is renamed (ADR-027)', () => {
    const config = loadConfig({
      DATABASE_URL: valid.DATABASE_URL,
      NODE_ENV: 'production',
      DEPLOY_ENVIRONMENT: 'production',
      AUTH_ISSUER: 'https://idp.example',
      AUTH_JWKS_URL: 'https://idp.example/.well-known/jwks.json',
      AUTH_AUDIENCE: ' oxinov-edu-api , oxinov-lms-api ,',
    });
    expect(config.auth.audiences).toEqual(['oxinov-edu-api', 'oxinov-lms-api']);
  });

  it('still requires an audience in production when the list is blank', () => {
    expect(() =>
      loadConfig({
        DATABASE_URL: valid.DATABASE_URL,
        NODE_ENV: 'production',
        DEPLOY_ENVIRONMENT: 'production',
        AUTH_ISSUER: 'https://idp.example',
        AUTH_JWKS_URL: 'https://idp.example/.well-known/jwks.json',
        AUTH_AUDIENCE: ' , ',
      }),
    ).toThrow('AUTH_AUDIENCE is required in staging and production');
  });
});
