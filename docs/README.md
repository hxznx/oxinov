# Oxinov documentation map

Documentation follows the company structure: **Oxinov Pvt. Ltd.** → **company website** → **Oxinov platform** (one account and shared services) → **products**. Start at the top and read down to the area you are changing.

## 1. Company

| Document | Purpose |
| --- | --- |
| [Platform blueprint](company/PLATFORM-BLUEPRINT.md) | Company layers, ten strategic pillars, domain plan, product portfolio, candidate modules, release gate |
| [Platform policies](company/PLATFORM-POLICIES.md) | Terms, privacy, product-role policies, acceptance records, enforcement |
| [Subscription model](company/SUBSCRIPTION-MODEL.md) | Plan ladder, Oxinov One bundle, features per product, entitlements, billing channels |
| [Company roadmap](planning/COMPANY-PLATFORM-ROADMAP.md) | Phases from company website to product pilots |

## 2. Company website (`oxinov.com`)

Built in Phase 1 as `frontend/company-web`. Scope is in the [roadmap](planning/COMPANY-PLATFORM-ROADMAP.md) and the [build command](../prompts/BUILD-OXINOV-PLATFORM.md). Design rules: [design system](design/DESIGN-SYSTEM.md), [accessibility](design/ACCESSIBILITY.md).

## 3. Oxinov platform (`id.oxinov.com`, `app.oxinov.com`, `api.oxinov.com`)

| Document | Purpose |
| --- | --- |
| [Identity and access](architecture/IDENTITY-AND-ACCESS.md) | Google and email sign-in, single sign-on, universal product access, trust levels |
| [Company platform architecture](architecture/COMPANY-PLATFORM-ARCHITECTURE.md) | Control plane, product planes, data ownership, events |
| [Company tech stack](architecture/COMPANY-TECH-STACK.md) | Selected technologies |
| [AWS cloud architecture](architecture/AWS-CLOUD-ARCHITECTURE.md) | Production cloud baseline |
| [Architecture decisions](architecture/ADR.md) | ADR-001 to ADR-012 |
| [Company project structure](engineering/COMPANY-PROJECT-STRUCTURE.md) | Folder layout and the product plane template |

## 4. Products

| Product | Address | Documents |
| --- | --- | --- |
| OxinovLMS | `lms.oxinov.com` | [Brief](00-PROJECT-BRIEF.md), [PRD](01-PRD.md), [FRD](02-FRD.md), [NFR](03-NFR.md) |
| Oxinov Agri Market | `agri.oxinov.com` | [Charter](products/AGRI-MARKET.md) |
| Oxinov Jobs | `jobs.oxinov.com` | [Charter](products/JOBS.md) |
| Oxinov Services Market | `services.oxinov.com` | [Charter](products/SERVICES-MARKET.md) |

All product charters: [products index](products/README.md).

## 5. Cross-cutting engineering and operations

- **API:** [spec](api/API-SPEC.md), [authentication](api/AUTH.md), [errors](api/ERROR-HANDLING.md), [versioning](api/API-VERSIONING.md)
- **Data:** [database design](data/DATABASE-DESIGN.md), [data model](data/DATA-MODEL.md), [retention](data/DATA-RETENTION.md), [migrations](data/MIGRATION-STRATEGY.md)
- **Security:** [security](security/SECURITY.md), [threat model](security/THREAT-MODEL.md), [privacy](security/PRIVACY.md), [secrets](security/SECRETS-MANAGEMENT.md), [SOC](security/SOC.md)
- **DevOps:** [environments](devops/ENVIRONMENTS.md), [deployment](devops/DEPLOYMENT.md), [CI/CD](devops/CI-CD.md), [observability](devops/OBSERVABILITY.md), [backup](devops/BACKUP-RECOVERY.md), [rollback](devops/ROLLBACK.md)
- **Engineering:** [coding standards](engineering/CODING-STANDARDS.md), [testing](engineering/TESTING-STRATEGY.md), [Git workflow](engineering/GIT-WORKFLOW.md), [logging](engineering/LOGGING.md)
- **Planning:** [tasks](planning/TASKS.md), [risks and decisions](planning/RISKS.md), [changelog](planning/CHANGELOG.md)
