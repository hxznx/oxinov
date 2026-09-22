# Secrets management

`.env.example` contains names and non-secret examples only. Local `.env` is ignored by Git. CI and production obtain passwords, signing keys, API tokens, and mobile credentials from a secret store with least-privilege access and rotation. Do not place secrets in Docker images, Compose files, Kubernetes ConfigMaps, logs, prompts, or the mobile bundle.

Document owners and rotation for PostgreSQL, Redis, Clerk, Stripe, Mux, object storage, AI, email, push, JWT/signing, and Android upload credentials before deployment. Revoke exposed keys and audit dependent services.
