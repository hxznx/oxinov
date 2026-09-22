# Architecture decision records

Record each decision with date, status, context, choice, consequences, and alternatives considered. Do not silently change the stack in the FRD.

## ADR-001: PostgreSQL as system of record

**Status:** Proposed. Use containerized PostgreSQL for transactional LMS data. Default to shared tenant-scoped tables with RLS and API authorization; offer dedicated PostgreSQL only for a justified customer tier. Redis and object storage are supporting systems.

## ADR-002: Separate frontend and backend

**Status:** Proposed. Next.js renders web UI; NestJS owns APIs and business rules used by web and mobile. Separate Docker targets support independent builds and scaling.

## ADR-003: One shared mobile app

**Status:** Proposed. A single Expo app lets users switch their tenant workspaces and renders tenant branding. Separately branded binaries require a future decision because they multiply store releases.

## Pending

Choose cloud provider, production deployment topology, AI provider, tenant billing plans, and mobile purchase approach by market. See [RISKS.md](../planning/RISKS.md).
