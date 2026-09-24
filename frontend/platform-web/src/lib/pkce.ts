import { createHash, randomBytes } from 'node:crypto';

/** Unguessable URL-safe value for state, nonce, and the PKCE verifier (RFC 7636). */
export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

/** S256 code challenge for a verifier (RFC 7636 section 4.2). */
export function codeChallenge(verifier: string): string {
  return createHash('sha256').update(verifier).digest('base64url');
}
