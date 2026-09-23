# Implementation backlog

| Priority | Task | Acceptance evidence |
| --- | --- | --- |
| 0 | Scaffold apps/web, apps/api, apps/mobile, worker, and chat | Local builds and health endpoints |
| 0 | Start PostgreSQL/Redis/MinIO via Compose and create migrations | Reproducible setup; data persists restart |
| 0 | Implement tenant creation, membership, RLS, and domain routing | Two-tenant positive and negative tests |
| 0 | Instrument services and provision Prometheus, Alertmanager, exporters, and Grafana | Healthy scrape targets, dashboard loads, rules validate, and a synthetic alert reaches its staging receiver |
| 1 | Implement catalog, courses, recorded media, enrollment, and payment | End-to-end paid learner journey |
| 1 | Implement question bank, mock exams, results, assignments | Timed attempt and grading tests |
| 1 | Build Android/iOS parity per module | Mobile flow tests and signed internal `.aab` |
| 2 | Add chat, notifications, AI drafts, analytics, and admin tools | Role and approval tests |
| 2 | Production deployment and launch content | Security, load, restore, store, and content review |

Split these into small issues with FR IDs before coding. Product decisions in [RISKS.md](RISKS.md) may change ordering.
