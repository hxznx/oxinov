# Coding standards

Use strict TypeScript and small domain modules. Apply SOLID where it clarifies ownership, dependency inversion at external boundaries, DRY for shared business rules, KISS for readable implementations, and YAGNI against speculative abstraction. Tenant authorization, payment fulfillment, exam scoring, and AI command validation live in backend services.

Validate all inputs at API boundaries; use typed result/error shapes; never swallow exceptions. Format automatically, lint in CI, and document public APIs with OpenAPI. Favor descriptive names and explicit units for money, time, and score values. Keep UI state out of persistence models.

Tests must verify meaningful behavior and failure paths. Changes to tenant isolation or financial logic require integration tests against PostgreSQL. See [testing](TESTING-STRATEGY.md) and [project structure](PROJECT-STRUCTURE.md).
