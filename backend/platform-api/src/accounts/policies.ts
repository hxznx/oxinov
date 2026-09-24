import type { Tx } from '../database/database-context.service';
import type { PolicyRef } from './account.types';

export interface CurrentPolicy extends PolicyRef {
  title: string;
  url: string;
  material: boolean;
  requiredForSignup: boolean;
}

/** Latest effective version of every policy (FR-POLICY-2401). Future-dated versions are ignored. */
export async function currentPolicies(tx: Pick<Tx, 'policy'>, now = new Date()): Promise<CurrentPolicy[]> {
  const rows = await tx.policy.findMany({
    where: { effectiveAt: { lte: now } },
    orderBy: [{ id: 'asc' }, { version: 'desc' }],
  });
  const latest = new Map<string, CurrentPolicy>();
  for (const row of rows) {
    if (!latest.has(row.id)) {
      latest.set(row.id, {
        policyId: row.id,
        version: row.version,
        title: row.title,
        url: row.url,
        material: row.material,
        requiredForSignup: row.requiredForSignup,
      });
    }
  }
  return [...latest.values()];
}

/**
 * Sign-up policies the person still has to accept. A newer material version needs re-acceptance;
 * a newer minor version is satisfied by any earlier acceptance (FR-POLICY-2404).
 */
export async function outstandingPolicies(tx: Tx, userId: string, now = new Date()): Promise<CurrentPolicy[]> {
  const required = (await currentPolicies(tx, now)).filter((policy) => policy.requiredForSignup);
  const accepted = await tx.policyAcceptance.findMany({
    where: { userId, policyId: { in: required.map((policy) => policy.policyId) } },
    select: { policyId: true, policyVersion: true },
  });
  return required.filter((policy) => {
    const versions = accepted.filter((row) => row.policyId === policy.policyId).map((row) => row.policyVersion);
    if (versions.includes(policy.version)) return false;
    return policy.material || versions.length === 0;
  });
}

export const policyKey = (policy: PolicyRef): string => `${policy.policyId}@${policy.version}`;
