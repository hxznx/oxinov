# Deployment architecture

> **Today (ADR-017, ADR-018):** production is one k3s node on the starter EC2 server in Mumbai, deployed
> automatically from every green `main` with the shared Helm chart; PostgreSQL runs in the cluster on the
> encrypted disk, files are in private S3, and email goes through Amazon SES. Runbook:
> [devops/kubernetes/README.md](../../devops/kubernetes/README.md); pipeline: [CI/CD](CI-CD.md). The
> architecture below is the scale-out target, with Amazon EKS replacing ECS Fargate (ADR-018); the images,
> chart, and scripts move unchanged when a roadmap trigger is met.

Docker images package the company web, platform web, product web, APIs, workers, and realtime services. Docker Compose remains the local developer entry point and runs PostgreSQL, Redis, MinIO, and optional monitoring containers. Production deploys application images to Amazon ECS on Fargate in AWS Mumbai; PostgreSQL moves to Amazon RDS, Redis-compatible workloads move to ElastiCache, and files move to private Amazon S3. See the [AWS cloud architecture](../architecture/AWS-CLOUD-ARCHITECTURE.md).

CloudFront and AWS WAF protect the public edge. An Application Load Balancer routes to private ECS tasks. Route 53 and AWS Certificate Manager manage approved domains and certificates. Production databases, caches, workers, identity services, exporter endpoints, and application metric endpoints have no public IP address. Security groups authorize explicit service-to-service paths.

GitHub Actions builds immutable images, scans them, pushes them to Amazon ECR, and assumes environment-specific deployment roles through OpenID Connect. Terraform owns AWS accounts after bootstrap, VPCs, subnets, routing, endpoints, security groups, ECR, ECS, load balancing, CloudFront/WAF, Route 53, RDS, ElastiCache, S3, Secrets Manager/KMS, backups, monitoring integrations, and alarms. A reviewed saved plan and environment approval precede production apply.

The local `monitoring` profile runs Prometheus, Alertmanager, Grafana, and database/cache exporters. Production uses Amazon Managed Service for Prometheus and Amazon Managed Grafana or another documented compatible deployment while preserving version-controlled metric names, rules, and dashboards. The Helm chart in `devops/kubernetes/helm/oxinov` is the production packaging today (k3s) and at scale (EKS).

The SOC platform is deployed separately from the application and operational monitoring plane. Production deployment must provide private/encrypted event ingestion, analyst MFA and RBAC, retention/residency controls, immutable administrative audit, tested alert delivery, and protected evidence storage. Initial ECS Fargate runtime coverage uses GuardDuty Runtime Monitoring. Falco is considered for later EKS/EC2 workloads and must not add host capabilities to the local application Compose profile.
