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

/** Khalti and eSewa checkout for paid courses (ADR-023). A provider is enabled only when its keys are set. */
export interface PaymentsConfig {
  /** `sandbox` uses the providers' test systems; `live` moves real money and is required explicitly. */
  readonly mode: 'sandbox' | 'live';
  /** Tenants allowed to sell courses (ADR-023: Oxinov's own workspace first). IDs, never slugs. */
  readonly sellerTenantIds: ReadonlySet<string>;
  /** Public address of the Edu web app; providers send learners back here after paying. */
  readonly webUrl: string;
  readonly khalti?: { readonly secretKey: string; readonly apiUrl: string };
  readonly esewa?: { readonly productCode: string; readonly secretKey: string; readonly formUrl: string; readonly statusUrl: string };
}

/** Transactional email through the in-cluster mail relay (FR-COMM-703). Mail is off without a host. */
export interface MailConfig {
  readonly smtpHost?: string;
  readonly smtpPort: number;
  /** Envelope and header sender; the relay accepts only this address. */
  readonly from: string;
  /** Support address printed in every learner email. */
  readonly supportAddress: string;
}

/** The Edu API (internal name `api`) uses the shared service configuration (ADR-007) plus media storage, payments, and mail. */
export type AppConfig = ServiceConfig & { readonly media: MediaConfig; readonly payments: PaymentsConfig; readonly mail: MailConfig };

const EMAIL = /^[^\s@<>]+@[^\s@<>]+\.[a-z]{2,}$/i;

export function loadMailConfig(env: NodeJS.ProcessEnv): MailConfig {
  const smtpHost = env.MAIL_SMTP_HOST?.trim() || undefined;
  const smtpPort = Number(env.MAIL_SMTP_PORT?.trim() || '2525');
  if (!Number.isInteger(smtpPort) || smtpPort < 1 || smtpPort > 65535) throw new Error('Invalid configuration: MAIL_SMTP_PORT must be a port number');
  const from = env.MAIL_FROM?.trim() || 'no-reply@oxinov.com';
  const supportAddress = env.MAIL_SUPPORT_ADDRESS?.trim() || 'support@oxinov.com';
  if (!EMAIL.test(from) || !EMAIL.test(supportAddress)) throw new Error('Invalid configuration: MAIL_FROM and MAIL_SUPPORT_ADDRESS must be email addresses');
  return { ...(smtpHost ? { smtpHost } : {}), smtpPort, from, supportAddress };
}

const PROVIDER_URLS = {
  sandbox: {
    khalti: 'https://dev.khalti.com/api/v2',
    esewaForm: 'https://rc-epay.esewa.com.np/api/epay/main/v2/form',
    esewaStatus: 'https://rc.esewa.com.np/api/epay/transaction/status/',
  },
  live: {
    khalti: 'https://khalti.com/api/v2',
    esewaForm: 'https://epay.esewa.com.np/api/epay/main/v2/form',
    esewaStatus: 'https://esewa.com.np/api/epay/transaction/status/',
  },
} as const;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

export function loadPaymentsConfig(env: NodeJS.ProcessEnv, environment: string): PaymentsConfig {
  const mode = env.PAYMENTS_MODE?.trim() || 'sandbox';
  if (mode !== 'sandbox' && mode !== 'live') throw new Error('Invalid configuration: PAYMENTS_MODE must be sandbox or live');
  const sellerTenantIds = new Set(
    (env.PAYMENTS_SELLER_TENANT_IDS ?? '').split(',').map((id) => id.trim().toLowerCase()).filter(Boolean),
  );
  for (const id of sellerTenantIds) {
    if (!UUID.test(id)) throw new Error('Invalid configuration: PAYMENTS_SELLER_TENANT_IDS must list tenant UUIDs');
  }
  const webUrl = (env.EDU_WEB_URL?.trim() || 'http://localhost:3002').replace(/\/$/, '');
  if (!/^https?:\/\/[^\s/]+(:\d+)?$/.test(webUrl)) throw new Error('Invalid configuration: EDU_WEB_URL must be an http(s) origin');
  if (environment === 'production' && !webUrl.startsWith('https://')) {
    throw new Error('Invalid configuration: EDU_WEB_URL must use https in production');
  }
  const urls = PROVIDER_URLS[mode];
  const khaltiKey = env.KHALTI_SECRET_KEY?.trim();
  const esewaCode = env.ESEWA_PRODUCT_CODE?.trim();
  const esewaKey = env.ESEWA_SECRET_KEY?.trim();
  if (Boolean(esewaCode) !== Boolean(esewaKey)) {
    throw new Error('Invalid configuration: set both ESEWA_PRODUCT_CODE and ESEWA_SECRET_KEY, or neither');
  }
  // The published eSewa test merchant must never take real payments.
  if (mode === 'live' && esewaCode === 'EPAYTEST') throw new Error('Invalid configuration: EPAYTEST is the eSewa test merchant');
  return {
    mode,
    sellerTenantIds,
    webUrl,
    ...(khaltiKey ? { khalti: { secretKey: khaltiKey, apiUrl: urls.khalti } } : {}),
    ...(esewaCode && esewaKey
      ? { esewa: { productCode: esewaCode, secretKey: esewaKey, formUrl: urls.esewaForm, statusUrl: urls.esewaStatus } }
      : {}),
  };
}

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
    payments: loadPaymentsConfig(env, base.environment),
    mail: loadMailConfig(env),
    media: {
      bucket,
      endpoint: endpoint?.replace(/\/$/, ''),
      region: env.MEDIA_S3_REGION?.trim() || 'ap-south-1',
      forcePathStyle: endpoint !== undefined,
    },
  };
}
