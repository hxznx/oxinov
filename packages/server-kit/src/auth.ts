import { CanActivate, ExecutionContext, Inject, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { createRemoteJWKSet, jwtVerify, type JWTPayload, type JWTVerifyGetKey } from 'jose';
import type { ServiceConfig } from './config';
import { CommonErrors } from './errors';
import type { KitRequest } from './request';
import { APP_CONFIG, IDENTITY_RESOLVER, JWKS_RESOLVER } from './tokens';

export interface VerifiedIdentity {
  /** Stable identity-provider subject. Never an email address. */
  subject: string;
  /** Undefined when the token carries no such claim; stored values are then left unchanged. */
  email?: string;
  emailVerified?: boolean;
  name?: string;
}

/** Maps a verified identity to the application's user record (for example, creating it on first sign-in). */
export interface IdentityResolver<User = unknown> {
  resolve(identity: VerifiedIdentity): Promise<User>;
}

export const DEV_ISSUER = 'oxinov-dev';

function claimString(payload: JWTPayload, key: string): string | null {
  const value = payload[key];
  return typeof value === 'string' && value.length > 0 ? value : null;
}

/**
 * Verifies bearer tokens through the configured OIDC provider's JWKS (issuer, audience, signature,
 * expiry). Local development and CI may also accept HS256 tokens from the dev-token scripts;
 * configuration refuses that secret in staging and production.
 */
@Injectable()
export class TokenVerifier {
  private readonly jwks?: JWTVerifyGetKey;
  private readonly devSecret?: Uint8Array;

  constructor(
    @Inject(APP_CONFIG) private readonly config: ServiceConfig,
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
        const { payload } = await jwtVerify(token, this.devSecret, { issuer: DEV_ISSUER, algorithms: ['HS256'] });
        return payload;
      }
      if (this.jwks && this.config.auth.issuer) {
        const { payload } = await jwtVerify(token, this.jwks, {
          issuer: this.config.auth.issuer,
          audience: this.config.auth.audiences.length > 0 ? [...this.config.auth.audiences] : undefined,
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

const PUBLIC_KEY = 'oxinov:public';

/** Marks a route that needs no authentication (health, readiness, metrics, public catalogues). */
export const Public = () => SetMetadata(PUBLIC_KEY, true);

/** Global guard: every route requires a verified bearer token unless marked @Public(). */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly verifier: TokenVerifier,
    @Inject(IDENTITY_RESOLVER) private readonly identities: IdentityResolver,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [context.getHandler(), context.getClass()]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<KitRequest>();
    const header = request.header('authorization') ?? '';
    const match = /^Bearer\s+(\S+)$/i.exec(header);
    if (!match?.[1]) throw CommonErrors.unauthenticated();

    const identity = await this.verifier.verify(match[1]);
    if (!identity) throw CommonErrors.unauthenticated();

    request.user = await this.identities.resolve(identity);
    return true;
  }
}
