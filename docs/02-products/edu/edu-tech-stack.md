# Technology stack: Oxinov Edu

**Scope:** the Oxinov Edu product. Company-wide choices are in the [company stack](../../04-architecture/tech-stack.md); what runs today is in [CURRENT-STATE.md](../../04-architecture/current-state.md). **Updated:** 2026-09-26 (ADR-017, ADR-018, ADR-021). Record changes in [ADR.md](../../04-architecture/adr/README.md).

**Status:** Current · **Owner:** Founder · **Last reviewed:** 2026-09-29

PostgreSQL is the system of record. Add any other data technology only for a documented need, with an owner, backup policy, and tenant-isolation design. Versions are pinned exactly (pnpm strict catalog, image digests).

| Layer | Today | Next step and trigger |
| --- | --- | --- |
| Web app (`frontend/products/edu-web`) | Next.js 16 App Router, React 19, TypeScript 5.9, Tailwind CSS 4 with `@oxinov/design-system` tokens; server components and server actions call the API from the server, so the browser never holds tokens (`@oxinov/web-auth`) | Generated OpenAPI client (ADR-019 step 6); Playwright end-to-end tests for the critical journeys |
| API (`backend/products/edu-api`) | NestJS 11, Prisma 7, class-validator DTOs, versioned REST with generated OpenAPI (`packages/contracts/openapi.json`), `@oxinov/server-kit` for hardening, health, readiness, and metrics | OpenTelemetry traces (ADR-019 step 5); backward-compatibility check on the OpenAPI contract in CI |
| Database | PostgreSQL 18 (`database/products/edu`), Prisma migrations applied by the `migrate` hook job, row-level security with a non-bypass request role, tenant context per transaction (ADR-006) | Amazon RDS at scale-out (ADR-018) |
| Lesson media | Private S3 with presigned upload and playback URLs; player with speed, resume, completion, and transcripts | HLS through MediaConvert or Mux with signed playback when adaptive streaming is needed (ADR-021) |
| Files and resources | Private S3 (PDF, EPUB, Office, images, ZIP) with tenant-checked downloads | Upload malware scanning (security roadmap #3) |
| Identity | One Oxinov account through Keycloak (OIDC); email one-time code now; Google and Apple sign-in per ADR-011 when configured | Staff MFA (TOTP) |
| Email | Amazon SES through `mail-relay` | Announcement and notification emails |
| Background work | None yet: exam auto-submit happens on read and on submit; no queue | `edu-worker` with SQS when retries, schedules, or bulk email need it (ADR-021) |
| Realtime chat | Not built; class stream and lesson Q&A use normal requests | `edu-chat` WebSocket gateway when live chat is approved |
| Mobile | Not built; the web app works in mobile browsers | React Native with Expo against the same API (NFR-14) |
| Payments | Not built: paid courses show that payment is coming and unlock only after a verified payment event | Provider adapter and ledger (Khalti, eSewa, and an international provider) |
| AI | Not built | Governed AI gateway (ADR-014, [AI architecture](../../04-architecture/ai-architecture.md)) |
| Tests | Jest unit and PostgreSQL integration tests (two-tenant denial), media tests against S3-compatible storage, web unit tests, static-export tests | Playwright end-to-end, contract, load, and restore tests ([testing strategy](../../08-engineering/testing-strategy.md)) |

## Tenancy

One shared PostgreSQL database with tenant-scoped tables, application membership checks, and PostgreSQL row-level security (ADR-006). The request role cannot bypass RLS, tenant context is transaction-local, and tests cover allowed and denied cross-tenant paths. A dedicated database per customer is an optional tier that needs an ADR.

## Implementation references

- [Next.js App Router](https://nextjs.org/docs/app)
- [NestJS modules](https://docs.nestjs.com/modules)
- [Prisma with PostgreSQL](https://www.prisma.io/docs/orm/overview/databases/postgresql)
- [PostgreSQL row-level security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Amazon S3 presigned URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html)
- [Expo Android App Bundle submission](https://docs.expo.dev/submit/android/)
- [Khalti payment gateway](https://docs.khalti.com/)
- [eSewa payment API](https://developer.esewa.com.np/)
