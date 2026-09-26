import path from 'node:path';
import { defineConfig } from 'prisma/config';

// Platform database migrations with the owner role (schemas/platform in the image).
export default defineConfig({
  schema: path.join(__dirname, 'schemas/platform/schema.prisma'),
  migrations: { path: path.join(__dirname, 'schemas/platform/migrations') },
  datasource: { url: process.env.PLATFORM_MIGRATION_DATABASE_URL ?? '' },
});
