# Dependency policy

Pin direct versions and commit lockfiles when apps are added. Prefer maintained packages with clear licenses, release history, and security support. A new service or database needs an ADR covering need, cost, isolation, recovery, and operational owner.

The TypeScript monorepo uses the exact pnpm version in the root `package.json` and one root
`pnpm-lock.yaml`; nested npm, Yarn, or pnpm lockfiles are not allowed. New packages wait at least
the configured maturity period unless a reviewed exception is recorded. Dependency lifecycle
scripts are denied by default and are enabled or explicitly denied under `allowBuilds` in
`pnpm-workspace.yaml`; review any new build-script request before installation.

CI scans dependencies and container images. Review high-severity findings before release; document accepted exceptions with owner and expiry. Avoid duplicate libraries that solve the same problem without a demonstrated need.
