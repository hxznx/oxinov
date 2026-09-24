import 'dotenv/config';
import path from 'node:path';
import { defineConfig } from 'prisma/config';

// Migrations run with the owner role (MIGRATION_DATABASE_URL). The API connects with the
// least-privilege oxinov_platform_app role (DATABASE_URL) and never runs migrations.
export default defineConfig({
  schema: path.join(__dirname, '../../database/platform/prisma/schema.prisma'),
  migrations: {
    path: path.join(__dirname, '../../database/platform/migrations'),
  },
  datasource: {
    url: process.env.MIGRATION_DATABASE_URL ?? '',
  },
});
