import path from 'node:path';
import { defineConfig } from 'prisma/config';

// Edu database migrations with the owner role; the image copies database/products/lms/prisma and database/products/lms/migrations
// into schemas/edu (devops/docker/Dockerfile, target migrate).
export default defineConfig({
  schema: path.join(__dirname, 'schemas/edu/schema.prisma'),
  migrations: { path: path.join(__dirname, 'schemas/edu/migrations') },
  datasource: { url: process.env.EDU_MIGRATION_DATABASE_URL ?? '' },
});
