# Non-functional requirements

**Source:** Oxinov Edu FRD v1.3. Related: [FRD](02-FRD.md), [security](security/SECURITY.md), and [deployment](devops/DEPLOYMENT.md).

## Requirements

Numeric targets below are proposed acceptance targets. Confirm regions, traffic, and budget in [open decisions](planning/RISKS.md) before final approval.

| ID | Requirement and verification |
| --- | --- |
| NFR-01 Performance | On a representative mid-range mobile device and throttled 4G connection, catalog and course pages have 75th-percentile Largest Contentful Paint at or below 2.5 seconds. Under the agreed load profile, 95th-percentile application API latency is at or below 1 second, excluding uploads and third-party processing. Test in staging and monitor in production. |
| NFR-02 Video | Use adaptive streaming. Measure startup delay and rebuffering separately; set numerical thresholds after target regions and quality are chosen. Failed uploads and transcodes show a recoverable error. |
| NFR-03 Security | Use HTTPS, encryption at rest, least-privilege credentials, server-side authorization, upload scanning, rate limits, and secret rotation. Do not store card numbers. Verify relevant OWASP ASVS 5.0 Level 2 controls. Audit sensitive admin actions without logging passwords, payment secrets, or private notes. |
| NFR-04 Accessibility | Meet WCAG 2.2 AA for web learner, instructor, and admin flows. Test native apps with platform screen readers, dynamic text sizes, focus order, contrast, captions, and accessible player controls. Verify with automated checks plus manual keyboard and assistive-technology testing. |
| NFR-05 Availability and recovery | Proposed availability: 99.9% per calendar month. Back up the database daily and test restoration quarterly. Proposed recovery point: 24 hours; recovery time: 4 hours. |
| NFR-06 Privacy and retention | Collect only necessary account, education, and payment data. Support account-data export and deletion requests subject to required financial retention. Set exact retention periods and jurisdictions before launch. |
| NFR-07 Observability | Emit structured logs and Prometheus metrics with correlation IDs where appropriate. Grafana must show service availability, throughput, error ratio, p95 latency, PostgreSQL, Redis, queues, payments, exams, video processing, and backups. Alertmanager must route actionable alerts for failed payment fulfillment, stalled video processing, failed exam submission, certificate errors, database health, queue lag, and backup failure. Metrics must not contain personal data or unbounded tenant/user labels. Test scrape targets, rule syntax, dashboard provisioning, and one synthetic alert in staging. |
| NFR-08 Internationalization | Store and display Unicode course content, answers, names, and search terms. Support right-to-left Arabic layouts where used, locale-aware dates and numbers, and fonts covering Japanese, Korean, Chinese, Nepali, Cyrillic, Arabic, and Latin scripts. Test the interface with long translated text. |
| NFR-09 Content rights | Track the source and publication rights of recordings, images, audio, and exam questions. Do not copy official JLPT or SSW questions, logos, or scoring claims without permission. Label platform-created mock exams clearly as unofficial preparation material. |
| NFR-10 Mobile data protection | Store tokens in platform secure storage, minimize locally cached personal and financial data, clear cached protected media and files on sign-out, and request camera, microphone, and notification permissions at the moment the feature needs them. |
| NFR-11 Tenant isolation | Test cross-tenant denial for IDs, list queries, search, media, chat, AI retrieval, background jobs, webhooks, and exports. Tenant isolation must be enforced in the API and PostgreSQL policies, and verified in automated integration tests using at least two tenants. |
| NFR-12 Cloud readiness | Web, API, chat, and worker processes are stateless and independently scalable. Durable state belongs in PostgreSQL or object storage; Redis holds only rebuildable cache, queue, or delivery state. Containers expose health and readiness checks and shut down gracefully. |
| NFR-13 AI governance | Log AI-generated drafts and approved actions by tenant and actor without storing secrets in prompts. Apply usage limits and human review gates; test that prompt injection cannot gain cross-tenant access or execute unapproved actions. |
| NFR-14 Google Play readiness | Maintain a release build, signing credentials, stable Android package ID, version code, privacy policy, Data safety declarations, permissions rationale, content rating, billing compliance, and internal testing track. Target the current Google Play API level at release; as of September 2026, new submissions require Android 16 / API level 36 or higher. |
| NFR-15 Security operations | Scan source, dependencies, secrets, containers, and infrastructure configuration in CI. Emit schema-valid security events for authentication, authorization, tenant isolation, privileged changes, payment abuse, malware, exports, and security-control changes. Send production events to a separately access-controlled SIEM, evaluate reviewed detections, and exercise incident runbooks in staging. Do not include secrets, raw bodies, private messages, exam answers, or raw AI prompts. Define severity ownership, response targets, retention, evidence custody, and notification escalation before launch. |
| NFR-16 Human-centred usability | Link every material journey to an evidence-backed user need and test content or prototypes with intended users before build. Before release, benchmark the implemented end-to-end journey for unassisted task success, false completion, time, ease, confidence, error recovery, mobile and low-bandwidth behavior, required languages, and accessibility. Include disabled and assisted-digital users throughout the lifecycle. No unresolved critical usability or accessibility failure may ship. Continue outcome research after launch according to the [user-centred product standard](research/USER-CENTERED-PRODUCT-STANDARD.md). |

## Standards

- [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [OWASP ASVS](https://owasp.org/projects/asvs)
- [OWASP multi-tenant security guidance](https://cheatsheetseries.owasp.org/cheatsheets/Multi_Tenant_Security_Cheat_Sheet.html)
- [Google Play target API requirements](https://support.google.com/googleplay/android-developer/answer/11926878?hl=en)
- [ISO 9241-210 human-centred design](https://www.iso.org/standard/77520.html)
- [GOV.UK continuous user research](https://www.gov.uk/service-manual/user-research/how-user-research-improves-service-design)
- [Web Vitals](https://web.dev/articles/vitals)
