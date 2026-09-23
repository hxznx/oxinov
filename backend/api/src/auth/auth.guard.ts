import { CanActivate, ExecutionContext, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Errors } from '../common/errors';
import type { AppRequest } from '../common/request';
import { IdentityService } from './identity.service';
import { TokenVerifier } from './token-verifier';

const PUBLIC_KEY = 'oxinov:public';

/** Marks a route that needs no authentication (health, readiness, metrics). */
export const Public = () => SetMetadata(PUBLIC_KEY, true);

/** Global guard: every route requires a verified bearer token unless marked @Public(). */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly verifier: TokenVerifier,
    private readonly identities: IdentityService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AppRequest>();
    const header = request.header('authorization') ?? '';
    const match = /^Bearer\s+(\S+)$/i.exec(header);
    if (!match?.[1]) throw Errors.unauthenticated();

    const identity = await this.verifier.verify(match[1]);
    if (!identity) throw Errors.unauthenticated();

    request.user = await this.identities.resolve(identity);
    return true;
  }
}
