# The backend target builds the existing OxinovLMS API from the canonical pnpm workspace.
# Frontend, worker, and chat targets remain templates until their source is implemented.
FROM node:22-alpine AS base
WORKDIR /app
RUN npm install --global pnpm@12.6.0
ENV NODE_ENV=production

FROM base AS frontend
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY frontend/web/package.json ./frontend/web/package.json
RUN pnpm install --frozen-lockfile --filter @oxinov/lms-web...
COPY frontend/web/ ./frontend/web/
RUN pnpm --filter @oxinov/lms-web build
USER node
EXPOSE 3000
CMD ["pnpm", "--filter", "@oxinov/lms-web", "start"]

FROM base AS backend-build
ENV NODE_ENV=development
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY backend/api/package.json ./backend/api/package.json
RUN pnpm install --frozen-lockfile --filter @oxinov/lms-api...
COPY backend/api/ ./backend/api/
COPY database/prisma/ ./database/prisma/
COPY security/soc/event-schema.json ./security/soc/event-schema.json
RUN pnpm --filter @oxinov/lms-api build
RUN pnpm --filter @oxinov/lms-api --prod deploy /app/deploy

FROM base AS backend
WORKDIR /app/backend/api
COPY --from=backend-build /app/deploy/ ./
USER node
EXPOSE 4000
HEALTHCHECK --interval=15s --timeout=3s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:4000/health/live').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/main.js"]

FROM base AS worker
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY backend/worker/package.json ./backend/worker/package.json
RUN pnpm install --frozen-lockfile --filter @oxinov/lms-worker...
COPY backend/worker/ ./backend/worker/
RUN pnpm --filter @oxinov/lms-worker build
USER node
CMD ["node", "backend/worker/dist/main.js"]

FROM base AS chat
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY backend/chat/package.json ./backend/chat/package.json
RUN pnpm install --frozen-lockfile --filter @oxinov/lms-chat...
COPY backend/chat/ ./backend/chat/
RUN pnpm --filter @oxinov/lms-chat build
USER node
EXPOSE 4001
CMD ["node", "backend/chat/dist/main.js"]
