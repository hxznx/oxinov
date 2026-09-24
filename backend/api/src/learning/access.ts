import type { Tx } from '../database/database-context.service';
import type { Prisma } from '../generated/prisma/client';

/**
 * Course access is decided by the entitlement ledger only (FR-CATALOG-303): a non-revoked
 * entitlement whose period covers now, tied to an ACTIVE enrollment. Checkout redirects and
 * client claims never grant access.
 */
export async function hasActiveEntitlement(
  tx: Tx,
  tenantId: string,
  userId: string,
  courseId: string,
  now: Date = new Date(),
): Promise<boolean> {
  const count = await tx.entitlement.count({
    where: { tenantId, userId, courseId, ...activeEntitlementWhere(now), enrollment: { status: 'ACTIVE' } },
  });
  return count > 0;
}

/** Entitlements that grant access at `now`: not revoked and inside their period. */
export function activeEntitlementWhere(now: Date) {
  return {
    revokedAt: null,
    startsAt: { lte: now },
    OR: [{ endsAt: null }, { endsAt: { gt: now } }],
  } satisfies Prisma.EntitlementWhereInput;
}
