# Security baseline

**Updated:** 2026-09-26. What runs today is recorded in [current state](../architecture/CURRENT-STATE.md#security-controls-in-production); related documents are the [threat model](THREAT-MODEL.md), [SOC design](SOC.md), [secrets](SECRETS-MANAGEMENT.md), and [privacy](PRIVACY.md).

## Standard

Use the OWASP ASVS 5.0 Level 2 controls relevant to deployed features, the OWASP Top 10 for web apps and APIs, and the CIS Kubernetes and AWS Foundations benchmarks as review checklists. Security gates are never weakened to ship (AGENTS.md).

## Controls by layer

| Layer | Required control | State |
| --- | --- | --- |
| Identity | One Oxinov account through Keycloak (OIDC, PKCE); passwordless for customers (ADR-011); MFA for staff and administrators; server-side trust levels and policy acceptance | Customer sign-in in place (email one-time code, realm brute-force protection, admin console not public); **staff MFA (TOTP) for administrators is open** |
| Authorization | Tenant membership in the API **and** PostgreSQL row-level security with a non-bypass request role (ADR-006); denied cross-tenant paths tested with two tenants | In place for Edu |
| Input and output | Validation at every boundary (class-validator, DTOs); stable error codes; no stack traces to clients; output encoding by React; JSON-LD escaped | In place |
| HTTP | HTTPS only with HSTS; security headers and rate limits from `@oxinov/server-kit`; APIs have no public host (browsers call the web apps, which call the APIs server-side), so no cross-origin access is allowed | In place |
| Files | Private S3, short-lived presigned URLs after tenant and role checks, size and type limits | In place; malware scanning of uploads before sharing is open |
| Secrets | Parameter Store SecureStrings and encrypted Kubernetes Secrets; nothing in Git, images, Terraform state, logs, or prompts | In place |
| Cloud access | GitHub OIDC and instance roles only; no SSH (Systems Manager); IMDSv2; least-privilege IAM (for example SES limited to `no-reply@oxinov.com`) | In place |
| Workloads | Non-root numeric users, no capabilities, read-only root filesystems where possible, deny-by-default network policies, resource limits | In place |
| Supply chain | Pinned versions with checksums or digests, one lockfile, pnpm build-script allow-list, immutable image tags, Trivy gates, Dependabot | In place; signed images and SBOMs are on the roadmap |
| Data | Encryption at rest (EBS, S3, Kubernetes Secrets, KMS for email events); nightly backups and snapshots; no card numbers stored | In place |
| Payments | Server-verified provider results, signed webhooks processed once, ledger without customer balances (ADR-013) | Required before checkout ships |
| Audit and detection | Normalized security events (`security/soc/event-schema.json`) without sensitive payloads | Schema in place; production SIEM is on the roadmap |

## Roadmap

Each item states its trigger and approximate monthly cost; none is enabled without the owner's approval (cost is a requirement, [cost optimization](../devops/COST-OPTIMIZATION.md)).

| # | Control | Why | Cost (approx.) | Trigger |
| --- | --- | --- | --- | --- |
| 0 | **Staff MFA (TOTP)** required for Keycloak administrators and platform operators | Stops takeover of privileged accounts | Free | **Now** |
| 1 | **CloudTrail trail** for management events to an encrypted, lifecycle-managed S3 bucket (Terraform) | Keeps a tamper-evident record of every AWS API call beyond the 90-day console history | Under US$1 (one management-event trail is free; S3 storage only) | **Now** |
| 2 | **GuardDuty** (foundational: CloudTrail, VPC flow, DNS) with findings emailed through SNS | Detects credential misuse, crypto-mining, and malicious traffic | About US$1–5 at current volume (30-day free trial shows the real figure) | **Now** |
| 3 | Malware scanning of uploads (for example GuardDuty Malware Protection for S3) | Uploaded files are shared with other learners | Per GB scanned | Before public sign-up or first paying school |
| 4 | Image signing (cosign keyless with GitHub OIDC) and SBOMs attached to each release | Proves images came from our pipeline | Free | With the next delivery change |
| 5 | CodeQL and dependency review | Code-level vulnerability scanning | GitHub Advanced Security licence, or free if the repository becomes public | Owner decision |
| 6 | AWS WAF on CloudFront and a CDN in front of the apps | Bot and abuse protection | From about US$6 | Public launch or abuse seen |
| 7 | AWS Config, Security Hub, and a SIEM with Sigma detections (SOC design) | Continuous compliance and correlation | US$10+ | Paying customers or regulated data (Market KYC and escrow) |
| 8 | Penetration test and ASVS review | Independent assurance | One-off | Before the first paying school |

## Incident basics

Report security issues to `security@oxinov.com` (published in `/.well-known/security.txt`). Runbooks and templates live under `security/`. On a suspected leak: rotate the affected secret in Parameter Store, redeploy, review CloudTrail and application logs, and record the incident.
