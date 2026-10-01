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

### Sign-in administration (Keycloak)

- **Automation rights:** the realm script signs in as `oxinov-automation`, which may configure only the customer realm (`oxinov-realm` roles: realm, clients, events, identity providers). It cannot change staff accounts, staff sign-in, or other realms. The first deploy after 2026-09-30 applies the pending staff-realm settings, then removes the account's former `admin` role.
- **Changing the staff realm later:**
  1. In the admin console (`oxctl keycloak-admin`), give `service-account-oxinov-automation` the `admin` realm role.
  2. Run **Deploy production** with **configure realm** ticked.
  3. The script applies the staff settings and removes the role again.
- **Adding Continue with Google** (FR-ID-2201):
  1. Signed in to Google Cloud as `admin@oxinov.com`, create an OAuth client of type "Web application" with the redirect URI `https://id.oxinov.com/realms/oxinov/broker/google/endpoint`.
  2. Store its values as SecureStrings `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` under the prefix above.
  3. Deploy with **configure realm** ticked. The realm gets the Google connection, and the portal shows "Continue with Google".
- **Lost administrator password:** use Keycloak's recovery command `kc.sh bootstrap-admin` (a temporary admin), then delete the temporary admin. Never give the automation account `admin` permanently.
- **Sign-in alerts:** Keycloak publishes sign-in event counts on its management port (`keycloak_user_events_total`). The `oxinov-identity` alert rules in `monitoring/` work locally, but production has no Prometheus yet (tech radar A1), so check sign-in problems with Keycloak **Events** and `oxctl logs mail-relay`. Response steps: [sign-in abuse runbook](../../security/soc/runbooks/SIGN-IN-ABUSE.md).


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
instance role (no SMTP keys). `platform-api` sends its welcome email (FR-NOTIF-2903) to the same relay on
port 2525; `mail.platformApi: false` turns that off, and `oxctl logs platform-api` shows `mail.welcome.sent`
or `mail.welcome.failed`. While SES is in its sandbox, mail reaches only verified addresses (SES
console → Identities → Create identity → Email address). The account owner requests production access
once (SES console → Account dashboard → Request production access): mail type **Transactional**, website
`https://oxinov.com`, and a use case such as:

> Ox Inov Pvt. Ltd. (Lalitpur, Nepal) sends only transactional email from no-reply@oxinov.com: six-digit
> sign-in codes and email-address confirmations for people who request them on edu.oxinov.com and
> app.oxinov.com. There is no marketing or bulk mail. Recipients are people signing in themselves, so
> addresses are never bought or imported. The domain is verified with DKIM, SPF (custom MAIL FROM), and
> DMARC. We watch the SES bounce and complaint metrics, and Keycloak limits repeated code requests. We
> expect fewer than 1,000 messages a day at launch.

The first request was **denied** (case 179052648600401). Reply to that case in the AWS Support Center rather than opening a new one, and add the controls AWS looks for: the `transactional` configuration set suppresses addresses that bounce or complain, sends bounce, complaint, reject, and rendering-failure events to the company mailbox, and raises CloudWatch alarms at a 5% bounce rate and a 0.1% complaint rate (`email-events.tf`); every message is requested by the recipient on the sign-in page; Keycloak locks an account after 5 failed attempts; the privacy policy is at `https://oxinov.com/legal/privacy`; include a sample message ("Your Oxinov sign-in code is 123456. It expires in 10 minutes. If you did not request it, ignore this email."). Until access is granted, only `@oxinov.com` addresses (the verified domain) receive codes.

### Sending through Brevo instead (Gmail and every other address, today)

Because SES refuses production access, the relay can send through **Brevo** (free: 300 emails a day). It keeps its sender check and the limit of 5 emails per address per 15 minutes. The switch is automatic once the credentials exist, and SES stays the fallback.

1. **Owner:** create a free account at brevo.com with `admin@oxinov.com`, the company admin mailbox for every service (AGENTS.md 9.1). Complete the company profile; Brevo may review new accounts before sending is enabled.
2. **Owner:** in Brevo, open **Senders, Domains & Dedicated IPs**, then **Domains**, and add `oxinov.com`. Choose to authenticate it yourself. Copy the `brevo-code:…` value and the DKIM record names and targets; they are public DNS values.
3. **Engineering:** put them into `devops/terraform/environments/production/edge` (`brevo_verification_txt`, `brevo_dkim_cnames`) and apply after the owner approves the plan. Then choose **Authenticate** in Brevo, and add `no-reply@oxinov.com` as a sender.
4. **Owner:** in Brevo, open **SMTP & API**, then **SMTP**. Note the SMTP login and generate an SMTP key. Store both yourself as SecureStrings under `/oxinov/production/starter/`: `MAIL_SMTP_USER` (the login) and `MAIL_SMTP_PASSWORD` (the key). Nobody else needs to see them.
5. **Deploy** with `oxctl deploy` or the next push. `deploy.sh` sees both parameters, points the relay at `smtp-relay.brevo.com:587` over TLS, and the relay logs `upstream: smtp` at start.
6. **Check:** sign in with a Gmail address. The code arrives from `no-reply@oxinov.com`. `oxctl logs mail-relay` shows `mail.sent`; a refused message shows `mail.failed` with the provider's reason.

To go back to SES, delete the two parameters and deploy.

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
