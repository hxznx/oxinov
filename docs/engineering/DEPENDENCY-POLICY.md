# Dependency policy

Pin direct versions and commit lockfiles when apps are added. Prefer maintained packages with clear licenses, release history, and security support. A new service or database needs an ADR covering need, cost, isolation, recovery, and operational owner.

CI scans dependencies and container images. Review high-severity findings before release; document accepted exceptions with owner and expiry. Avoid duplicate libraries that solve the same problem without a demonstrated need.
