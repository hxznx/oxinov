# Environments

| Environment | Purpose | Data |
| --- | --- | --- |
| Local | Developer work through Compose | Synthetic only |
| CI | Disposable integration tests | Synthetic, recreated per run |
| Staging | Production-like release rehearsal | Sanitized or synthetic |
| Production | Customer accounts, LMS workspaces, and marketplace data across all launched products | Protected, backed up |

Use the same immutable application images across staging and production. Separate AWS accounts or approved account boundaries, VPCs, credentials, domains, storage, databases, KMS keys, and payment modes. Tenant test data must never leak into production. AWS Mumbai is the primary region; exact production sizing and service quotas remain implementation decisions. See [AWS cloud architecture](../architecture/AWS-CLOUD-ARCHITECTURE.md).

Local and CI use synthetic security events only. Staging sends synthetic events to a non-production SIEM for detection and runbook tests. Production security events and incident evidence use production-only access, encryption, retention, and notification channels.
