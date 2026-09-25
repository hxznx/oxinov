# Oxinov Edu web app (`edu.oxinov.com`)

Next.js 16 app for learners, instructors, and school administrators ([Oxinov Edu FRD](../../../docs/02-FRD.md)). It signs people in with their one Oxinov account through [`@oxinov/web-auth`](../../../packages/web-auth/README.md) (client `oxinov-edu-web`, tokens for the `oxinov-lms-api` audience only) and calls the Edu API (`backend/api`) from the server. The browser never sees tokens and never calls the API directly; the API enforces tenant membership, roles, and course entitlement on every request.

The older `frontend/web/` placeholder stays until a dedicated clean-up removes it.

## What works today

| Page | Requirement |
|---|---|
| `/` sign-in, the person's learning spaces with their role, and creating a space | FR-ID-2207, FR-TENANT |
| `/w/{space}` course catalogue with search and "Continue learning" | FR-CATALOG-301, FR-ANALYTICS-801 |
| `/w/{space}/courses/{id}` outcomes, curriculum with locked and preview lessons, price, free enrollment | FR-CATALOG-302, FR-CATALOG-303 |
| `/w/{space}/courses/{id}/lessons/{id}` Markdown lessons with previous and next navigation | FR-PLAYER-401 (text) |
| `/join?code=…` and "Join with a code" on the home page | FR-AUTH-102 |
| `/w/{space}/people` join codes (create, share, turn off) and the member list, for administrators | FR-AUTH-102, FR-TENANT |
| `/w/{space}/teach`, `/teach/{course}`, `/teach/{course}/lessons/{id}` teacher editing: courses, chapters, text lessons with preview, reordering, review and publishing | FR-COURSE-201, FR-COURSE-202 (text), FR-COURSE-203 |
| Video and audio lessons: teacher upload with progress, player with speed, resume, completion, and transcript | FR-COURSE-202, FR-COURSE-205, FR-PLAYER-401, FR-PLAYER-402, FR-PLAYER-404 |
| `/w/{space}/teach/{course}/quizzes/{id}` quiz builder: settings, sections drawing random questions, four question types, publish, close, copy | FR-ASSESS-501, FR-ASSESS-502 |
| Assignments: learners hand in text, links, and files with drafts and deadlines; teachers grade with feedback and revision requests | FR-ASSESS-503 |
| Private lesson notes with video moments, a course notes page, Markdown download, and print to PDF | FR-PLAYER-403 |
| `/w/{space}/attempts/{id}` timed practice and mock exams with autosave, auto-submit, results, and answer review | FR-ASSESS-501, FR-ASSESS-502, FR-EXAM-1204 |

Paid courses show that online payment is coming; they unlock only after a verified payment event (FR-CATALOG-303). Next slices: books and PDF resources, then the class stream (announcements and Q&A).

## Run locally

1. Start the identity profile and run `bash devops/keycloak/configure-realm.sh` (creates the `oxinov-edu-web` client).
2. Start the Edu API with `AUTH_ISSUER`, `AUTH_JWKS_URL`, and `AUTH_AUDIENCE=oxinov-lms-api`. For video and audio lessons, also run `docker compose up -d object-storage`, set the media settings in `backend/api/.env` (see its `.env.example`), and run `pnpm --filter @oxinov/lms-api media:bucket` once.
3. Copy `.env.example` to `.env.local` and set `OIDC_CLIENT_SECRET` from Keycloak (Clients → `oxinov-edu-web` → Credentials) and a random `SESSION_SECRET`.
4. `pnpm --filter @oxinov/lms-web dev` and open http://localhost:3002.

## Checks

```bash
pnpm --filter @oxinov/lms-web test
pnpm --filter @oxinov/lms-web typecheck
pnpm --filter @oxinov/lms-web build
```
