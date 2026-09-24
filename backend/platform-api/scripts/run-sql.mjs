// Runs a SQL file against PostgreSQL without needing psql installed (works on Windows too).
// Usage: node scripts/run-sql.mjs <file.sql> [--as-app]
//   default   uses MIGRATION_DATABASE_URL (owner role) — seeds
//   --as-app  uses DATABASE_URL (oxinov_platform_app role)       — policy tests
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import pg from 'pg';

const [file, flag] = process.argv.slice(2);
if (!file) {
  console.error('Usage: node scripts/run-sql.mjs <file.sql> [--as-app]');
  process.exit(2);
}
const url = flag === '--as-app' ? process.env.DATABASE_URL : process.env.MIGRATION_DATABASE_URL;
if (!url) {
  console.error(flag === '--as-app' ? 'DATABASE_URL is not set' : 'MIGRATION_DATABASE_URL is not set');
  process.exit(2);
}

const client = new pg.Client({ connectionString: url });
client.on('notice', (notice) => console.log(notice.message));
try {
  await client.connect();
  await client.query(readFileSync(file, 'utf8'));
  console.log(`OK: ${file}`);
} catch (error) {
  console.error(`FAILED: ${file}\n${error.message}`);
  process.exitCode = 1;
} finally {
  await client.end();
}
