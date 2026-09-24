import { Inject, Injectable } from '@nestjs/common';
import {
  createRemoteJWKSet,
  jwtVerify,
  type JWTPayload,
  type JWTVerifyGetKey,
} from 'jose';
import { APP_CONFIG, type AppConfig } from '../config/app-config';

export interface VerifiedIdentity {
  /** Stable identity-provider subject. Never an email address. */
  subject: string;
  /** Undefined when the token carries no such claim; stored values are then left unchanged. */
  email?: string;
  emailVerified?: boolean;
  name?: string;
}

export const DEV_ISSUER = 'oxinov-dev';
export const JWKS_RESOLVER = Symbol('JWKS_RESOLVER');

function claimString(payload: JWTPayload, key: string): string | null {
  const value = payload[key];
  return typeof value === 'string' && value.length > 0 ? value : null;
}

/**
 * Verifies standard bearer tokens through the configured OIDC provider's JWKS. Local development
 * may also accept HS256 tokens from the LMS dev-token script; configuration refuses that secret in
 * production.
 *
 * Email and verification status are read from `email` and `email_verified` claims. Configure both
 * as OIDC claims; without them, tenant creation is refused.
 */
@Injectable()
export class TokenVerifier {
  private readonly jwks?: JWTVerifyGetKey;
  private readonly devSecret?: Uint8Array;

  constructor(
    @Inject(APP_CONFIG) private readonly config: AppConfig,
    @Inject(JWKS_RESOLVER) jwksOverride: JWTVerifyGetKey | null,
  ) {
    if (jwksOverride) {
      this.jwks = jwksOverride;
    } else if (config.auth.jwksUrl) {
      this.jwks = createRemoteJWKSet(new URL(config.auth.jwksUrl));
    }
    if (config.auth.devJwtSecret) {
      this.devSecret = new TextEncoder().encode(config.auth.devJwtSecret);
    }
  }

  /** Returns the identity, or null for any invalid, expired, or unrecognised token. */
  async verify(token: string): Promise<VerifiedIdentity | null> {
    const payload = await this.verifyPayload(token);
    if (!payload?.sub) return null;
    const email = claimString(payload, 'email');
    const name = claimString(payload, 'name');
    return {
      subject: payload.sub,
      ...(email ? { email: email.toLowerCase() } : {}),
      ...(typeof payload.email_verified === 'boolean' ? { emailVerified: payload.email_verified } : {}),
      ...(name ? { name } : {}),
    };
  }

  private async verifyPayload(token: string): Promise<JWTPayload | null> {
    try {
      if (this.devSecret && this.issuerOf(token) === DEV_ISSUER) {
        const { payload } = await jwtVerify(token, this.devSecret, {
          issuer: DEV_ISSUER,
          algorithms: ['HS256'],
        });
        return payload;
      }
      if (this.jwks && this.config.auth.issuer) {
        const { payload } = await jwtVerify(token, this.jwks, {
          issuer: this.config.auth.issuer,
          audience: this.config.auth.audience,
          algorithms: ['RS256', 'ES256'],
        });
        return payload;
      }
      return null;
    } catch {
      return null;
    }
  }

  /** Reads the unverified issuer only to choose a verification key; the claim is then verified. */
  private issuerOf(token: string): string | null {
    const part = token.split('.')[1];
    if (!part) return null;
    try {
      const payload = JSON.parse(Buffer.from(part, 'base64url').toString('utf8')) as { iss?: unknown };
      return typeof payload.iss === 'string' ? payload.iss : null;
    } catch {
      return null;
    }
  }
}
