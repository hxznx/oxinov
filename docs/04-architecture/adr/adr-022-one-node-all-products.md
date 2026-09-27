# ADR-022: Oxinov Jobs approved, and every product shares one Kubernetes node

**Date:** 2026-09-27. **Status:** Superseded in part by ADR-025: the approved `FR-JOB-*` behavior remains approved, but it is no longer a standalone product plane. The shared-node and cost decisions remain accepted. Original owner decisions: "full approval now", "full first release", and "do not increase the cost … all product and service has to use the same resources … if possible decrease the cost". Builds on ADR-008, ADR-010, ADR-017, ADR-018, ADR-019, and ADR-021. Amazon EKS stays the scale-out design but is **not** adopted: its control plane alone (about US$73 a month) exceeds the budget.

1. **The direct-hiring behavior was approved** for the full first release as FR-JOB-6001 to FR-JOB-6092, with the founder as product owner. ADR-025 later moved those permanent IDs into the unified [HR FRD](../../03-requirements/frd/hr-frd.md) and retired the planned standalone `jobs-web`, `jobs-api`, `oxinov_jobs`, and `jobs.oxinov.com` boundary. The original legal, moderation, and retention gates still apply to direct hiring.
2. **One node, one chart, one database server for every product.** All products run on the existing `t3a.medium` k3s node from the shared Helm chart, behind the one Traefik, with one Keycloak and one PostgreSQL instance holding a separate database and roles per product. A new product adds workloads, not infrastructure, and so adds no AWS cost.
3. **Kubernetes arbitrates the shared node:**
   - **Priority classes**, from the chart:
     - `oxinov-critical`: PostgreSQL, Keycloak, and the mail relay. Without them nobody can sign in, and data is at risk.
     - `oxinov-core`: live products and the platform (`edu-*`, `platform-*`).
     - `oxinov-growth`: products in development or early launch (Jobs).
   - **What priority does:** when the node runs short, the scheduler preempts lower classes to place higher ones, and the kubelet evicts pods that exceed their requests, lower priority first. Sign-in and Edu therefore survive a spike in Jobs.
   - **Honest sizing:** every workload declares measured requests and a memory limit.
   - **A memory budget checked in CI:** `scripts/service_catalog.py --check` fails when the production memory requests of all workloads exceed the node's allocatable budget (3.3 GiB of the 4 GiB, leaving room for k3s, Traefik, and the page cache).
   - **Growth path:** new products start in `oxinov-growth` with one replica and move to `oxinov-core` at launch. Horizontal autoscaling is not used on a single node, because extra replicas cannot add capacity there; it arrives with a second node.
4. **Scale-out stays trigger-based and cost-approved.** A second node, RDS, or EKS happens only when the memory budget can no longer hold the live products or an availability commitment requires it, and only with the owner's approval of the new monthly cost ([DevOps roadmap](../../10-devops/devops-roadmap.md)). The same chart and catalog move unchanged.
5. **Cost reduction instead of increase:** the largest lever is a 1-year Compute Savings Plan for the node (about a quarter off its on-demand price, with no upfront payment). It is proposed to the owner in [cost optimization](../../10-devops/cost-optimization.md) because it is a commitment. Adding products never raises spend under this decision.

Consequences: products compete for 4 GiB, so every new workload must be small and measured; one node means shared failure (ADR-017), which is acceptable before paying customers; the memory budget makes crowding visible in CI instead of in production. Alternatives considered: EKS now (about US$150–200 a month, rejected by the owner), a second EC2 node or bigger instance (more cost), and separate clusters per product (more cost and operations).
