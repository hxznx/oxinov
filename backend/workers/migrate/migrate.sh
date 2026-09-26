#!/bin/sh
# Applies forward-only migrations to both databases (Helm hook, ADR-018). Needs EDU_MIGRATION_DATABASE_URL
# and PLATFORM_MIGRATION_DATABASE_URL (owner role).
set -eu
cd "$(dirname "$0")"
./node_modules/.bin/prisma migrate deploy --config edu.config.ts
./node_modules/.bin/prisma migrate deploy --config platform.config.ts
