import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose';
import { portalConfig } from './config.ts';

/** OpenID Connect client for id.oxinov.com (authorization code flow with PKCE, confidential client). */
interface Discovery {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  end_session_endpoint: string;
  jwks_uri: string;
}

export interface TokenSet {
  access_token: string;
  refresh_token: string;
  id_token?: string;
  expires_in: number;
}

let discovery: Promise<Discovery> | undefined;
let jwks: JWTVerifyGetKey | undefined;

async function metadata(): Promise<Discovery> {
  discovery ??= fetch(`${portalConfig().issuer}/.well-known/openid-configuration`, { cache: 'no-store' }).then(async (response) => {
    if (!response.ok) {
      discovery = undefined;
      throw new Error(`OIDC discovery failed: ${response.status}`);
    }
    return (await response.json()) as Discovery;
  });
  return discovery;
}

export async function authorizationUrl(input: { state: string; nonce: string; challenge: string; idpHint?: string }): Promise<string> {
  const config = portalConfig();
  const url = new URL((await metadata()).authorization_endpoint);
  url.search = new URLSearchParams({
    client_id: config.clientId,
    response_type: 'code',
    scope: 'openid email profile',
    redirect_uri: `${config.appUrl}/auth/callback`,
    state: input.state,
    nonce: input.nonce,
    code_challenge: input.challenge,
    code_challenge_method: 'S256',
    ...(input.idpHint ? { kc_idp_hint: input.idpHint } : {}),
  }).toString();
  return url.toString();
}

async function tokenRequest(body: Record<string, string>): Promise<TokenSet> {
  const config = portalConfig();
  const response = await fetch((await metadata()).token_endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: config.clientId, client_secret: config.clientSecret, ...body }),
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`Token request failed: ${response.status}`);
  return (await response.json()) as TokenSet;
}

export function exchangeCode(code: string, verifier: string): Promise<TokenSet> {
  return tokenRequest({
    grant_type: 'authorization_code',
    code,
    code_verifier: verifier,
    redirect_uri: `${portalConfig().appUrl}/auth/callback`,
  });
}

export function refreshTokens(refreshToken: string): Promise<TokenSet> {
  return tokenRequest({ grant_type: 'refresh_token', refresh_token: refreshToken });
}

/** Verifies the ID token (issuer, audience, signature, expiry, nonce) and returns its subject. */
export async function verifyIdToken(idToken: string | undefined, nonce: string): Promise<string> {
  if (!idToken) throw new Error('The identity provider returned no ID token');
  const meta = await metadata();
  jwks ??= createRemoteJWKSet(new URL(meta.jwks_uri));
  const { payload } = await jwtVerify(idToken, jwks, { issuer: meta.issuer, audience: portalConfig().clientId });
  if (payload.nonce !== nonce) throw new Error('ID token nonce mismatch');
  if (!payload.sub) throw new Error('ID token has no subject');
  return payload.sub;
}

/** Ends the Keycloak session too, so single sign-on stops everywhere (FR-ID-2208). */
export async function endSessionUrl(): Promise<string> {
  const config = portalConfig();
  const url = new URL((await metadata()).end_session_endpoint);
  url.search = new URLSearchParams({ client_id: config.clientId, post_logout_redirect_uri: `${config.appUrl}/` }).toString();
  return url.toString();
}

export async function revokeRefreshToken(refreshToken: string): Promise<void> {
  const config = portalConfig();
  const revocation = `${config.issuer}/protocol/openid-connect/revoke`;
  await fetch(revocation, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: config.clientId, client_secret: config.clientSecret, token: refreshToken, token_type_hint: 'refresh_token' }),
    cache: 'no-store',
  }).catch(() => undefined);
}
