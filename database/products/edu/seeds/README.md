# Database seeds

Deterministic synthetic development and test data. Do not commit customer data, personal
information, provider credentials, or copied official exam content.

`dev_seed.sql` creates two tenants for isolation testing:

| Tenant | Content | Members (subjects for `pnpm --filter @oxinov/edu-api dev:token`, each prefixed `dev\|`) |
| --- | --- | --- |
| Sakura Japanese School (`sakura`) | JLPT N5 and N4 programs; a free starter course, a paid N5 course (¥4,900), a draft N4 course; 13 original N5-style questions; an approved practice set, an approved unofficial mock (5 vocabulary + 5 grammar, 3 attempts), and a draft mock | `sakura-owner` (OWNER), `sakura-instructor` (INSTRUCTOR), `learner-aiko`, `learner-bikash` |
| Everest Skills Academy (`everest`) | One free networking course and quiz | `everest-owner` (OWNER), `learner-aiko` |

Apply after migrations: `pnpm edu:seed` from the repository root (uses `MIGRATION_DATABASE_URL`).
