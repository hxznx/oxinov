# The backend target builds backend/api. The frontend, worker, and chat targets become buildable
# after their application package.json and source files are created.
# Adjust COPY/install steps for packages/contracts and the chosen workspace lockfile
# when shared packages are introduced; this file is not a runnable app image yet.
FROM node:22-alpine AS base
WORKDIR /app
ENV NODE_ENV=production

FROM base AS frontend
COPY frontend/web/package*.json ./
RUN npm ci
COPY frontend/web/ ./
RUN npm run build && npm prune --omit=dev
USER node
EXPOSE 3000
CMD ["npm", "run", "start"]

# API: build with dev dependencies (NODE_ENV=production would skip them), then ship a slim image.
FROM base AS backend-build
WORKDIR /app/backend/api
COPY backend/api/package*.json ./
RUN npm ci --include=dev
COPY database/prisma/ /app/database/prisma/
COPY backend/api/ ./
RUN npm run build && npm prune --omit=dev

FROM base AS backend
WORKDIR /app/backend/api
COPY --from=backend-build /app/backend/api/package.json ./
COPY --from=backend-build /app/backend/api/node_modules ./node_modules
COPY --from=backend-build /app/backend/api/dist ./dist
USER node
EXPOSE 4000
HEALTHCHECK --interval=15s --timeout=3s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:4000/health/live').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "dist/main.js"]

FROM base AS worker
COPY backend/worker/package*.json ./
RUN npm ci
COPY backend/worker/ ./
RUN npm run build && npm prune --omit=dev
USER node
CMD ["node", "dist/main.js"]

FROM base AS chat
COPY backend/chat/package*.json ./
RUN npm ci
COPY backend/chat/ ./
RUN npm run build && npm prune --omit=dev
USER node
EXPOSE 4001
CMD ["node", "dist/main.js"]
