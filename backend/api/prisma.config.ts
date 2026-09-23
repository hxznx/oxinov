import 'dotenv/config';
import path from 'node:path';
import { defineConfig } from 'prisma/config';

// Migrations run with the owner role (MIGRATION_DATABASE_URL). The API itself connects with the
// least-privilege oxinov_app role (DATABASE_URL) and never runs migrations.
export default defineConfig({
  schema: path.join(__dirname, '../../database/prisma/schema.prisma'),
  migrations: {
    path: path.join(__dirname, '../../database/migrations'),
  },
  datasource: {
    url: process.env.MIGRATION_DATABASE_URL ?? '',
  },
});
