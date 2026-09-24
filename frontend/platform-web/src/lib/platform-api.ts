import { portalConfig } from './config.ts';

/** Server-side client for api.oxinov.com. The browser never calls it directly or sees tokens. */
export interface Account {
  id: string;
  email: string | null;
  emailVerified: boolean;
  displayName: string | null;
  country: string | null;
  status: 'PENDING_WELCOME' | 'ACTIVE' | 'SUSPENDED';
  trustLevel: 'T1' | 'T2' | 'T3' | 'T4';
  welcomeRequired: boolean;
  outstandingPolicies: { policyId: string; version: number; title: string; url: string }[];
}

export interface Product {
  key: string;
  name: string;
  address: string;
}

export interface Entitlement {
  productKey: string;
  entitlementKey: string;
  source: string;
}

export class PlatformApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: Record<string, unknown>,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init: { token?: string; method?: string; body?: unknown } = {}): Promise<T> {
  const response = await fetch(`${portalConfig().platformApiUrl}${path}`, {
    method: init.method ?? 'GET',
    headers: {
      Accept: 'application/json',
      ...(init.token ? { Authorization: `Bearer ${init.token}` } : {}),
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
    cache: 'no-store',
  });
  const json = (await response.json().catch(() => ({}))) as { data?: T; error?: { code: string; message: string; details?: Record<string, unknown> } };
  if (!response.ok || json.data === undefined) {
    throw new PlatformApiError(response.status, json.error?.code ?? 'UNAVAILABLE', json.error?.message ?? 'The Oxinov service is unavailable.', json.error?.details);
  }
  return json.data;
}

export const platformApi = {
  me: (token: string) => request<Account>('/v1/me', { token }),
  entitlements: (token: string) => request<Entitlement[]>('/v1/me/entitlements', { token }),
  products: () => request<Product[]>('/v1/products'),
  welcome: (token: string, body: unknown) => request<Account>('/v1/me/welcome', { token, method: 'POST', body }),
  acceptPolicies: (token: string, body: unknown) => request<Account>('/v1/me/policy-acceptances', { token, method: 'POST', body }),
};
