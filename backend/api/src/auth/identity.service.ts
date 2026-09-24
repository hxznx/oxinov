import { Injectable } from '@nestjs/common';
import type { AuthUser } from '../common/request';
import { DatabaseContext } from '../database/database-context.service';
import { Prisma } from '../generated/prisma/client';
import type { VerifiedIdentity } from './token-verifier';

/**
 * Maps a verified identity to its global UserProfile, creating it on first sign-in. Tenant roles
 * are never taken from the token; they come from PostgreSQL memberships (docs/api/AUTH.md).
 */
@Injectable()
export class IdentityService {
  constructor(private readonly db: DatabaseContext) {}

  async resolve(identity: VerifiedIdentity): Promise<AuthUser> {
    try {
      return await this.resolveOnce(identity);
    } catch (error) {
      // Two first requests from a new user raced to create the profile; the loser reads the winner's.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return this.resolveOnce(identity);
      }
      throw error;
    }
  }

  private resolveOnce(identity: VerifiedIdentity): Promise<AuthUser> {
    return this.db.run({ authSubject: identity.subject }, async (tx) => {
      const existing = await tx.userProfile.findUnique({
        where: { authSubject: identity.subject },
      });

      let profile = existing;
      if (!profile) {
        profile = await tx.userProfile.create({
          data: {
            authSubject: identity.subject,
            email: identity.email ?? null,
            emailVerified: identity.emailVerified ?? false,
            displayName: identity.name ?? null,
          },
        });
      } else {
        // The identity provider is the source of truth for claims it sends; absent claims keep
        // the stored value. A changed email is unverified unless the token says otherwise.
        const emailChanged = identity.email !== undefined && identity.email !== profile.email;
        const emailVerified =
          identity.emailVerified ?? (emailChanged ? false : profile.emailVerified);
        if (emailChanged || emailVerified !== profile.emailVerified) {
          profile = await tx.userProfile.update({
            where: { id: profile.id },
            data: { email: identity.email ?? profile.email, emailVerified },
          });
        }
      }

      return {
        userId: profile.id,
        authSubject: profile.authSubject,
        email: profile.email,
        emailVerified: profile.emailVerified,
      };
    });
  }
}
