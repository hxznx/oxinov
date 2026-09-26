# External integrations

**Updated:** 2026-09-26. Live today: Keycloak, Amazon SES, and Amazon S3. Everything else is planned and needs its provider decision and secret record ([secrets](../security/SECRETS-MANAGEMENT.md)) before use.

| System | Purpose | Required controls |
| --- | --- | --- |
| OIDC provider / Keycloak baseline | Company-wide identity, organizations, MFA, and sessions | Validate issuer, audience, signature, expiry, and scopes server-side; map identity to platform and product authorization records. |
| Google and Apple sign-in | Customer sign-in through the OIDC provider (ADR-011) | Accept only verified emails; request only email, name, and photo scopes; brokered through Keycloak, never in product code. |
| SMS provider (Nepal) | Phone verification for trust level T2 and security notices | Provider adapter, rate limits, code expiry, delivery status, no codes in logs. |
| KYC verification provider (optional) | Document and identity checks for T3/T4 | Private document transfer, data-processing agreement, retention limits, human review of decisions. |
| Licensed bank escrow or settlement partner | Commodity Market milestone escrow and seller payouts (ADR-013) | Server-verified status, idempotent ledger entries, reconciliation, no Oxinov stored-value balance. |
| ConnectIPS and bank transfer | Higher-value Nepal payments | Provider adapter, verified confirmation, reconciliation to the ledger. |
| Market price data sources | Commodity price tickers and indices | Licensed or public sources only, attribution, import validation, stale-data flags. |
| Khalti/eSewa for Nepal and eligible international payment providers | Web payments, SaaS plans, purchases, refunds, and payouts where supported | Use provider adapters; verify status server-side, process event IDs idempotently, map organization/product context, and reconcile to the internal ledger. |
| Apple/Google billing | Mobile digital purchases where required | Verify receipts server-side; normalize entitlements. |
| Amazon S3 (today) / Mux or MediaConvert (later, ADR-021) | Recorded video, audio, and files | Private bucket, presigned upload and playback after tenant and role checks; signed HLS playback when adaptive streaming arrives. |
| Amazon SES (email, live) and push providers (later) | Sign-in codes today; announcements and alerts later | Instance role only, sender fixed to `no-reply@oxinov.com`, bounce and complaint suppression with alerts; templates, opt-in, retries, and delivery status. |
| AI provider | Draft content and configuration | Tenant permission, limits, review, prompt/data minimization. |
| SIEM / OpenSearch Security Analytics | Security event search, findings, correlation, and alerts | Separate analyst access, schema validation, encryption, retention/residency, immutable administration audit, tested notification routes. |
| Amazon GuardDuty (security roadmap) | AWS account, EC2, and later EKS runtime threat detection | Organization delegation, automated agent coverage, private endpoint connectivity, coverage alarms, finding forwarding, cost monitoring, and tested response. |
| Falco | Linux/Kubernetes runtime detection | Least required host capabilities, reviewed rules, controlled event forwarding, noise tuning, and deployment health monitoring. |
| Wazuh (optional) | Endpoint/host inventory, vulnerability and file-integrity monitoring | Agent enrollment, encrypted channels, RBAC/MFA, retention, upgrade ownership, and avoidance of duplicate SIEM alerts. |

Provider credentials live in SSM Parameter Store (or Secrets Manager where rotation is needed, ADR-021), never in the repository. See [API](../api/API-SPEC.md) and [secrets policy](../security/SECRETS-MANAGEMENT.md).
