import { Body, Controller, Get, HttpCode, Post, UseGuards, createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { Errors } from '../errors';
import type { AccountUser, PlatformRequest } from './account.types';
import { AcceptPoliciesDto, WelcomeDto } from './accounts.dto';
import { AccountsService, type AccountView, type EntitlementView } from './accounts.service';
import { ActiveAccountGuard } from './active-account.guard';

export const CurrentAccount = createParamDecorator((_: unknown, context: ExecutionContext): AccountUser => {
  const user = context.switchToHttp().getRequest<PlatformRequest>().user;
  if (!user) throw Errors.unauthenticated();
  return user;
});

/** The signed-in person's own account (app.oxinov.com). Every route requires a verified token. */
@Controller('v1/me')
export class MeController {
  constructor(private readonly accounts: AccountsService) {}

  @Get()
  async me(@CurrentAccount() user: AccountUser): Promise<{ data: AccountView }> {
    return { data: await this.accounts.me(user) };
  }

  @Post('welcome')
  @HttpCode(200)
  async welcome(@CurrentAccount() user: AccountUser, @Body() input: WelcomeDto): Promise<{ data: AccountView }> {
    return { data: await this.accounts.welcome(user, input) };
  }

  @Post('policy-acceptances')
  @HttpCode(200)
  async acceptPolicies(@CurrentAccount() user: AccountUser, @Body() input: AcceptPoliciesDto): Promise<{ data: AccountView }> {
    return { data: await this.accounts.acceptPolicies(user, input) };
  }

  @Get('entitlements')
  @UseGuards(ActiveAccountGuard)
  async entitlements(@CurrentAccount() user: AccountUser): Promise<{ data: EntitlementView[] }> {
    return { data: await this.accounts.entitlements(user) };
  }
}
