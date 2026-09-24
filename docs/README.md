# Oxinov documentation map

Documentation follows the company structure: **Oxinov Pvt. Ltd.** → **company website** → **Oxinov platform** (one account and shared services) → **products**. Start at the top and read down to the area you are changing. Every document under `docs/` must be linked from this map; `scripts/validate_project.py` fails when one is missing.

## 1. Company

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
| [Identity and access](architecture/IDENTITY-AND-ACCESS.md) | Google and email sign-in, single sign-on, universal product access, trust levels |
| [Company platform architecture](architecture/COMPANY-PLATFORM-ARCHITECTURE.md) | Control plane, product planes, data ownership, events |
| [Company tech stack](architecture/COMPANY-TECH-STACK.md) | Selected technologies |
| [AWS cloud architecture](architecture/AWS-CLOUD-ARCHITECTURE.md) | Production cloud baseline |
| [AI platform architecture](architecture/AI-PLATFORM-ARCHITECTURE.md) | Governed AI gateway, Bedrock/SageMaker boundary, RAG, tools, data, cost, and observability |
| [Architecture decisions](architecture/ADR.md) | ADR-001 to ADR-014 |
| [Requirements standard](requirements/README.md) | FR ID scheme, template, priorities, status, traceability, change process |
| [Platform FRD](requirements/PLATFORM-FRD.md) | Functional requirements for the website, sign-in, trust, policies, organizations, plans, payments, KYC, notifications, messaging, portal, privacy, and operations |
| [Company project structure](engineering/COMPANY-PROJECT-STRUCTURE.md) | Folder layout and the product plane template |
| [Data flow](architecture/DATA-FLOW.md) | Sign-in, trust step-up, subscriptions, purchases, escrow, learning, AI drafts, security events |
| [Integrations](architecture/INTEGRATIONS.md) | External providers and their required controls |
| [Scalability](architecture/SCALABILITY.md) | When and how to scale containers, databases, and clusters |

## 4. Products

| Product | Address | Documents |
| --- | --- | --- |
| OxinovLMS | `lms.oxinov.com` | [Brief](00-PROJECT-BRIEF.md), [PRD](01-PRD.md), [FRD](02-FRD.md), [legacy functional requirements](functional_requirements.md), [NFR](03-NFR.md), [LMS architecture](architecture/ARCHITECTURE.md), [LMS tech stack](architecture/TECH-STACK.md), [LMS roadmap](planning/ROADMAP.md), [acceptance criteria](planning/ACCEPTANCE-CRITERIA.md), [user flows](design/USER-FLOWS.md), [LMS UI and UX](design/UI-UX.md), [ERD](data/ERD.md), [current code structure](engineering/PROJECT-STRUCTURE.md) |
| [Oxinov Commodity Market](products/COMMODITY-MARKET.md) | `market.oxinov.com` | [Charter](products/COMMODITY-MARKET.md) ([Agri Market](products/AGRI-MARKET.md) superseded) |
| Oxinov Jobs | `jobs.oxinov.com` | [Charter](products/JOBS.md) |
| Oxinov Services Market | `services.oxinov.com` | [Charter](products/SERVICES-MARKET.md) |

All product charters: [products index](products/README.md).

## 5. Cross-cutting engineering and operations

- **API:** [spec](api/API-SPEC.md), [authentication](api/AUTH.md), [errors](api/ERROR-HANDLING.md), [versioning](api/API-VERSIONING.md)
- **Data:** [database design](data/DATABASE-DESIGN.md), [data model](data/DATA-MODEL.md), [retention](data/DATA-RETENTION.md), [migrations](data/MIGRATION-STRATEGY.md)
- **Security:** [security](security/SECURITY.md), [threat model](security/THREAT-MODEL.md), [AI governance](security/AI-GOVERNANCE.md), [privacy](security/PRIVACY.md), [secrets](security/SECRETS-MANAGEMENT.md), [SOC](security/SOC.md)
- **DevOps:** [developer setup](devops/DEV-SETUP.md), [environments](devops/ENVIRONMENTS.md), [deployment](devops/DEPLOYMENT.md), [CI/CD](devops/CI-CD.md), [observability](devops/OBSERVABILITY.md), [backup](devops/BACKUP-RECOVERY.md), [rollback](devops/ROLLBACK.md)
- **Engineering:** [coding standards](engineering/CODING-STANDARDS.md), [testing](engineering/TESTING-STRATEGY.md), [Git workflow](engineering/GIT-WORKFLOW.md), [logging](engineering/LOGGING.md), [application errors](engineering/ERROR-HANDLING.md), [dependency policy](engineering/DEPENDENCY-POLICY.md)
- **Planning:** [tasks](planning/TASKS.md), [AI roadmap](planning/AI-IMPLEMENTATION-ROADMAP.md), [risks and decisions](planning/RISKS.md), [changelog](planning/CHANGELOG.md)
