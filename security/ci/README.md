# CI security scanning

The security workflow validates repository policy and scans source, lockfiles, container definitions, Kubernetes manifests, and infrastructure configuration. The initial gate uses Trivy for vulnerability, secret, and misconfiguration scanning and fails on high or critical findings.

When application source exists, add CodeQL for JavaScript/TypeScript, dependency review for pull requests, SBOM generation, signed image provenance, and image scanning after every build. High and critical findings block release unless a documented exception has an owner and expiry date.
