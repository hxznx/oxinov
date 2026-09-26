# Production images for the canonical pnpm workspace. Targets: backend (Edu API), platform-api, edu-web,
# platform-web, migrate (database migrations, run once per deploy), mail-relay, and backup. The worker and chat
# targets remain templates until their source is implemented.
FROM node:22-alpine AS base
WORKDIR /app
RUN npm install --global pnpm@12.6.0
ENV NODE_ENV=production

FROM base AS backend-build
ENV NODE_ENV=development
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY backend/api/package.json ./backend/api/package.json
COPY packages/server-kit/package.json ./packages/server-kit/package.json
RUN pnpm install --frozen-lockfile --filter @oxinov/lms-api...
COPY tsconfig.json ./tsconfig.json
COPY packages/server-kit/ ./packages/server-kit/
COPY backend/api/ ./backend/api/
COPY database/prisma/ ./database/prisma/
COPY security/soc/event-schema.json ./security/soc/event-schema.json
RUN pnpm --filter @oxinov/server-kit build
RUN pnpm --filter @oxinov/lms-api build
RUN pnpm --filter @oxinov/lms-api --prod deploy /app/deploy
# @prisma/client lists the Prisma CLI as an optional peer; the running API only loads
# @prisma/client/runtime, so drop the CLI and its tooling dependencies from the image.
RUN rm -rf /app/deploy/node_modules/prisma /app/deploy/node_modules/.pnpm/prisma@*     /app/deploy/node_modules/.pnpm/@prisma+config@* /app/deploy/node_modules/.pnpm/@prisma+studio-core@*     /app/deploy/node_modules/.pnpm/mysql2@* /app/deploy/node_modules/.pnpm/deepmerge-ts@*

# --- Platform API (control plane) ---------------------------------------------------------------
FROM base AS platform-api-build
ENV NODE_ENV=development
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY backend/platform-api/package.json ./backend/platform-api/package.json
COPY packages/server-kit/package.json ./packages/server-kit/package.json
RUN pnpm install --frozen-lockfile --filter @oxinov/platform-api...
COPY tsconfig.json ./tsconfig.json
COPY packages/server-kit/ ./packages/server-kit/
COPY backend/platform-api/ ./backend/platform-api/
COPY database/platform/prisma/ ./database/platform/prisma/
COPY security/soc/event-schema.json ./security/soc/event-schema.json
RUN pnpm --filter @oxinov/server-kit build
RUN pnpm --filter @oxinov/platform-api build
RUN pnpm --filter @oxinov/platform-api --prod deploy /app/deploy
RUN rm -rf /app/deploy/node_modules/prisma /app/deploy/node_modules/.pnpm/prisma@*     /app/deploy/node_modules/.pnpm/@prisma+config@* /app/deploy/node_modules/.pnpm/@prisma+studio-core@*     /app/deploy/node_modules/.pnpm/mysql2@* /app/deploy/node_modules/.pnpm/deepmerge-ts@*

# --- Next.js web apps (standalone output: server.js plus traced node_modules) ----------------------
FROM base AS edu-web-build
ENV NODE_ENV=development NEXT_TELEMETRY_DISABLED=1
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc tsconfig.json ./
COPY packages/design-system/package.json ./packages/design-system/package.json
COPY packages/web-auth/package.json ./packages/web-auth/package.json
COPY frontend/products/lms-web/package.json ./frontend/products/lms-web/package.json
RUN pnpm install --frozen-lockfile --filter @oxinov/lms-web...
COPY packages/design-system/ ./packages/design-system/
COPY packages/web-auth/ ./packages/web-auth/
COPY frontend/products/lms-web/ ./frontend/products/lms-web/
RUN pnpm --filter @oxinov/design-system build && NODE_ENV=production pnpm --filter @oxinov/lms-web build

FROM base AS platform-web-build
ENV NODE_ENV=development NEXT_TELEMETRY_DISABLED=1
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc tsconfig.json ./
COPY packages/design-system/package.json ./packages/design-system/package.json
COPY packages/web-auth/package.json ./packages/web-auth/package.json
COPY frontend/platform-web/package.json ./frontend/platform-web/package.json
RUN pnpm install --frozen-lockfile --filter @oxinov/platform-web...
COPY packages/design-system/ ./packages/design-system/
COPY packages/web-auth/ ./packages/web-auth/
COPY frontend/platform-web/ ./frontend/platform-web/
RUN pnpm --filter @oxinov/design-system build && NODE_ENV=production pnpm --filter @oxinov/platform-web build

# --- Migrations: only the Prisma CLI (backend/workers/migrate) plus both schemas; runs as a Helm hook -----
FROM base AS migrate-build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY backend/workers/migrate/ ./backend/workers/migrate/
RUN pnpm --filter @oxinov/migrate --prod deploy /app/deploy

# --- Mail relay: SMTP from Keycloak to the Amazon SES API with the instance role (ADR-017) -----------
FROM base AS mail-relay-build
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY backend/workers/mail-relay/ ./backend/workers/mail-relay/
RUN pnpm --filter @oxinov/mail-relay --prod deploy /app/deploy

# Runtime images carry Node.js only: no npm, npx, corepack, yarn, or pnpm.
FROM node:22-alpine AS runtime
ENV NODE_ENV=production
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/lib/node_modules/corepack     /usr/local/bin/npm /usr/local/bin/npx /usr/local/bin/corepack /opt/yarn* /usr/local/bin/yarn /usr/local/bin/yarnpkg

FROM runtime AS backend
WORKDIR /app/backend/api
COPY --from=backend-build /app/deploy/ ./
# Numeric IDs (the node user) so Kubernetes can verify runAsNonRoot.
USER 1000:1000
EXPOSE 4000
HEALTHCHECK --interval=15s --timeout=3s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:4000/health/live').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/main.js"]

FROM runtime AS platform-api
WORKDIR /app/backend/platform-api
COPY --from=platform-api-build /app/deploy/ ./
# Numeric IDs (the node user) so Kubernetes can verify runAsNonRoot.
USER 1000:1000
EXPOSE 4200
HEALTHCHECK --interval=15s --timeout=3s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:4200/health/live').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/main.js"]

FROM runtime AS edu-web
WORKDIR /app
ENV PORT=3002 HOSTNAME=0.0.0.0 NEXT_TELEMETRY_DISABLED=1
COPY --from=edu-web-build --chown=node:node /app/frontend/products/lms-web/.next/standalone/ ./
COPY --from=edu-web-build --chown=node:node /app/frontend/products/lms-web/.next/static/ ./frontend/products/lms-web/.next/static/
COPY --from=edu-web-build --chown=node:node /app/frontend/products/lms-web/public/ ./frontend/products/lms-web/public/
# Numeric IDs (the node user) so Kubernetes can verify runAsNonRoot.
USER 1000:1000
EXPOSE 3002
HEALTHCHECK --interval=15s --timeout=3s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3002/',{redirect:'manual'}).then(r=>process.exit(r.status<500?0:1)).catch(()=>process.exit(1))"
CMD ["node", "frontend/products/lms-web/server.js"]

FROM runtime AS platform-web
WORKDIR /app
ENV PORT=3001 HOSTNAME=0.0.0.0 NEXT_TELEMETRY_DISABLED=1
COPY --from=platform-web-build --chown=node:node /app/frontend/platform-web/.next/standalone/ ./
COPY --from=platform-web-build --chown=node:node /app/frontend/platform-web/.next/static/ ./frontend/platform-web/.next/static/
COPY --from=platform-web-build --chown=node:node /app/frontend/platform-web/public/ ./frontend/platform-web/public/
# Numeric IDs (the node user) so Kubernetes can verify runAsNonRoot.
USER 1000:1000
EXPOSE 3001
HEALTHCHECK --interval=15s --timeout=3s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3001/',{redirect:'manual'}).then(r=>process.exit(r.status<500?0:1)).catch(()=>process.exit(1))"
CMD ["node", "frontend/platform-web/server.js"]

FROM runtime AS migrate
WORKDIR /app/migrate
# No update checks or telemetry from the Prisma CLI in production.
ENV CHECKPOINT_DISABLE=1 PRISMA_HIDE_UPDATE_MESSAGE=1
COPY --from=migrate-build /app/deploy/ ./
COPY database/prisma/ ./schemas/edu/
COPY database/migrations/ ./schemas/edu/migrations/
COPY database/platform/prisma/ ./schemas/platform/
COPY database/platform/migrations/ ./schemas/platform/migrations/
# Numeric IDs (the node user) so Kubernetes can verify runAsNonRoot.
USER 1000:1000
# EDU_MIGRATION_DATABASE_URL and PLATFORM_MIGRATION_DATABASE_URL come from the Helm hook.
CMD ["./migrate.sh"]

FROM runtime AS mail-relay
WORKDIR /app
COPY --from=mail-relay-build /app/deploy/ ./
# Numeric IDs (the node user) so Kubernetes can verify runAsNonRoot.
USER 1000:1000
EXPOSE 2525
CMD ["node", "src/main.mjs"]

# --- Database backup: PostgreSQL client tools plus the AWS CLI, for the nightly CronJob (ADR-018) ------
FROM postgres:18.6-alpine@sha256:77f585114c32fbca283dc835b0596f4e52b51b4c6662d7810b2f4084f60a1873 AS backup
# gosu only switches from root to postgres in the upstream entrypoint; this image always runs as postgres,
# and gosu's old Go build carries HIGH and CRITICAL findings.
RUN apk add --no-cache aws-cli && rm -f /usr/local/bin/gosu
USER postgres
CMD ["pg_dumpall", "--version"]

FROM base AS worker
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY backend/worker/package.json ./backend/worker/package.json
RUN pnpm install --frozen-lockfile --filter @oxinov/lms-worker...
COPY backend/worker/ ./backend/worker/
RUN pnpm --filter @oxinov/lms-worker build
# Numeric IDs (the node user) so Kubernetes can verify runAsNonRoot.
USER 1000:1000
CMD ["node", "backend/worker/dist/main.js"]

FROM base AS chat
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY backend/chat/package.json ./backend/chat/package.json
RUN pnpm install --frozen-lockfile --filter @oxinov/lms-chat...
COPY backend/chat/ ./backend/chat/
RUN pnpm --filter @oxinov/lms-chat build
# Numeric IDs (the node user) so Kubernetes can verify runAsNonRoot.
USER 1000:1000
EXPOSE 4001
CMD ["node", "backend/chat/dist/main.js"]
