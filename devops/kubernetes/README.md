# Production runbook: Kubernetes (k3s)

Oxinov production runs on one k3s node on the starter server (`t3a.medium`, 4 GiB plus 2 GiB swap, Mumbai),
deployed with one Helm chart ([ADR-017](../../docs/04-architecture/adr/README.md), [ADR-018](../../docs/04-architecture/adr/README.md),
NFR-17). AWS resources: `devops/terraform/environments/production/starter`. Direction and phases:
[DevOps roadmap](../../docs/10-devops/devops-roadmap.md).

| Address | Service |
|---|---|
| `https://edu.oxinov.com` | Oxinov Edu (`edu-web` → `edu-api`) |
| `https://app.oxinov.com` | Account portal (`platform-web` → `platform-api`) |
| `https://id.oxinov.com` | Keycloak sign-in (administration console and master realm closed publicly) |

| Path | What it is |
|---|---|
| `helm/oxinov/` | The shared chart: every service is a `services:` entry; `values-production.yaml` sizes it for the node |
| `scripts/bootstrap-node.sh` | Idempotent node setup: pinned k3s and Helm (SHA-256), Traefik with Let's Encrypt, secrets from Parameter Store, ECR pull secret |
| `scripts/deploy.sh` | On the node: `apply`, `rollback`, `release`, `status` |
| `../scripts/release-plan.sh` | Decides which images a push rebuilds (tested by `release-plan.test.sh`) |
| `../scripts/services.sh` | Service list, build recipes and Helm tag keys, generated from the root `services.yaml` |
| `../scripts/oxctl` | Operations from a laptop |
| `../scripts/check-delivery.sh` | Every delivery check (shellcheck, planner tests, Helm lint, Kubernetes schema, Terraform format) |
| `scripts/rehearse-local.sh` | Full release rehearsal on a throwaway local k3s: install, routes, realm, and a forced rollback |

## How a change reaches production

1. Push to `main` (or merge a pull request). CI runs.
2. When CI is green, **Deploy production** (`.github/workflows/deploy-production.yml`) starts by itself:
   plan (only changed images) → build → Trivy scan → push to ECR (immutable tags) → publish the chart to
   ECR (OCI) → on the node, `bootstrap-node.sh` then `helm upgrade --rollback-on-failure --wait` → check
   the public names through Traefik → public smoke test.
3. Any failure restores the previous release automatically. Documentation-only pushes deploy nothing.

Typical time: 8–15 minutes. The first release also configures the sign-in realm (about 3 extra minutes).

## Daily operations (`oxctl`)

Needs the AWS CLI signed in (`aws sso login`), the Session Manager plugin, the GitHub CLI, and jq.

```bash
bash devops/scripts/oxctl status
```

| Command | Use |
|---|---|
| `oxctl status` / `events` | Pods, Helm history, memory, disk, backup schedule / recent warnings |
| `oxctl logs <service> [lines]` / `restart <service>` | One service's logs / rolling restart |
| `oxctl deploy [--all] [--realm]` / `watch` / `runs` | Deploy `main` now (normally automatic) / follow it / history |
| `oxctl release` / `history` / `rollback` | Running image tags / Helm revisions / return to the previous revision |
| `oxctl backup` / `backups` | Dump the databases to S3 now / list dumps |
| `oxctl keycloak-admin` | Tunnel the Keycloak console to `http://localhost:8080/admin` for 30 minutes (through the `keycloak` Service; port 8080 on your computer must be free, so stop a local Keycloak first) |
| `oxctl shell` | Root shell on the node (Session Manager; there is no SSH) |
| `oxctl plan` / `cost` | Terraform plan (never applies) / month-to-date spend and the budget |

## Rollback

Automatic on any failed release. By hand: `oxctl rollback` (previous Helm revision) or run **Deploy
production** from an older commit. Migrations only move forward (expand, then contract), so an image
rollback is always safe; a bad migration needs a forward fix.

## Secrets

Generated once as SecureStrings under `/oxinov/production/starter/` in Parameter Store (database passwords,
the Keycloak admin password, session secrets, and the two web client secrets) and rendered into the
Kubernetes Secret `oxinov/oxinov-app` by `bootstrap-node.sh`; k3s encrypts Secrets at rest. To rotate a
session secret, overwrite the parameter and run `oxctl deploy` (everyone signs in again). Database
password rotation needs `ALTER ROLE` first.


### Turning on payments (Khalti and eSewa, ADR-023)

Production starts with payments off: the course page says online payment is not set up. To sell Oxinov's courses:

1. Open merchant accounts for Ox Inov Pvt. Ltd. with Khalti (admin.khalti.com) and eSewa. Test first with Khalti's sandbox (test-admin.khalti.com) and eSewa's published test merchant `EPAYTEST`.
2. Enter the keys yourself (never in chat, Git, or a ticket), from a terminal signed in with `aws sso login`:
   ```bash
   aws ssm put-parameter --name /oxinov/production/starter/KHALTI_SECRET_KEY --type SecureString --value '<key>' --overwrite
   aws ssm put-parameter --name /oxinov/production/starter/ESEWA_PRODUCT_CODE --type SecureString --value '<code>' --overwrite
   aws ssm put-parameter --name /oxinov/production/starter/ESEWA_SECRET_KEY --type SecureString --value '<key>' --overwrite
   ```
3. Set `payments.sellerTenantIds` in `helm/oxinov/values-production.yaml` to the UUID of Oxinov's own workspace, and `payments.mode` to `live` only with live keys. Push; the next deploy renders the keys into the Secret.
4. Price the course in NPR (Rs 10 or more for Khalti) and buy it once with each provider to confirm.

Payments are checked when the learner returns or opens the payment page again; there is no webhook or nightly reconciliation yet, so compare the providers' statements with `payments` rows until FR-PAY-2704 is built.
## Backups and restore

- Nightly `pg_dumpall` at 02:30 Nepal time (CronJob `postgres-backup`) to
  `s3://oxinov-starter-backups-614130400110/database/`, kept 30 days.
- Daily encrypted disk snapshots at 02:15 Nepal time, kept 7 days (Data Lifecycle Manager); PostgreSQL's
  volume lives on that disk.

Restore a dump (stops the apps first), from `oxctl shell`:

```bash
export KUBECONFIG=/etc/rancher/k3s/k3s.yaml
kubectl -n oxinov scale deploy --all --replicas=0
aws s3 cp s3://oxinov-starter-backups-614130400110/database/<yyyy/mm/dd>/<file>.sql.gz - | gunzip | kubectl -n oxinov exec -i postgres-0 -- psql -U oxinov -d postgres
kubectl -n oxinov scale deploy --all --replicas=1
```

Whole-server loss: create a volume from the latest snapshot and attach it to a replacement instance from
the Terraform stack, or let the next deploy bootstrap a fresh node and restore the latest dump.

## Email

Keycloak sends sign-in codes to the `mail-relay` pod, which forwards them to Amazon SES with the node's
instance role (no SMTP keys). While SES is in its sandbox, mail reaches only verified addresses (SES
console → Identities → Create identity → Email address). The account owner requests production access
once (SES console → Account dashboard → Request production access): mail type **Transactional**, website
`https://oxinov.com`, and a use case such as:

> Ox Inov Pvt. Ltd. (Lalitpur, Nepal) sends only transactional email from no-reply@oxinov.com: six-digit
> sign-in codes and email-address confirmations for people who request them on edu.oxinov.com and
> app.oxinov.com. There is no marketing or bulk mail. Recipients are people signing in themselves, so
> addresses are never bought or imported. The domain is verified with DKIM, SPF (custom MAIL FROM), and
> DMARC. We watch the SES bounce and complaint metrics, and Keycloak limits repeated code requests. We
> expect fewer than 1,000 messages a day at launch.

## Capacity and cost

The whole stack uses about 2.9 GiB (measured in a local k3s rehearsal), leaving roughly 0.9 GiB plus swap.
Every change keeps resource requests and limits realistic; `oxctl status` shows memory. Spend is about
US$40 a month against a US$50 budget (Terraform `cost.tf`, alerts at 85% and 100% actual and 100% forecast).
Scale triggers and the EKS path are in the roadmap.

## Adding a service

Start with `oxctl new-service <product> <api|web|worker>`: it performs steps 1 and 2 for a small
standard-library service (see the [service catalog](../../docs/08-engineering/service-catalog.md#adding-a-service)).
By hand:

1. Register it in the root [`services.yaml`](../../services.yaml) (product, owner, source path, build recipe,
   inputs, Helm tag, workload, port, host) and run `python scripts/service_catalog.py`. The release planner,
   deploy workflow, `deploy.sh`, rehearsal, `oxctl`, CODEOWNERS and the
   [service catalog page](../../docs/08-engineering/service-catalog.md) pick it up from there.
2. Add a Dockerfile target, a `services:` entry in `helm/oxinov/values.yaml` named after the workload (and its
   size in `values-production.yaml`), its `priority` tier (`growth` until launch, ADR-022), measured memory
   requests, its environment in `templates/_helpers.tpl`, and network-policy rules.
   `python scripts/service_catalog.py --check` fails until the chart and the catalog agree and the production
   memory requests fit `memoryBudgetMi`.
3. Plan the starter Terraform stack: it creates the ECR repository from the catalog (then the owner's "yes apply").
4. Run `bash devops/scripts/check-delivery.sh` and `bash devops/kubernetes/scripts/rehearse-local.sh`, then
   push. The next green `main` deploys it.

## Assistant skills

Coding assistants working here follow [oxinov-ingress-tls](../../.claude/skills/oxinov-ingress-tls/SKILL.md), [oxinov-devops-architecture](../../.claude/skills/oxinov-devops-architecture/SKILL.md), [oxinov-security-operations](../../.claude/skills/oxinov-security-operations/SKILL.md), [oxinov-secrets-and-crypto](../../.claude/skills/oxinov-secrets-and-crypto/SKILL.md), [oxinov-server](../../.claude/skills/oxinov-server/SKILL.md), [oxinov-kubernetes](../../.claude/skills/oxinov-kubernetes/SKILL.md), [oxinov-cicd](../../.claude/skills/oxinov-cicd/SKILL.md), [oxinov-scaling](../../.claude/skills/oxinov-scaling/SKILL.md), [oxinov-aws](../../.claude/skills/oxinov-aws/SKILL.md). All rules and skills: [AI knowledge](../../docs/14-ai-knowledge/README.md).
