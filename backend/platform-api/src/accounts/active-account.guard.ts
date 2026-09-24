import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { DatabaseContext } from '../database/database-context.service';
import { Errors } from '../errors';
import type { PlatformRequest } from './account.types';
import { outstandingPolicies, policyKey } from './policies';

/**
 * Protected account features need an ACTIVE account with every current sign-up policy accepted
 * (FR-ID-2205, FR-POLICY-2404). The error lists the policies so the client can show one step.
 */
@Injectable()
export class ActiveAccountGuard implements CanActivate {
  constructor(private readonly db: DatabaseContext) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const user = context.switchToHttp().getRequest<PlatformRequest>().user;
    if (!user) throw Errors.unauthenticated();
    if (user.status === 'SUSPENDED') throw Errors.accountSuspended();

    const outstanding = await this.db.run({ userId: user.userId }, (tx) => outstandingPolicies(tx, user.userId));
    if (user.status !== 'ACTIVE' || outstanding.length > 0) {
      throw Errors.policyAcceptanceRequired(outstanding.map(policyKey));
    }
    return true;
  }
}
