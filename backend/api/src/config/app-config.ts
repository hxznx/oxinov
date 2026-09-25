import { loadServiceConfig, type ServiceConfig } from '@oxinov/server-kit';

export { APP_CONFIG } from '@oxinov/server-kit';
export type { DeployEnvironment } from '@oxinov/server-kit';

/** Object storage for lesson media (Amazon S3, or an S3-compatible server in local development). */
export interface MediaConfig {
  /** Bucket for lesson media; media features are unavailable when unset. */
  readonly bucket?: string;
  /** Custom S3 endpoint for local development (for example http://127.0.0.1:9000); unset for Amazon S3. */
  readonly endpoint?: string;
  readonly region: string;
  readonly forcePathStyle: boolean;
}

/** The Edu API (internal name `api`) uses the shared service configuration (ADR-007) plus media storage. */
export type AppConfig = ServiceConfig & { readonly media: MediaConfig };

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const base = loadServiceConfig(env, { serviceName: 'api', defaultPort: 4000 });
  const bucket = env.MEDIA_BUCKET?.trim() || undefined;
  const endpoint = env.MEDIA_S3_ENDPOINT?.trim() || undefined;
  if (endpoint && !/^https?:\/\/[^\s/]+(:\d+)?\/?$/.test(endpoint)) {
    throw new Error('Invalid configuration: MEDIA_S3_ENDPOINT must be an http(s) origin such as http://127.0.0.1:9000');
  }
  if (endpoint && (base.environment === 'staging' || base.environment === 'production')) {
    throw new Error('Invalid configuration: MEDIA_S3_ENDPOINT is for local development; deployed environments use Amazon S3');
  }
  return {
    ...base,
    media: {
      bucket,
      endpoint: endpoint?.replace(/\/$/, ''),
      region: env.MEDIA_S3_REGION?.trim() || 'ap-south-1',
      forcePathStyle: endpoint !== undefined,
    },
  };
}
