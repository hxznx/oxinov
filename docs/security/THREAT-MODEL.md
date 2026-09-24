# Threat model

Covers the Oxinov platform (sign-in, account portal, shared services), OxinovLMS, and the adopted marketplace products (Agri Market, Jobs, Services Market). Update this model when a new product, integration, tenant isolation tier, sign-in method, or payment route is added.

## Platform and identity

| Threat | Primary control | Verification |
| --- | --- | --- |
| Account takeover through Google account linking | Link only verified emails; immutable internal user ID; notify on new sign-in method | Linking tests with unverified and mismatched emails |
| Email one-time-code brute force or flooding | Six-digit single-use codes, 10-minute expiry, per-email and per-IP rate limits, lockout | Rate-limit and replay tests |
| Session or refresh-token theft | Short access tokens, rotating refresh tokens, HTTP-only cookies, PKCE, sign-out everywhere | Token reuse detection tests |
| Open redirect or token leakage in SSO | Registered redirect URIs only, state and nonce checks | OIDC conformance tests |
| Trust-level bypass | Products check trust level and policy acceptance server-side from the platform, never from client input | Negative tests per product action |
| Admin or staff takeover | Separate staff identities, mandatory MFA, least privilege, audit, session revocation | Auth tests and access review |
| KYC document leak | Private encrypted storage, short-lived signed URLs, reviewer-only access, access audit, retention limits | Access-control and audit tests |
| Forged or stolen identity documents | Reviewer checks, duplicate-document detection, liveness or provider checks where approved | KYC review exercises |

## Product data

| Threat | Primary control | Verification |
| --- | --- | --- |
| Cross-tenant or cross-owner data access | Membership and ownership checks + PostgreSQL RLS + scoped storage | Two-tenant and two-owner negative tests |
| Cross-product data access | Separate databases and service accounts; products use platform APIs only | Credential scope tests |
| Uploaded malware or unsafe files | Type and size checks, scanning, private storage | Upload tests |
| Prompt injection and AI overreach | Allowlisted typed actions, preview, and approval | Adversarial prompt tests |

## Marketplaces

| Threat | Primary control | Verification |
| --- | --- | --- |
| Fake sellers, providers, or employers | T3/T4 verification before listing, posting, or payout; reports and enforcement ladder | Onboarding and enforcement tests |
| Fake jobs and recruitment scams | Business-verified employers, moderation, no fees charged to candidates, report button | Moderation queue tests |
| Payment spoofing or replay | Server-side provider verification, signed webhooks, unique event IDs, idempotent ledger | Webhook integration tests |
| Order, booking, or refund fraud | State-machine rules, limits for new accounts, dispute workflow, anomaly alerts | Lifecycle and abuse tests |
| Off-platform payment steering and phishing in messages | Link warnings, contact-detail detection, reporting, T2 required to message | Messaging abuse tests |
| Fake or manipulated reviews | Reviews only after completed orders or bookings, one per transaction, anomaly detection | Review rule tests |
| Harassment or unsafe contact | Blocking, reporting, rate limits, restriction of messaging role | Safety workflow tests |
| Scraping of contact data | Contact details hidden until an order, booking, or application exists; rate limits | Rate-limit tests |

## Operations

| Threat | Primary control | Verification |
| --- | --- | --- |
| Lost container or host | Durable managed data stores, encrypted backups, restore drills | Recovery exercise |
| Leaked secrets in source repositories | Secret scanning in CI, Secrets Manager, rotation on exposure | CI gate and rotation drill |

## Detection coverage

- Emit `tenant.cross_access.denied` for cross-tenant controls and treat any confirmed disclosure as critical.
- Emit sign-in, sign-in-method change, one-time-code abuse, refresh-token reuse, trust-level change, policy acceptance, KYC decision, and account restriction events.
- Emit privileged membership, ownership, MFA, session, API-key, payout, refund, and export changes.
- Emit invalid webhook signatures, replay detections, malware findings, prompt-injection blocks, marketplace fraud signals, and security-control changes.
- Feed application events, identity-provider risk events, AWS audit and GuardDuty Runtime Monitoring findings, database audit events, and any later Falco findings to the SIEM.
- Map each high or critical detection to a tested runbook under `security/soc/runbooks/`.
