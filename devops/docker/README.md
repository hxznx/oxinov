# Docker

`Dockerfile` defines separate frontend, backend API, worker, and chat build targets. The Edu API
target is buildable from the frozen root pnpm lockfile and produces a production-only deployment.
The other targets remain templates until their application source and manifests exist. Builds use
the repository root as context so each target can copy only its owned source and approved shared
packages.
