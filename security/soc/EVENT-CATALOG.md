# Security event catalog

Every event uses the envelope in `event-schema.json`. Add new actions through review, document their producer and privacy impact, and create detection/runbook coverage where the event is actionable.

| Event action | Producer | Default severity | Purpose |
| --- | --- | --- | --- |
| `auth.login.failed` | Identity webhook/API | 3 | Failed authentication without sensitive credentials |
| `auth.mfa.disabled` | Identity webhook/API | 7 | MFA removal from a protected account |
| `auth.session.revoked` | Identity webhook/API | 4 | Security or user initiated session revocation |
| `authorization.denied` | API/chat/worker | 3 | Role or ownership check denied |
| `tenant.cross_access.denied` | API/chat/worker/media/export | 8 | Cross-tenant access was prevented |
| `membership.role.changed` | API | 7 for privileged roles | Tenant or platform role assignment/change |
| `support.impersonation.started` | Platform API | 8 | Approved support-access session began |
| `api.rate_limit.triggered` | Edge/API/chat | 3 | Abuse control limited a source or actor |
| `data.export.requested` | API/worker | 5 | Sensitive export was requested |
| `payment.webhook.signature_invalid` | API | 5 | Provider webhook signature failed verification |
| `payment.webhook.replay_denied` | API/worker | 6 | Duplicate/replayed provider event was denied |
| `upload.malware.detected` | Upload scanner/worker | 9 | Malware scanner rejected uploaded content |
| `ai.prompt_injection.blocked` | AI adapter | 5 | AI safety boundary blocked a suspicious instruction |
| `ai.retrieval.cross_tenant_denied` | AI gateway/retriever | 8 | Retrieval attempted to cross the trusted tenant or product scope |
| `ai.sensitive_data.blocked` | AI gateway | 6 | Input or output policy blocked a prohibited sensitive data class |
| `ai.tool.authorization_denied` | AI gateway/application API | 7 | A proposed tool or parameters failed application authorization |
| `ai.budget.abuse_detected` | AI gateway/usage ledger | 5 | Repeated or abnormal usage exhausted or attempted to evade an AI budget |
| `security.configuration.changed` | Deployment/platform API | 7 | Security-relevant setting or policy changed |
| `security.secret_access.denied` | Secret manager/cloud audit | 8 | Unauthorized secret access was denied |
| `runtime.threat.detected` | GuardDuty/Falco/Wazuh | Source-defined | Runtime or endpoint rule created a finding |

Severity is contextual. Elevate events involving platform administrators, payments, secrets, confirmed compromise, successful access, or multiple tenants.
