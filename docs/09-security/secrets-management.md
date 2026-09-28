# Secrets management

**Updated:** 2026-09-26 (ADR-021).

**Status:** Current · **Owner:** Engineering lead · **Last reviewed:** 2026-09-29

`.env.example` files contain names and non-secret examples only; local `.env` files are ignored by Git. Secrets never appear in Docker images, Compose files, Kubernetes ConfigMaps, Terraform code or state, GitHub variables, logs, prompts, test fixtures, or mobile bundles.

## Production today

| Secret | Where it lives | Created by | Rotation |
| --- | --- | --- | --- |
| PostgreSQL passwords (owner and request roles per database) | SSM Parameter Store SecureString under `/oxinov/production/starter/` | Generated on the server on the first deploy | Rotate by replacing the parameter and redeploying; update the database role in the same step |
| Keycloak administrator and client secrets | Parameter Store | Generated on the server; realm configured by `devops/keycloak/configure-realm.sh` | On staff change or exposure |
| Web session secrets | Parameter Store | Generated on the server | Yearly or on exposure (signs everyone out) |
| Khalti and eSewa merchant keys (`KHALTI_SECRET_KEY`, `ESEWA_PRODUCT_CODE`, `ESEWA_SECRET_KEY`) | Parameter Store, same path | Entered by the owner from the providers' merchant dashboards; never generated or committed (ADR-023) | On staff change or exposure: regenerate in the merchant dashboard, replace the parameter, redeploy |
| AWS access for workloads | None: instance role through IMDSv2 | Terraform | Automatic (temporary credentials) |
| CI and deploy access to AWS | None: GitHub OIDC roles | Terraform | Automatic |

The node renders these parameters into one Kubernetes Secret, encrypted at rest by k3s, before every release (`bootstrap-node.sh`). Only the instance role can read the parameter path.

## Before each new integration

Record the owner, storage location, and rotation for each new secret here before it is used: payment providers (Khalti, eSewa, and others), push notifications, AI providers, SMS, and Android and iOS signing keys. Prefer keyless options (OIDC federation, instance roles) over stored keys. Use Secrets Manager only where automatic rotation is needed (ADR-021).

## On exposure

Revoke or rotate the secret immediately, redeploy, review who could have used it (CloudTrail and application logs), and record an incident. Never rewrite Git history as the only remedy; the secret stays compromised.
