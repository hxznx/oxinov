---
name: oxinov-ingress-tls
description: Expose Oxinov applications safely - the full request path (DNS, TLS certificate, load balancer or ingress controller, Ingress, Service, ready pods), today's k3s Traefik ingress with Let's Encrypt and security headers, host routing, closed admin paths, the Helm chart's ingress, replica, PodDisruptionBudget, probe, and rollout settings, graceful shutdown, HTTPS redirect, smoke tests, troubleshooting from DNS to container, and the future EKS design with the AWS Load Balancer Controller or EKS Auto Mode, ALB or NLB, ACM, Route 53, HPA, PDBs, and topology spread. Use when adding or changing a public host, route, certificate, replica count, autoscaling, or when an app is unreachable or showing 404, 502, 503, TLS, or redirect errors.
---

# Oxinov ingress, TLS, Helm releases, and replicas

Act as a senior Kubernetes, networking, and cloud security engineer for Oxinov Pvt. Ltd. An Ingress is not "a YAML file that exposes an app": reliable delivery is DNS + certificate + load balancer or controller + Ingress + Service + healthy replicas + autoscaling + security + monitoring.

Related skills: oxinov-kubernetes (workload standard), oxinov-devops-architecture (tool ownership, reference architecture), oxinov-keycloak (identity host), oxinov-terraform, oxinov-aws, oxinov-server, oxinov-observability, oxinov-scaling. Sources: [production runbook](../../../devops/kubernetes/README.md), [deployment](../../../docs/10-devops/deployment.md), [cloud architecture](../../../docs/04-architecture/cloud-architecture.md), [scalability](../../../docs/04-architecture/scalability.md), [DevOps roadmap](../../../docs/10-devops/devops-roadmap.md). Code: chart `devops/kubernetes/helm/oxinov` (`values.yaml`, `values-production.yaml`, `templates/workloads.yaml`, `templates/platform.yaml`), `devops/kubernetes/scripts/bootstrap-node.sh` (Traefik settings), `devops/scripts/smoke-test.sh`, Terraform `production/edge` (Route 53, ACM, CloudFront).

**When uncertain, prioritize:** security, correct routing, availability, TLS correctness, health and readiness, simplicity, deployment safety, observability, scalability, maintainability, cost. Verify current official documentation before writing version-sensitive controller annotations, EKS Auto Mode `IngressClassParams`, ALB TLS policies, or Helm and HPA API fields.

## 1. The request path today

```text
Browser ─▶ Route 53 (A record to the node's Elastic IP) ─▶ EC2 node :80 / :443 (security group allows only these)
        ─▶ Traefik (bundled with k3s, IngressClass `traefik`)
             :80 "web" ─ permanent redirect ─▶ :443 "websecure"
             TLS: Let's Encrypt certificates (HTTP-01 challenge on "web"), stored in /data/acme.json (mode 600) on Traefik's volume
             Middleware: security headers (HSTS 1 year, nosniff, referrer policy, Server and X-Powered-By removed)
        ─▶ Ingress `oxinov` (host rules) ─▶ ClusterIP Service ─▶ ready pod(s)

edu.oxinov.com ─▶ edu-web      app.oxinov.com ─▶ platform-web      id.oxinov.com ─▶ keycloak
(edu-api, platform-api, mail-relay, PostgreSQL: no public host; reached only inside the cluster)
id.oxinov.com/admin and /realms/master ─▶ closed Service (Ingress `oxinov-identity-private`)
oxinov.com ─▶ CloudFront with an ACM certificate ─▶ private S3 (static site; no Kubernetes involved)
```

| Topic | Today | On EKS (reference, scalability step 4) |
| --- | --- | --- |
| Entry | The node's public IP, Traefik on the node | Internet-facing ALB across 2+ AZs in public subnets; pods in private subnets |
| Controller | Traefik (k3s) with Traefik annotations | AWS Load Balancer Controller or EKS Auto Mode (decide first; annotations and `IngressClassParams` differ) |
| Certificates | Let's Encrypt through Traefik, renewed automatically | ACM with DNS validation, created by Terraform, ARN passed to Helm values; cert-manager only if pods terminate TLS |
| Redirect | Traefik `web` → `websecure`, permanent | ALB listener redirect 80 → 443 |
| TLS policy | Traefik defaults | A current ALB security policy (check the list at the time) |
| Target type | Service endpoints through Traefik | IP targets to ClusterIP Services |
| DNS | Route 53 records in Terraform pointing at the node's Elastic IP (`dns-and-mail.tf`); each application host (`edu`, `app`, `id`) has a CAA record allowing only `letsencrypt.org` to issue its certificate | Route 53 alias records to the ALB (Terraform or restricted ExternalDNS); **add `amazon.com` to those hosts' CAA records before requesting ACM certificates for them**, or issuance fails |
| Firewall | Security group: 80, 443 in | ALB security group 443 (and 80 for redirect) in; node or pod groups accept only from the ALB group |
| Web application firewall | None (security roadmap #6) | AWS WAF on CloudFront or the ALB when public launch or abuse needs it |

## 2. Decisions before exposing anything

Which controller owns the Ingress? HTTP or TCP (ALB or NLB)? Public or internal? Which host? Who manages DNS? Which certificate, in which Region? Where does TLS terminate, and is backend TLS needed? Redirect required (always, for public web)? Which Service, port, and container port? Health path? Replicas, autoscaling, distribution, disruption budget? Which values change per environment? What monitoring? Does it change the attack surface, and does the owner approve a new public host?

Rules that do not change with the platform:

- **Only web apps and Keycloak get public hosts.** APIs sit behind their web apps with no public host; the Keycloak admin console and master realm are never public. Monitoring dashboards are never public.
- Host-based routing (`<product>.oxinov.com` per product web app, `id.` for identity); avoid overlapping path rules.
- HTTPS everywhere; plain HTTP only redirects. HSTS is on.
- Ingress does not secure an API: authentication and authorization stay in the application.
- Static sites belong on S3 and CloudFront, as `oxinov.com` already is, not in Kubernetes.

## 3. Adding or changing a public host (today)

1. Get the owner's approval for the new public address (attack surface and DNS are production changes).
2. Set the service's `host` in `services.yaml` and the chart values (the host key becomes `<host>.oxinov.com`), then `python scripts/service_catalog.py` and `--check`.
3. Add the DNS record in Terraform (`production/edge` or `starter`) with a saved plan and "yes apply"; DNS must resolve to the node before Let's Encrypt can issue the certificate.
4. Keep the chart's Traefik annotations (`router.entrypoints: websecure`, `router.tls: "true"`, `router.tls.certresolver: letsencrypt`) and the security-headers middleware; do not hand-write separate Ingress objects.
5. Check with `bash devops/scripts/check-delivery.sh` and `bash devops/kubernetes/scripts/rehearse-local.sh`, then add the host to `smoke-test.sh` (expected status and, for sign-in, the redirect).
6. After release: `oxctl smoke`, a browser check of the certificate, and the redirect from `http://`.

## 4. Services, ports, and probes

- Ingress → ClusterIP Service port `http` → container `targetPort: http`; ports need not match across layers (for example Service 3002 → container 3002 for `edu-web`), but names and selectors must. Selectors use `app.kubernetes.io/name: <service>`; if labels do not match, the Service has no endpoints and the route fails.
- The app must listen on `0.0.0.0`, not `127.0.0.1`, inside the container.
- Probes: startup (slow start, especially Keycloak), liveness `/health/live` (process only, never dependencies), readiness `/health/ready` (dependencies), or TCP for non-HTTP. An ALB health check on EKS uses the readiness path and must get a 200, not a redirect or 401.

## 5. Replicas, disruption, rollout, shutdown

| Setting | Today | Target |
| --- | --- | --- |
| Replicas | Default 2 in `values.yaml`; **1 per service in production** (`values-production.yaml`), because the 4 GiB node cannot hold two of each (ADR-017) | 2+ for web and API tiers once the node or EKS allows; 3 across AZs for critical services |
| PodDisruptionBudget | Rendered with `minAvailable: 1` only when replicas > 1, so none in production today | `minAvailable` one below replicas for multi-replica services |
| Rollout | `RollingUpdate` with `maxUnavailable: 0`, `maxSurge: 1`; Keycloak uses `Recreate` | Same; surge needs spare capacity |
| Autoscaling (HPA) | None | HPA with `minReplicas` ≥ 2, a bounded `maxReplicas`, a metric that tracks load (CPU needs requests; request rate or queue depth is often better), node autoscaling behind it, and CI that does not overwrite HPA-managed replicas |
| Distribution | One node | `topologySpreadConstraints` on `topology.kubernetes.io/zone` and `kubernetes.io/hostname`, soft where hard rules would block scheduling |
| Graceful shutdown | APIs enable Nest shutdown hooks; default termination grace period | Readiness fails first, the load balancer deregisters and drains, the app finishes requests, then exits |

With one replica, a rolling update still avoids downtime only when the new pod becomes ready before the old one stops (`maxSurge: 1`, `maxUnavailable: 0`) and memory allows both briefly. Keycloak restarts cause a short sign-in outage. More replicas never fix a crashing app.

## 6. Helm release discipline

- One chart, values per environment (`values.yaml` defaults, `values-production.yaml` overrides); no copied manifests per environment; no secrets in values (the `oxinov-app` Secret is referenced by key).
- Images by commit SHA tag, never `latest`.
- Before release: `helm lint`, rendered manifests checked with `kubeconform` (both in `check-delivery.sh`), and the local rehearsal. Review the rendered Ingress hosts, annotations, and Service names when routing changes.
- Release: `deploy.sh` runs `helm upgrade --rollback-on-failure --wait`, public host checks, and the smoke test, rolling back automatically on failure. A successful Helm command is not proof: `oxctl status` and `oxctl smoke` are.
- Helm rollback restores Kubernetes objects only; migrations must stay backward compatible, and AWS or DNS changes need their own path.
- Helm owns what it creates: never `kubectl edit` production objects (the next release overwrites them); change the chart. Keep templates simple rather than clever.

## 7. Troubleshooting (find the first broken layer; do not restart things first)

`DNS → certificate → entry (node or ALB) → listener or entrypoint → Ingress rule → Service → endpoints → pod readiness → container → application`

| Symptom | Check |
| --- | --- |
| Name does not resolve | Route 53 record, TTL, the node's address |
| Certificate error | Hostname covered? Let's Encrypt issued (Traefik logs; HTTP-01 needs port 80 open and DNS pointing at the node; rate limits)? On EKS: ACM status, Region, SAN coverage, listener certificate |
| Redirect loop | Where TLS terminates versus what the app believes; forwarded headers (`KC_PROXY_HEADERS=xforwarded` for Keycloak); duplicate redirects |
| 404 | Host or path rule mismatch (from Traefik) versus a missing app route (from the app) |
| 502 | Wrong target port, app not listening on `0.0.0.0`, crash, wrong protocol |
| 503 | No ready endpoints: pods not ready, selector mismatch, deployment unavailable |
| Fewer pods than expected | Pending pods: memory on the node, requests, priority, image pull, taints |
| `CrashLoopBackOff` | Logs, configuration errors at startup, secrets, database reachability, probes too aggressive |
| `ImagePullBackOff` | Tag exists in ECR, the node's pull permission, Region; never make ECR public |

Commands (through `oxctl shell` on production): `kubectl -n oxinov get ingress,svc,endpoints,pods`, `kubectl describe` on the failing object, `kubectl get events`, `kubectl logs`, `kubectl rollout status`; or `oxctl status`, `oxctl events`, `oxctl logs <service>`.

## 8. Monitoring and alerts

Today: the post-release smoke test (hosts, sign-in discovery and redirect, admin console hidden), probes, CloudWatch instance alarms, and `oxctl` logs; Traefik access logs are off. On EKS add ALB metrics (request count, 4xx, 5xx, target response time, healthy and unhealthy hosts), deployment availability, restarts, HPA at maximum, and certificate expiry. Alert on zero healthy targets, sustained 5xx, crash loops, and certificate problems.

## 9. Moving to EKS (only at the scalability trigger, with an ADR)

Terraform: VPC with public and private subnets in 2+ AZs, EKS, IAM for the controller (least privilege, its own service account role), ACM certificates with DNS validation, Route 53 aliases, security groups. Helm: the same chart with an `alb` (or Auto Mode) IngressClass, controller-specific settings in values, certificate ARN from Terraform outputs, IP targets, HTTP → HTTPS redirect, a current TLS policy, replicas ≥ 2 with PDBs, topology spread, and HPAs. Decide one shared ALB (cheaper, shared blast radius) versus separate ALBs per trust domain (Keycloak and admin surfaces are candidates for separation). Keep Terraform and Helm from managing the same objects, and never delete controller-owned load balancers by hand.

## 10. Checklists

**Exposure:** HTTPS and redirect; correct host; certificate covers it; public only if approved; admin and API paths not public; headers on; application authorization in place; smoke test updated.

**Helm:** lint and render pass; values documented; no secrets; SHA image tags; ports, selectors, probes, resources correct; replicas, PDB, and rollout intentional.

**Replicas:** minimum right for the node or cluster; requests set; PDB when > 1; distribution when > 1 node; HPA bounded; graceful shutdown.

**TLS:** certificate issued and valid for every host; renewal automatic (Traefik ACME today, ACM later); only TLS 1.2+; private keys never in Git (Traefik keeps them in `acme.json` on its volume; ACM keeps them in AWS).

## Never

Serve sensitive traffic over HTTP; expose an API, the Keycloak admin console, or a dashboard publicly; open extra security-group ports; commit certificates, keys, or Secrets; remove readiness probes or health checks to make a deploy pass; use `latest` tags; hand-edit or hand-delete controller-owned resources; set an HPA maximum without capacity and cost; mix controller models without knowing which owns what; copy annotations from old tutorials without checking the installed version.
