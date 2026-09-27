import { createHash } from 'node:crypto';
import { EncryptJWT, jwtDecrypt } from 'jose';

/**
 * Tokens stay on the server side of the web app (backend-for-frontend, docs/04-architecture/identity-and-access.md):
 * they are sealed with AES-256-GCM into an HttpOnly cookie that the browser cannot read or alter.
 */
export interface WebSession {
  subject: string;
  accessToken: string;
  refreshToken: string;
  /** Epoch seconds when the access token expires. */
  accessExpiresAt: number;
}

/** Short-lived sign-in transaction: binds the callback to this browser (state, PKCE verifier, nonce). */
export interface SignInTransaction {
  state: string;
  verifier: string;
  nonce: string;
  returnTo: string;
}

/** Session cookie lifetime; Keycloak's 30-day idle session remains the real limit. */
export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;
export const TRANSACTION_MAX_AGE_SECONDS = 10 * 60;

function keyFor(secret: string, purpose: string): Uint8Array {
  // Separate keys per purpose so a sealed transaction can never be replayed as a session.
  return new Uint8Array(createHash('sha256').update(`${purpose}:${secret}`).digest());
}

async function seal(payload: object, secret: string, purpose: string, maxAgeSeconds: number): Promise<string> {
  return new EncryptJWT({ ...payload })
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' })
    .setIssuedAt()
    .setExpirationTime(`${maxAgeSeconds}s`)
    .encrypt(keyFor(secret, purpose));
}

async function unseal<T>(sealed: string | undefined, secret: string, purpose: string): Promise<T | null> {
  if (!sealed) return null;
  try {
    const { payload } = await jwtDecrypt(sealed, keyFor(secret, purpose));
    return payload as T;
  } catch {
    // Tampered, expired, or sealed with a rotated secret: treat as signed out.
    return null;
  }
}

export const sealSession = (session: WebSession, secret: string) =>
  seal(session, secret, 'session', SESSION_MAX_AGE_SECONDS);

export async function unsealSession(sealed: string | undefined, secret: string): Promise<WebSession | null> {
  const value = await unseal<WebSession>(sealed, secret, 'session');
  return value && typeof value.accessToken === 'string' && typeof value.refreshToken === 'string' ? value : null;
}

export const sealTransaction = (transaction: SignInTransaction, secret: string) =>
  seal(transaction, secret, 'signin', TRANSACTION_MAX_AGE_SECONDS);

export const unsealTransaction = (sealed: string | undefined, secret: string) =>
  unseal<SignInTransaction>(sealed, secret, 'signin');

export function cookieOptions(secure: boolean, maxAge: number) {
  return { httpOnly: true, secure, sameSite: 'lax' as const, path: '/', maxAge };
}
