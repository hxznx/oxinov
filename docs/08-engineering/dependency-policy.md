# Dependency policy

**Updated:** 2026-09-26.

- **One package manager and lockfile:** the exact pnpm version in the root `package.json` and one root `pnpm-lock.yaml`; nested npm, Yarn, or pnpm lockfiles are not allowed.
- **Strict catalog:** shared versions live once in `pnpm-workspace.yaml` (`catalogMode: strict`) so every package uses the same version (for example one `@nestjs/core`).
- **Exact pins:** exact versions in manifests; container images pinned by digest; downloaded tools verified by SHA-256; GitHub Actions pinned to a version.
- **Build scripts denied by default:** dependency lifecycle scripts run only when listed under `allowBuilds`; review any new request before installing.
- **Maturity:** new package versions wait the configured maturity period unless a reviewed exception is recorded.
- **Updates:** Dependabot opens grouped weekly pull requests for npm, GitHub Actions, Docker, and Terraform; CI must pass before merge. Major upgrades read the release notes and migration guide first.
- **Vulnerabilities:** Trivy fails on HIGH or CRITICAL findings that have a fix. Fix by upgrading; an unavoidable upstream finding gets a written, expiring entry in that image's `.trivyignore`.
- **Choosing a package:** maintained, clear licence, release history, security support, and no duplicate of something already in use. A new service or database needs an ADR covering need, cost, isolation, recovery, and owner.
