# 04 · Architecture

How the company platform and its products fit together, what runs today, and why each decision was made. Product-specific architecture lives with its product in [02 · Products](../02-products/README.md).

Start with [current state](current-state.md): it wins for *what runs today*, and the [architecture decisions](adr/README.md) win for *why*.

| Document | Purpose |
| --- | --- |
| [Current state](current-state.md) | What runs today, verified: services, data, delivery, security controls, cost, and known gaps |
| [Platform architecture](platform-architecture.md) | Control plane, product planes, data ownership, and events |
| [Identity and access](identity-and-access.md) | Google and email sign-in, single sign-on, universal product access, and trust levels |
| [Tech stack](tech-stack.md) | Selected company technologies |
| [Technology radar](tech-radar.md) | Adopt, trial, assess, and hold decisions, and the golden path for new services (ADR-024) |
| [Cloud architecture](cloud-architecture.md) | AWS production baseline |
| [AI architecture](ai-architecture.md) | Governed AI gateway, Bedrock and SageMaker boundary, retrieval, tools, data, cost, and observability |
| [Data flow](data-flow.md) | Sign-in, trust step-up, subscriptions, purchases, escrow, learning, AI drafts, and security events |
| [Integrations](integrations.md) | External providers and their required controls |
| [Scalability](scalability.md) | When and how to scale containers, databases, and clusters |
| [Architecture decisions](adr/README.md) | ADR-001 onward, one file per decision |
