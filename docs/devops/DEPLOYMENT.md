# Deployment architecture

Docker images: frontend, backend, worker, and chat. PostgreSQL runs in Docker on durable encrypted storage with backup and restore procedures; Redis is disposable. TLS ingress routes tenant subdomains and verified custom domains. Private networks protect database and queue ports. Object storage and Mux hold files/video.

Compose supports local and initial single-host deployments. Kubernetes manifests in `k8s/` are templates for a later orchestrated topology and are not production-ready until image registry, ingress, secrets, persistent volumes, and provider settings are selected. Terraform and Ansible are similarly unconfigured. See [architecture](../architecture/ARCHITECTURE.md).
