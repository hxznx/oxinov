# Security baseline

Use OWASP ASVS 5.0 Level 2 controls relevant to deployed features. Enforce tenant membership in the API and PostgreSQL RLS, test denied cross-tenant paths, and scope object-store keys, search, cache, queue, chat, and AI retrieval. Apply least privilege, MFA for administrators, secure session handling, rate limits, input validation, upload scanning, and signed media URLs.

Verify external webhook signatures and event idempotency. Store no card numbers. Log sensitive role, tenant, payment, and support actions as normalized security events without sensitive payloads. Use HTTPS and encryption at rest. CI blocks high and critical vulnerabilities, secrets, and security misconfiguration unless an approved exception has an owner and expiry. See [threat model](THREAT-MODEL.md), [SOC design](SOC.md), and [secrets](SECRETS-MANAGEMENT.md).
