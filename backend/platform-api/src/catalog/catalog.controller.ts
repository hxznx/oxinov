import { Controller, Get } from '@nestjs/common';
import { Public } from '@oxinov/server-kit';
import { currentPolicies } from '../accounts/policies';
import { DatabaseContext } from '../database/database-context.service';

/** Public catalogues: launched products for the app launcher and current policy versions. */
@Controller('v1')
export class CatalogController {
  constructor(private readonly db: DatabaseContext) {}

  /** FR-PORTAL-3102: unlaunched products never appear. */
  @Public()
  @Get('products')
  async products(): Promise<{ data: { key: string; name: string; address: string }[] }> {
    const rows = await this.db.catalog((client) =>
      client.product.findMany({ where: { launched: true }, select: { key: true, name: true, address: true }, orderBy: { key: 'asc' } }),
    );
    return { data: rows };
  }

  /** FR-POLICY-2401: the versions a person accepts on the welcome screen. */
  @Public()
  @Get('policies/current')
  async policies(): Promise<{ data: Awaited<ReturnType<typeof currentPolicies>> }> {
    return { data: await this.db.catalog((client) => currentPolicies(client)) };
  }
}
