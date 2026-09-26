# Security operations and SOC

**Status (2026-09-26, ADR-021):** this is the target SOC design. Today production has CI scanning (Trivy), the security-event schema, CloudWatch alarms, and no SIEM; the next steps with costs are in the [security roadmap](SECURITY.md#roadmap). Production runs on k3s on EC2 (ADR-018), so runtime detection is GuardDuty (EC2 and, at scale, EKS Runtime Monitoring) or Falco, not ECS Fargate.

## Purpose

Security operations is separate from product observability. Prometheus and Grafana answer whether the platform is healthy and fast. The SOC pipeline answers whether an attacker, compromised account, unsafe configuration, vulnerable component, or policy violation threatens the platform or tenant data.

## Recommended baseline

| Layer | Baseline | Purpose |
| --- | --- | --- |
| Source and configuration security | CodeQL, dependency review, Trivy, and secret scanning in GitHub Actions | Detect vulnerable code/dependencies, exposed credentials, container issues, and IaC misconfiguration before release. |
| Application security events | Versioned JSON event contract in `security/soc/event-schema.json` | Normalize authentication, authorization, tenant-isolation, payment, malware, data-access, and configuration events. |
| SIEM and detections | OpenSearch Security Analytics or a compatible managed SIEM with Sigma rules | Store and search security events, create findings, correlate activity, and route security alerts. |
| Runtime detection | Amazon GuardDuty (foundational now; EC2 and EKS Runtime Monitoring as workloads grow) or Falco on the Kubernetes nodes | Detect suspicious container, process, file, network, AWS credential, and Kubernetes behavior using a control compatible with the compute platform. |
| Endpoint/host option | Wazuh when managed endpoints or host agents are required | Add endpoint inventory, vulnerability detection, file-integrity monitoring, configuration assessment, and host response. |
| Incident response | Version-controlled runbooks plus protected evidence storage | Make investigation, containment, recovery, communication, and review repeatable. |

Do not deploy both OpenSearch Security Analytics and Wazuh as competing SIEMs without an ADR defining ownership, data flow, cost, retention, and duplicate-alert handling. For the initial cloud application, use OpenSearch Security Analytics as the default SIEM. Select Wazuh instead or integrate it later when endpoint and server-agent capabilities justify it.

## Security-event flow

```text
Identity / API / worker / chat / database audit / AWS / GuardDuty runtime
                         |
                         v
             collector and schema validation
                         |
                         v
              access-controlled SIEM storage
                         |
               Sigma rules and correlation
                         |
                         v
             findings -> alerts -> SOC runbooks
                         |
                         v
        incident record and protected evidence store
```

Security events use the schema under `security/soc/`. They may include access-restricted internal tenant and actor identifiers needed for investigation. They must never contain passwords, tokens, session cookies, payment credentials, raw private messages, exam answers, request/response bodies, or raw AI prompts. Source IP addresses and user identifiers are protected personal or pseudonymous data and require access, retention, and deletion controls.

## Minimum event catalog

- Sign-in success/failure, MFA enrollment/removal, session revocation, and identity-provider risk events.
- Authorization denial, cross-tenant denial, privileged role or ownership changes, and support impersonation.
- API key creation/revocation, rate-limit abuse, suspicious export, and bulk data access.
- Invalid payment/webhook signatures, replay detection, fulfillment failures, refunds, and payout configuration changes.
- Malware/upload scan findings, unsafe file access, AI prompt-injection blocks, and secret-access denial.
- Deployment, configuration, database-policy, backup, and security-control changes.
- GuardDuty runtime findings, AWS audit, firewall/WAF, and selected database audit events in production; Falco findings when EKS/EC2 workloads deploy it.

## Severity and service targets

| Severity | Example | Initial response target |
| --- | --- | --- |
| Critical | Confirmed cross-tenant disclosure, active compromise, leaked production signing/payment secret | Acknowledge within 15 minutes when production on-call is active |
| High | Privileged account takeover indicators, malware detection, unauthorized role/payout change | Acknowledge within 30 minutes |
| Medium | Invalid webhook burst, repeated denied enumeration, vulnerable internet-facing component | Review within 4 hours |
| Low | Policy drift or isolated low-confidence finding | Review within 2 business days |

These targets require a named on-call owner and should be adjusted before launch based on staffing, customer contracts, and legal obligations.

## Retention and access

Separate security-event storage from application analytics. Use least-privilege analyst roles, MFA, immutable audit logs, encryption, retention by event class, legal hold, and export/deletion procedures. Keep incident evidence outside Git in an approved encrypted store and record hashes and custody.

## Implementation order

1. Enable CI repository and configuration scanning.
2. Implement and test the security-event schema in the API, worker, chat, and identity webhook paths.
3. Send synthetic events to the selected SIEM and validate Sigma rules with synthetic events.
4. Assign alert owners and exercise the cross-tenant, account-takeover, and payment-webhook runbooks.
5. CloudTrail and GuardDuty are enabled (2026-09-26); next, GuardDuty Runtime Monitoring or Falco for the Kubernetes nodes.
6. Decide whether Wazuh endpoint/host monitoring is required.

References: [OpenSearch Security Analytics](https://docs.opensearch.org/latest/security-analytics/), [GuardDuty Runtime Monitoring](https://docs.aws.amazon.com/guardduty/latest/ug/runtime-monitoring.html), [Falco runtime security](https://falco.org/docs/), [Wazuh components](https://documentation.wazuh.com/current/getting-started/components/index.html), and [GitHub CodeQL](https://docs.github.com/en/code-security/concepts/code-scanning/codeql/codeql-code-scanning).
