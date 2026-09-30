import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose';
import type { WebAuthConfig } from './config.ts';

/** OpenID Connect client for id.oxinov.com (authorization code flow with PKCE, confidential client). */
interface Discovery {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  end_session_endpoint: string;
  revocation_endpoint?: string;
  jwks_uri: string;
}

export interface TokenSet {
  access_token: string;
  refresh_token: string;
  id_token?: string;
  expires_in: number;
}

export interface OidcClient {
  /** `prompt: 'create'` opens the registration page instead of sign-in (OpenID Connect prompt=create). */
  authorizationUrl(input: {
    state: string;
    nonce: string;
    challenge: string;
    idpHint?: string;
    prompt?: 'create';
  }): Promise<string>;
  exchangeCode(code: string, verifier: string): Promise<TokenSet>;
  refreshTokens(refreshToken: string): Promise<TokenSet>;
  /** Verifies the ID token (issuer, audience, signature, expiry, nonce) and returns its subject. */
  verifyIdToken(idToken: string | undefined, nonce: string): Promise<string>;
  /** Ends the identity session too, so single sign-on stops everywhere (FR-ID-2208). */
  endSessionUrl(): Promise<string>;
  revokeRefreshToken(refreshToken: string): Promise<void>;
}

export function createOidcClient(config: () => WebAuthConfig): OidcClient {
  let discovery: Promise<Discovery> | undefined;
  let jwks: JWTVerifyGetKey | undefined;
  const redirectUri = () => `${config().appUrl}/auth/callback`;

  function metadata(): Promise<Discovery> {
    discovery ??= fetch(`${config().issuer}/.well-known/openid-configuration`, { cache: 'no-store' }).then(async (response) => {
      if (!response.ok) {
        discovery = undefined;
        throw new Error(`OIDC discovery failed: ${response.status}`);
      }
      return (await response.json()) as Discovery;
    });
    return discovery;
  }

  async function tokenRequest(body: Record<string, string>): Promise<TokenSet> {
    const { clientId, clientSecret } = config();
    const response = await fetch((await metadata()).token_endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, ...body }),
      cache: 'no-store',
    });
    if (!response.ok) throw new Error(`Token request failed: ${response.status}`);
    return (await response.json()) as TokenSet;
  }

  return {
    async authorizationUrl(input) {
      const url = new URL((await metadata()).authorization_endpoint);
      url.search = new URLSearchParams({
        client_id: config().clientId,
        response_type: 'code',
        scope: 'openid email profile',
        redirect_uri: redirectUri(),
        state: input.state,
        nonce: input.nonce,
        code_challenge: input.challenge,
        code_challenge_method: 'S256',
        ...(input.idpHint ? { kc_idp_hint: input.idpHint } : {}),
        ...(input.prompt ? { prompt: input.prompt } : {}),
      }).toString();
      return url.toString();
    },

    exchangeCode(code, verifier) {
      return tokenRequest({ grant_type: 'authorization_code', code, code_verifier: verifier, redirect_uri: redirectUri() });
    },

    refreshTokens(refreshToken) {
      return tokenRequest({ grant_type: 'refresh_token', refresh_token: refreshToken });
    },

    async verifyIdToken(idToken, nonce) {
      if (!idToken) throw new Error('The identity provider returned no ID token');
      const meta = await metadata();
      jwks ??= createRemoteJWKSet(new URL(meta.jwks_uri));
      const { payload } = await jwtVerify(idToken, jwks, { issuer: meta.issuer, audience: config().clientId });
      if (payload.nonce !== nonce) throw new Error('ID token nonce mismatch');
      if (!payload.sub) throw new Error('ID token has no subject');
      return payload.sub;
    },

    async endSessionUrl() {
      const { clientId, appUrl } = config();
      const url = new URL((await metadata()).end_session_endpoint);
      url.search = new URLSearchParams({ client_id: clientId, post_logout_redirect_uri: `${appUrl}/` }).toString();
      return url.toString();
    },

    async revokeRefreshToken(refreshToken) {
      const { clientId, clientSecret, issuer } = config();
      const meta = await metadata().catch(() => undefined);
      const revocation = meta?.revocation_endpoint ?? `${issuer}/protocol/openid-connect/revoke`;
      await fetch(revocation, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, token: refreshToken, token_type_hint: 'refresh_token' }),
        cache: 'no-store',
      }).catch(() => undefined);
    },
  };
}
