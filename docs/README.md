# Oxinov documentation map

Documentation follows the company structure: **Oxinov Pvt. Ltd.** → **company website** → **Oxinov platform** (one account and shared services) → **products**. Start at the top and read down to the area you are changing. Every document under `docs/` must be linked from this map; `scripts/validate_project.py` fails when one is missing.

## 1. Company

For file navigation, start with the [project library](../PROJECT-LIBRARY.md),
[complete alphabetical file catalog](engineering/FILE-CATALOG.md), the
[service catalog](engineering/SERVICE-CATALOG.md) of every deployable service, and
[current structure and placement rules](engineering/PROJECT-STRUCTURE.md).
For future offerings, use the [company library and growth standard](engineering/COMPANY-LIBRARY-STANDARD.md)
and [product record template](products/PRODUCT-RECORD-TEMPLATE.md).

| Document | Purpose |
| --- | --- |
| [Platform blueprint](company/PLATFORM-BLUEPRINT.md) | Company layers, ten strategic pillars, domain plan, product portfolio, candidate modules, release gate |
| [Platform policies](company/PLATFORM-POLICIES.md) | Terms, privacy, product-role policies, acceptance records, enforcement |
| [Subscription model](company/SUBSCRIPTION-MODEL.md) | Plan ladder, Oxinov One bundle, features per product, entitlements, billing channels |
| [AI implementation strategy](company/AI-IMPLEMENTATION-STRATEGY.md) | Company AI priorities, service choice, language constraints, operating model, scorecard, and release gate |
| [Company roadmap](planning/COMPANY-PLATFORM-ROADMAP.md) | Phases from company website to product pilots |

### Research and innovation

| Document | Purpose |
| --- | --- |
| [R&D operating system](research/README.md) | Company-wide R&D definition, governance, portfolio allocation, stage gates, scorecard, readiness, safety, IP, metrics, and first 90 days |
| [User-centred product standard](research/USER-CENTERED-PRODUCT-STANDARD.md) | Mandatory user research, evidence traceability, usability rules and measures, inclusive testing, release gate, and 90-day rollout for every product |
| [R&D portfolio](research/PORTFOLIO.md) | Candidate first-wave, adjacent, and frontier research questions; status does not approve funding or product implementation |
| [Project and experiment template](research/PROJECT-TEMPLATE.md) | Reusable brief, scorecard, experiment log, gate decision, transfer, and closeout record |

## 2. Company website (`oxinov.com`)

Built in Phase 1 as `frontend/company-web`. Scope is in the [roadmap](planning/COMPANY-PLATFORM-ROADMAP.md) and the [build command](../prompts/BUILD-OXINOV-PLATFORM.md). Design rules: [brand system](design/BRAND.md), [design system](design/DESIGN-SYSTEM.md), [accessibility](design/ACCESSIBILITY.md).

## 3. Oxinov platform (`id.oxinov.com`, `app.oxinov.com`, `api.oxinov.com`)

| Document | Purpose |
| --- | --- |
| [Identity server setup](../devops/keycloak/README.md) | Local Keycloak, email-code extension checks, realm settings |
| [Identity and access](architecture/IDENTITY-AND-ACCESS.md) | Google and email sign-in, single sign-on, universal product access, trust levels |
| [Technology radar](architecture/TECH-RADAR.md) | Adopt, trial, assess, and hold decisions for every technology, and the golden path for new services (ADR-024) |
| [Current state](architecture/CURRENT-STATE.md) | **What runs today**, verified: services, data, delivery, security controls, cost, and known gaps |
| [Company platform architecture](architecture/COMPANY-PLATFORM-ARCHITECTURE.md) | Control plane, product planes, data ownership, events |
| [Company tech stack](architecture/COMPANY-TECH-STACK.md) | Selected technologies |
| [AWS cloud architecture](architecture/AWS-CLOUD-ARCHITECTURE.md) | Production cloud baseline |
| [AI platform architecture](architecture/AI-PLATFORM-ARCHITECTURE.md) | Governed AI gateway, Bedrock/SageMaker boundary, RAG, tools, data, cost, and observability |
| [Architecture decisions](architecture/ADR.md) | ADR-001 onward, newest last |
| [Requirements standard](requirements/README.md) | FR ID scheme, template, priorities, status, traceability, change process |
| [Platform FRD](requirements/PLATFORM-FRD.md) | Functional requirements for the website, sign-in, trust, policies, organizations, plans, payments, KYC, notifications, messaging, portal, privacy, and operations |
| [Company project structure](engineering/COMPANY-PROJECT-STRUCTURE.md) | Folder layout and the product plane template |
| [Data flow](architecture/DATA-FLOW.md) | Sign-in, trust step-up, subscriptions, purchases, escrow, learning, AI drafts, security events |
| [Integrations](architecture/INTEGRATIONS.md) | External providers and their required controls |
| [Scalability](architecture/SCALABILITY.md) | When and how to scale containers, databases, and clusters |

## 4. Products

| Product | Address | Documents |
| --- | --- | --- |
| [Oxinov Edu](products/lms/README.md) | `edu.oxinov.com` | [Product record](products/lms/README.md), [brief](products/lms/BRIEF.md), [PRD](products/lms/PRD.md), [FRD](requirements/LMS-FRD.md), [NFR](requirements/NFR.md), [LMS architecture](architecture/ARCHITECTURE.md), [LMS tech stack](architecture/TECH-STACK.md), [LMS roadmap](planning/ROADMAP.md), [acceptance criteria](planning/ACCEPTANCE-CRITERIA.md), [user flows](design/USER-FLOWS.md), [LMS UI and UX](design/UI-UX.md), [ERD](data/ERD.md), [current code structure](engineering/PROJECT-STRUCTURE.md) |
| [Oxinov Commodity Market](products/COMMODITY-MARKET.md) | `market.oxinov.com` | [Charter](products/COMMODITY-MARKET.md) ([Agri Market](products/AGRI-MARKET.md) superseded) |
| [Oxinov HR](products/hr/README.md) | `hr.oxinov.com` | [Product record](products/hr/README.md), [FRD](requirements/HR-FRD.md) (draft for owner review) |
| [Oxinov Jobs](products/jobs/README.md) | `jobs.oxinov.com` | [Product record](products/jobs/README.md), [charter](products/JOBS.md), [FRD](requirements/JOBS-FRD.md) |
| Oxinov Services Market | `services.oxinov.com` | [Charter](products/SERVICES-MARKET.md) |

All product charters: [products index](products/README.md).

## 5. Cross-cutting engineering and operations

- **API:** [spec](api/API-SPEC.md), [authentication](api/AUTH.md), [errors](api/ERROR-HANDLING.md), [versioning](api/API-VERSIONING.md)
- **Data:** [database design](data/DATABASE-DESIGN.md), [data model](data/DATA-MODEL.md), [retention](data/DATA-RETENTION.md), [migrations](data/MIGRATION-STRATEGY.md)
- **Security:** [security](security/SECURITY.md), [threat model](security/THREAT-MODEL.md), [AI governance](security/AI-GOVERNANCE.md), [privacy](security/PRIVACY.md), [secrets](security/SECRETS-MANAGEMENT.md), [SOC](security/SOC.md)
- **DevOps:** [developer setup](devops/DEV-SETUP.md), [environments](devops/ENVIRONMENTS.md), [deployment](devops/DEPLOYMENT.md), [CI/CD](devops/CI-CD.md), [observability](devops/OBSERVABILITY.md), [backup](devops/BACKUP-RECOVERY.md), [rollback](devops/ROLLBACK.md), [DevOps roadmap](devops/ROADMAP.md), [cost optimization](devops/COST-OPTIMIZATION.md), [production runbook](../devops/kubernetes/README.md)
- **Engineering:** [coding standards](engineering/CODING-STANDARDS.md), [testing](engineering/TESTING-STRATEGY.md), [Git workflow](engineering/GIT-WORKFLOW.md), [logging](engineering/LOGGING.md), [application errors](engineering/ERROR-HANDLING.md), [dependency policy](engineering/DEPENDENCY-POLICY.md)
- **Brand and marketing:** [brand system and strategy](design/BRAND.md), [marketing plan](marketing/MARKETING.md), [SEO](marketing/seo/README.md): [technical](marketing/seo/technical.md), [structured data](marketing/seo/structured-data.md), [Search Console](marketing/seo/search-console.md), [keywords](marketing/seo/keywords.md), [content plan](marketing/seo/content-plan.md), [off-site](marketing/seo/off-site.md), [measurement](marketing/seo/measurement.md), [checklists](marketing/seo/checklist.md)
- **Planning:** [tasks](planning/TASKS.md), [AI roadmap](planning/AI-IMPLEMENTATION-ROADMAP.md), [risks and decisions](planning/RISKS.md), [changelog](planning/CHANGELOG.md)
