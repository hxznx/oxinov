---
name: oxinov-secrets-and-crypto
description: Manage secrets and use cryptography correctly at Oxinov - where secrets live (SSM Parameter Store, Kubernetes Secrets, local .env), rotation, keeping secrets out of Git, images, logs, and state, encryption in transit and at rest, sealed sessions, signatures and HMAC with constant-time comparison, secure randomness, and common cryptographic mistakes. Use when adding a secret, key, signature check, token, or anything encrypted.
---

# Secrets and cryptography

Sources: [secrets management](../../../docs/09-security/secrets-management.md), [secure development standard](../../../docs/09-security/secure-development-standard.md), [security baseline](../../../docs/09-security/security-baseline.md).

## Where secrets live

| Place | Holds | Rule |
| --- | --- | --- |
| SSM Parameter Store (SecureString) | Production secrets: database passwords, client secrets, session secrets, provider keys | The owner adds or rotates them; never through Git or chat |
| Kubernetes Secret `oxinov-app` | The same values on the node, rendered by `bootstrap-node.sh` | Referenced as environment variables in the chart, never written into values files |
| Local `.env` files | Your own local values | Ignored by Git and Docker; `.env.example` has placeholders only |
| GitHub | No long-lived cloud keys; CI uses OIDC roles | - |

## Steps to add a secret

1. Add a placeholder to the right `.env.example` (for example `change-me-...`) and read it in the service's configuration with validation (minimum length, required in production).
2. Ask the owner to create the Parameter Store entry; give them the name and how to generate the value (for example `openssl rand -base64 48`). Never generate or see production values yourself.
3. Map it in the chart as a secret reference, and in `bootstrap-node.sh` if it is new.
4. Document it in [secrets management](../../../docs/09-security/secrets-management.md) with its owner and rotation.
5. Check that it never reaches logs (the logger redacts keys such as `secret`, `token`, `password`, `authorization`, `cookie`), errors, images, or Terraform state.

## Encryption

| Where | How |
| --- | --- |
| In transit, public | TLS by Traefik with Let's Encrypt; HSTS one year; CloudFront HTTPS for `oxinov.com` |
| In transit, AWS | HTTPS to SES, S3, SSM |
| At rest | Encrypted EBS disk and snapshots; S3 server-side encryption; encrypted Terraform state bucket |
| Sessions | AES-256-GCM sealed cookies (`jose` `EncryptJWT`, `dir` + `A256GCM`) with purpose-separated keys |

## Use cryptography correctly

- Use `jose` and `node:crypto` only; never write your own algorithm, padding, or token format.
- Compare signatures, HMACs, and secrets with `timingSafeEqual` after checking lengths (see `payments/providers.ts`), never `===`.
- Random values: `randomUUID()` or `randomBytes()`; never `Math.random()` for IDs, codes, or tokens.
- Fix the accepted algorithms when verifying (`RS256`, `ES256` for access tokens); never accept `none` or let the token choose.
- Keys are at least 256 bits of randomness; derive per-purpose keys instead of reusing one key for two jobs.
- Passwords are not stored at all (no customer passwords). If a hash is ever needed for a secret value, use a slow, salted algorithm (Argon2id or scrypt), not SHA-256.
- Short codes people type (join codes, certificate codes) need enough length and rate limits; they are not secrets for protecting data on their own.

## Common mistakes to reject in review

Secrets in code, tests, fixtures, screenshots, or commit messages; secrets in URLs; logging a request's headers; reusing the session secret for another purpose; comparing HMACs with `===`; `Math.random()` tokens; disabling TLS verification; encryption without authentication (for example AES-CBC without a MAC).

## If a secret leaks

Tell the owner at once with what leaked, where, and since when; the owner rotates it. Do not repeat the value. Rewriting Git history does not un-leak it; rotation does.
