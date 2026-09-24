# Development roadmap

**Scope:** Oxinov Edu delivery. Coordinate it with the [Oxinov company platform roadmap](COMPANY-PLATFORM-ROADMAP.md); platform identity and entitlements must not silently duplicate LMS tenant roles.

0. **Foundation:** repository, Docker infrastructure, PostgreSQL migrations, CI security scanning, OpenAPI, tenant identity, two-tenant isolation tests, security-event schema, private metrics endpoints, Prometheus rules, Alertmanager, and Grafana dashboards.
1. **SaaS core:** workspace signup, branding, membership, plans, catalog, course authoring, and recorded media.
2. **Learning:** enrollment, payments, lesson progress, assignments, chapter practice, mock exams, results, and certificates.
3. **Mobile in parallel:** Expo shell and shared API from phase 0; add each learner/admin workflow alongside web work, then Android internal testing and store readiness.
4. **Engagement and AI:** chat, notifications, AI-assisted draft creation, analytics, and administration.
5. **Launch:** content licensing, load/recovery/security/accessibility testing, SIEM and GuardDuty Runtime Monitoring integration, SOC exercises, tenant pilot, and staged release; evaluate Falco if EKS/EC2 is introduced.

These are proposed phases, not promised dates. See [backlog](TASKS.md).
