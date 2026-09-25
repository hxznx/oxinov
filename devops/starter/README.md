# Starter server runbook

One EC2 server runs Oxinov Edu, the account portal, and sign-in until the ADR-009 layout is needed
([ADR-017](../../docs/architecture/ADR.md)). Infrastructure: `devops/terraform/environments/production/starter`.

| Address | Service |
|---|---|
| `https://edu.oxinov.com` | Oxinov Edu (`edu-web` → `edu-api`) |
| `https://app.oxinov.com` | Account portal (`platform-web` → `platform-api`) |
| `https://id.oxinov.com` | Keycloak sign-in (admin console blocked publicly) |

Files here are copied to `/opt/oxinov` on every deploy: `compose.yml`, `Caddyfile`, `postgres-init.sh`
(first database start only), `deploy.sh`, `backup.sh`, and `devops/keycloak/configure-realm.sh`.

## Deploy

GitHub → Actions → **Deploy starter server** → Run workflow (from `main`). It builds and scans seven
images, pushes them to ECR tagged with the commit, and runs `deploy.sh` on the server: secrets, image
pull, migrations, services, realm configuration on the first run, and the nightly backup timer. Tick
"Re-apply the sign-in realm settings" after changing `configure-realm.sh`.

**Roll back:** run the workflow from the previous good commit; images are immutable and ten are kept.
Migrations only move forward, so a rollback across a migration needs a forward fix instead.

## Connect

No SSH port is open. With the AWS CLI and the Session Manager plugin:

```bash
aws ssm start-session --target <server_instance_id>
sudo -i && cd /opt/oxinov && docker compose ps
```

Keycloak administration (never public): forward a port, then open `http://localhost:8080/admin`.

```bash
aws ssm start-session --target <server_instance_id> --document-name AWS-StartPortForwardingSessionToRemoteHost --parameters '{"host":["127.0.0.1"],"portNumber":["8080"],"localPortNumber":["8080"]}'
```

Keycloak listens on the server's loopback address only, so the forward is the sole way in. The admin
user is `oxinov-admin`; its password is the `KEYCLOAK_ADMIN_PASSWORD` parameter below.

## Secrets

Generated once by `deploy.sh` as SecureStrings under `/oxinov/production/starter/` in Parameter Store
(database passwords, the Keycloak admin password, session secrets, and the two web client secrets). They
are rendered to `/opt/oxinov/.env` (root only). To rotate a session secret, overwrite the parameter and
redeploy (everyone signs in again). Database password rotation needs `ALTER ROLE` first.

## Backups and restore

- Nightly `pg_dumpall` at 02:30 Nepal time to `s3://oxinov-starter-backups-614130400110/database/`, kept 30 days.
- Daily encrypted disk snapshots at 02:15 Nepal time, kept 7 days (Data Lifecycle Manager).

Restore a dump onto the running server (stops the apps first):

```bash
cd /opt/oxinov
docker compose stop edu-web platform-web edu-api platform-api keycloak
aws s3 cp s3://oxinov-starter-backups-614130400110/database/<yyyy/mm/dd>/<file>.sql.gz - | gunzip | docker compose exec -T postgres psql -U oxinov -d postgres
docker compose up -d --wait
```

Whole-server loss: create a volume from the latest snapshot, attach it to a new instance from the
Terraform stack, or rebuild the server and restore the latest dump.

## Email

Keycloak sends sign-in codes to the `mail-relay` container, which forwards them to Amazon SES with the
server role. While SES is in its sandbox, mail reaches only verified addresses (SES console → Identities →
Create identity → Email address). Production access is requested once by the account owner in the SES
console (Account dashboard → Request production access): mail type **Transactional**, website
`https://oxinov.com`, and a use case such as:

> Oxinov Pvt. Ltd. (Lalitpur, Nepal) sends only transactional email from no-reply@oxinov.com: six-digit
> sign-in codes and email-address confirmations for people who request them on edu.oxinov.com and
> app.oxinov.com. There is no marketing or bulk mail. Recipients are people signing in themselves, so
> addresses are never bought or imported. The domain is verified with DKIM, SPF (custom MAIL FROM), and
> DMARC. We watch the SES bounce and complaint metrics, and Keycloak limits repeated code requests. We
> expect fewer than 1,000 messages a day at launch.
