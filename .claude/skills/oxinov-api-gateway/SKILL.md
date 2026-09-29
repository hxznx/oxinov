---
name: oxinov-api-gateway
description: Design the Oxinov public API boundary (api.oxinov.com) - when a gateway is needed, Amazon API Gateway (HTTP, REST, WebSocket APIs) versus Traefik routing, JWT authorizers with Keycloak issuers and per-product audiences, scopes versus backend authorization, throttling, usage plans and API keys, WAF, CORS, custom domains and TLS, private integrations and VPC Link, timeouts and async 202 patterns, presigned uploads, error sources (401, 403, 429, 502, 504), logging and monitoring, Terraform ownership, testing, cost, and troubleshooting. Use when planning public or partner APIs, mobile-app API access, the website contact form backend, api.oxinov.com, or any API gateway, throttling, or API-key question.
---

# Oxinov API gateway and the public API boundary

Act as a senior API and cloud security architect for Oxinov Pvt. Ltd. A gateway is a policy and routing boundary: contract, identity, authorization hand-off, rate control, routing, private integration, observability, and lifecycle. It is never the business logic layer, and it never replaces authorization in the APIs.

Related skills: oxinov-api-design (contracts, errors, versioning), oxinov-backend-architecture, oxinov-keycloak, oxinov-authentication-sessions, oxinov-access-control, oxinov-ingress-tls, oxinov-devops-architecture, oxinov-terraform, oxinov-mobile, oxinov-events-and-jobs. Sources: [backend/gateway](../../../backend/gateway/README.md), [platform architecture](../../../docs/04-architecture/platform-architecture.md), [platform blueprint](../../../docs/01-company/platform-blueprint.md), [Platform FRD](../../../docs/03-requirements/frd/platform-frd.md), [API specification](../../../docs/06-api/api-spec.md), [API versioning](../../../docs/06-api/api-versioning.md), [API errors](../../../docs/06-api/api-errors.md), [cloud architecture](../../../docs/04-architecture/cloud-architecture.md). Decisions: ADR-008, ADR-011, ADR-019, ADR-021.

**When uncertain, prioritize:** security, correct authorization, contract correctness, backend protection, simplicity, reliability, observability, maintainability, performance, scalability, cost. Verify current AWS and Terraform provider documentation before writing version-sensitive gateway, authorizer, VPC Link, quota, or pricing details.

## 1. Today: no gateway exists

| Item | Now |
| --- | --- |
| `api.oxinov.com` | Planned in the blueprint and the platform FRD; `backend/gateway/` is an approved boundary with **no runtime until a gateway milestone has an approved contract and deployment owner** |
| How APIs are reached | Only by their own web apps' servers inside the cluster (`edu-web` → `edu-api`, `platform-web` → `platform-api`); APIs have **no public host** |
| Protection each API already has | `server-kit`: JWT verification (issuer, product audience, RS256 or ES256, expiry), global `AuthGuard` (deny by default), `ValidationPipe`, per-instance rate limit (`RATE_LIMIT_PER_MINUTE`, 429 with `Retry-After`), security headers, stable error envelope with request ID |
| Waiting for it | The website contact form (FR-SITE-2104); the mobile apps (they call APIs directly with bearer tokens, so an API needs a public address); future partner or public APIs |

Do not build or describe a gateway as live. Adding one is a new public surface and a stack change: it needs the owner's approval and an ADR.

## 2. Do we need a gateway at all?

Every hop adds latency, cost, configuration, and failure modes. Choose the simplest option that meets the need:

| Need | Simplest fit at Oxinov |
| --- | --- |
| Browser apps calling their own API | Nothing new: server-side calls inside the cluster (today) |
| Mobile app calling a product API | A public host for that API on the existing Traefik ingress (`api.oxinov.com/<product>/v1/...` or a per-product host), with the API's own JWT, validation, and rate limits; add WAF when abuse appears |
| Contact form from the static website | A small public endpoint on the platform API (or its future gateway route) with strict validation, bot protection, and per-IP limits |
| Partner or public API with keys, quotas, metering, per-client throttling | Amazon API Gateway (or an equivalent) in front of the APIs |
| Real-time chat or notifications | A WebSocket gateway for chat (tech stack plan), decided with the chat milestone |

Write the choice in an ADR with alternatives: Traefik routing only, Amazon API Gateway HTTP API, REST API, or another gateway.

## 3. If Amazon API Gateway is chosen

| Choice | Guidance |
| --- | --- |
| HTTP API | Default for Oxinov: JWT authorizer, simple routing, lower cost and complexity |
| REST API | Only for a feature HTTP APIs lack and a requirement needs (usage plans with API keys, request validation models, caching, some transformations) |
| WebSocket API | Only for bidirectional real-time use |
| Integration | Today's APIs run on one k3s node in a public subnet with no load balancer. A **private integration** needs a VPC Link to an internal ALB or NLB (a new always-on cost) or Cloud Map; a public HTTP integration to the node would leave the API reachable around the gateway, so the API must keep all its own checks and the route must be restricted. Settle this in the ADR with the monthly cost |
| Regional placement | `ap-south-1` with the APIs; custom domain `api.oxinov.com` with an ACM certificate in the same Region, Route 53 alias, DNS validation. Add `amazon.com` to the host's CAA record first (the application hosts allow only Let's Encrypt today) |
| Ownership | Terraform owns the API, routes, integrations, authorizers, stages, domain, mappings, VPC Link, logging, and WAF association; application code owns behavior; OpenAPI from the APIs is the contract input |

## 4. Identity at the gateway

- Tokens come from Keycloak realm `oxinov` (issuer `https://id.oxinov.com/realms/oxinov`). A JWT authorizer validates signature (JWKS through discovery), issuer, **audience**, expiry, and required scopes.
- Oxinov issues **one audience per product API** (`oxinov-platform-api`; Edu `oxinov-lms-api` until the ADR-027 cutover, then `oxinov-edu-api`). Configure each route group's authorizer with that product's audience only, so a token for one product cannot call another. During the Edu audience rename the authorizer must accept both names, exactly like `AUTH_AUDIENCE`.
- Use **access tokens** only; never ID tokens.
- The gateway check is an early filter. **Every API still verifies the token itself** (`server-kit`) and does all authorization: tenant membership, role, entitlement, trust level, policy, and object ownership (a valid token for tenant A never opens tenant B's data; answer 404).
- Scopes (for example `edu.courses.read`) are for partner or client capabilities when needed; they do not replace workspace roles. Avoid broad scopes such as `api.full_access`.
- Mobile apps are public Keycloak clients with PKCE (oxinov-mobile); service-to-service callers use client credentials with one identity per service.
- API keys identify a client for usage plans and metering; **they are never authentication**.

## 5. Rate control, WAF, CORS, validation

- Throttle by route and stage with rate and burst sized from backend capacity (one node today) and client tier; clients back off on 429 with jitter. Keep the per-instance limiter in each API as a second layer. Rate limits are not authorization.
- AWS WAF (security roadmap #6, from about US$6 a month) on CloudFront or the gateway for managed rules, IP rules, and rate-based rules when public launch or abuse needs it; it does not replace secure code.
- CORS narrow and per environment: exact origins (`https://edu.oxinov.com`, `https://app.oxinov.com`); never `*` with credentials; development origins never in production. CORS is not authentication.
- Gateway request validation can reject malformed input early, but the API's DTO validation stays authoritative.
- Large files never pass through a gateway: the API returns a short-lived presigned S3 URL and the client uploads directly (today's media and submission flow).
- Pagination limits, sort and filter allow-lists, and business rules stay in the API.

## 6. Timeouts, long work, and failures

- Keep request time well under the gateway's integration timeout (check the current limit); long jobs return **202 Accepted** with a job ID and finish in a worker (oxinov-events-and-jobs; no queue exists yet).
- Timeout hierarchy: client > gateway > API > its dependencies; payment provider calls already use explicit timeouts.
- Idempotency for retried writes (payments, enrollments, submissions): natural unique keys today; a client `Idempotency-Key` header when public clients need it.
- Know who produced an error:

| Status | Usually from | Check |
| --- | --- | --- |
| 401 | Authorizer or API `AuthGuard` | Header format, expiry, issuer, audience, Keycloak client |
| 403 | Resource or IAM policy, scope, or API authorization (`FORBIDDEN`) | Which layer; never loosen validation to "fix" it |
| 404 | Route or mapping, or API (`RESOURCE_NOT_FOUND`, also for other tenants' objects) | Route table versus application |
| 429 | Gateway throttling, usage plan, or the API limiter (`RATE_LIMITED`) | Traffic versus capacity before raising limits |
| 502 | Bad integration response, backend unreachable | Integration logs, VPC Link, target health |
| 504 | Integration timeout | The slow dependency; do not just raise timeouts |

## 7. Observability, logging, cost

- Access logs in JSON with request ID, route, status, latency, integration latency, and identity metadata; propagate the request ID to the API, which already returns it in every error.
- Never log `Authorization` headers, tokens, API keys, or request bodies with personal data.
- Metrics: count, latency versus integration latency, 4xx, 5xx, throttles, per important route (payments, sign-in-related, uploads); alarms on 5xx and throttling spikes; log retention set to keep CloudWatch cost bounded.
- Cost: per-request pricing, data transfer, logs, WAF, and any load balancer for VPC Link, against the US$50 budget; compare with Traefik routing before choosing.

## 8. Delivery and tests

Terraform `fmt`, `validate`, saved plan, the owner's "yes apply"; then smoke tests over HTTPS. Test: no token, expired, wrong issuer, wrong audience (another product's token), missing scope → denied; valid token but other tenant or lower role → denied by the API; CORS from a foreign origin refused; throttling returns 429; error bodies contain no internals; timeouts behave. Rollback of gateway configuration does not undo migrations or business side effects.

## 9. Checklists

**Security:** HTTPS only; JWT issuer and audience per product; access tokens only; API authorization unchanged and tested; throttling; WAF when justified; narrow CORS; validation; no secrets or tokens in logs; backend not reachable around the gateway unless it keeps full checks.

**Launch:** DNS, certificate, custom domain and mapping; routes and integrations; authorizers; stages; logs and alarms; negative tests pass; documentation (base URL, authentication, routes, errors, limits, versioning) published from OpenAPI; rollback written.

## 10. Troubleshooting order

Client → DNS → TLS → gateway → authorizer → route → integration → network (VPC Link, security groups) → API → database. Find the first failing layer with logs and metrics; never remove a security control as a shortcut, and never make a private backend public as a workaround.

## Never

Use API keys as user authentication; accept unverified JWTs or disable issuer or audience checks; use ID tokens for APIs; give routes broad admin scopes; trust frontend authorization; connect a gateway directly to the database; log tokens; allow `*` CORS with credentials; remove throttling because clients see 429; retry non-idempotent calls blindly; put secrets in Terraform source or commit state; ship breaking contract changes without checking every consumer (web, mobile, partners); hide failures behind HTTP 200; add a gateway layer without a requirement it meets better than the simpler option.

## Reference target (only after the ADR)

```text
Web and mobile clients ─▶ Keycloak (id.oxinov.com) ─▶ access token (product audience)
   ─▶ api.oxinov.com (Route 53, ACM) ─▶ [WAF] ─▶ API Gateway HTTP API ─▶ JWT authorizer per product
   ─▶ VPC Link ─▶ internal load balancer ─▶ EKS Services ─▶ product APIs (full authorization, RLS)
   ─▶ PostgreSQL (RDS when step 3 is taken)
Observability: access logs + API logs + metrics + request IDs · Ownership: Terraform + Helm + OpenAPI
```
