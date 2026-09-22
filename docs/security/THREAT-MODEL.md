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
