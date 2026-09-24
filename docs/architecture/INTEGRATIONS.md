# External integrations

| System | Purpose | Required controls |
| --- | --- | --- |
| OIDC provider / Keycloak baseline | Company-wide identity, organizations, MFA, and sessions | Validate issuer, audience, signature, expiry, and scopes server-side; map identity to platform and product authorization records. |
| Khalti/eSewa for Nepal and eligible international payment providers | Web payments, SaaS plans, purchases, refunds, and payouts where supported | Use provider adapters; verify status server-side, process event IDs idempotently, map organization/product context, and reconcile to the internal ledger. |
| Apple/Google billing | Mobile digital purchases where required | Verify receipts server-side; normalize entitlements. |
| Mux | Hosted recorded video | Signed playback, upload callbacks, tenant media mapping. |
| Email/push providers | Verification, announcements, alerts | Templates, opt-in, retries, delivery status. |
| AI provider | Draft content and configuration | Tenant permission, limits, review, prompt/data minimization. |
| SIEM / OpenSearch Security Analytics | Security event search, findings, correlation, and alerts | Separate analyst access, schema validation, encryption, retention/residency, immutable administration audit, tested notification routes. |
| Amazon GuardDuty Runtime Monitoring | ECS Fargate runtime threat detection and AWS findings | Organization delegation, automated agent coverage, private endpoint connectivity, coverage alarms, finding forwarding, cost monitoring, and tested response. |
| Falco | Linux/Kubernetes runtime detection | Least required host capabilities, reviewed rules, controlled event forwarding, noise tuning, and deployment health monitoring. |
| Wazuh (optional) | Endpoint/host inventory, vulnerability and file-integrity monitoring | Agent enrollment, encrypted channels, RBAC/MFA, retention, upgrade ownership, and avoidance of duplicate SIEM alerts. |

Provider credentials live in a secrets manager, never in the repo. See [API](../api/API-SPEC.md) and [secrets policy](../security/SECRETS-MANAGEMENT.md).
