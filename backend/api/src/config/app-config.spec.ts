import { loadConfig } from './app-config';

const valid = {
  DATABASE_URL: 'postgresql://oxinov_app:x@localhost:5432/oxinov_lms',
  AUTH_DEV_JWT_SECRET: 'x'.repeat(32),
};

describe('loadConfig', () => {
  it('applies local defaults', () => {
    const config = loadConfig(valid);
    expect(config.port).toBe(4000);
    expect(config.environment).toBe('local');
  });

  it('refuses development tokens in production', () => {
    expect(() => loadConfig({ ...valid, NODE_ENV: 'production' })).toThrow(/not allowed in production/);
    expect(() => loadConfig({ ...valid, DEPLOY_ENVIRONMENT: 'production' })).toThrow(/not allowed in production/);
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
    });
    expect(config.auth.devJwtSecret).toBeUndefined();
  });
});
