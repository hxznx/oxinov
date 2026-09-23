# Environments

| Environment | Purpose | Data |
| --- | --- | --- |
| Local | Developer work through Compose | Synthetic only |
| CI | Disposable integration tests | Synthetic, recreated per run |
| Staging | Production-like release rehearsal | Sanitized or synthetic |
| Production | Customer LMS workspaces | Protected, backed up |

Use the same immutable application images across staging and production. Separate credentials, domains, storage, databases, and payment modes. Tenant test data must never leak into production. Cloud provider and exact deployment target remain open decisions.

Local and CI use synthetic security events only. Staging sends synthetic events to a non-production SIEM for detection and runbook tests. Production security events and incident evidence use production-only access, encryption, retention, and notification channels.
