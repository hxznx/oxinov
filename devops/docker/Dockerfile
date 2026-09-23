# Build targets are prepared for the planned frontend/ and backend/ areas. They become buildable
# after the corresponding application package.json and source files are created.
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

FROM base AS backend
COPY backend/api/package*.json ./
RUN npm ci
COPY backend/api/ ./
RUN npm run build && npm prune --omit=dev
USER node
EXPOSE 4000
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
