# Planned source structure

```text
apps/web/       Next.js frontend
apps/api/       NestJS API
apps/worker/    background jobs
apps/chat/      WebSocket gateway
apps/mobile/    Expo Android/iOS app
packages/contracts/  shared API types and generated client
packages/domain/     pure domain types and rules where sharing is safe
```

Each app owns its runtime and Docker build target. Packages must not import from apps. Only the API/worker access PostgreSQL; web/mobile call the API. Do not share secrets or database clients into the mobile bundle. Create modules for tenant, identity, catalog, learning, exams, chat, billing, and AI commands. This tree is planned; application source has not been scaffolded yet.
