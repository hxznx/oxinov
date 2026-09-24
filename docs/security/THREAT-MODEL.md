# Threat model

| Threat | Primary control | Verification |
| --- | --- | --- |
| Cross-tenant data access | Membership checks + PostgreSQL RLS + scoped storage | Two-tenant negative tests |
| Payment event spoof/replay | Provider signature + unique event ID | Webhook integration tests |
| Prompt injection / AI overreach | Allowlisted commands + preview + approval | Adversarial prompt tests |
| Uploaded malware or unsafe code | Type/size checks, scanning, isolated future labs | Upload and lab tests |
| Admin takeover | MFA, least privilege, audit, session revocation | Auth tests and review |
| Lost container/host | Durable volumes, encrypted backups, restore drills | Recovery exercise |

Update this model when a new integration, tenant isolation tier, or mobile payment route is added.

## Detection coverage

- Emit `tenant.cross_access.denied` for cross-tenant controls and treat any confirmed disclosure as critical.
- Emit privileged membership, ownership, MFA, session, API-key, payout, refund, and export changes.
- Emit invalid webhook signatures, replay detections, malware findings, prompt-injection blocks, and security-control changes.
- Feed application events, identity-provider risk events, AWS audit and GuardDuty Runtime Monitoring findings, database audit events, and any later Falco findings to the SIEM.
- Map each high or critical detection to a tested runbook under `security/soc/runbooks/`.
