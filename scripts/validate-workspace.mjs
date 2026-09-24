import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];

const required = [
  'package.json',
  'pnpm-lock.yaml',
  'pnpm-workspace.yaml',
  'turbo.json',
  'frontend/company-web/README.md',
  'frontend/platform-web/README.md',
  'frontend/products/lms-web/README.md',
  'backend/gateway/README.md',
  'backend/platform-api/README.md',
  'backend/products/lms-api/README.md',
  'database/platform/README.md',
  'database/products/lms/README.md',
];

for (const path of required) {
  if (!existsSync(join(root, path))) errors.push(`Missing workspace boundary: ${path}`);
}

const rootManifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
if (!rootManifest.private) errors.push('Root package.json must remain private');
if (!/^pnpm@\d+\.\d+\.\d+$/.test(rootManifest.packageManager ?? '')) {
  errors.push('Root package.json must pin an exact pnpm version');
}

const lmsManifestPath = join(root, 'backend/api/package.json');
const lmsManifest = JSON.parse(readFileSync(lmsManifestPath, 'utf8'));
if (lmsManifest.name !== '@oxinov/lms-api') {
  errors.push('The legacy backend/api workspace must be identified as @oxinov/lms-api');
}

for (const forbidden of [
  'frontend/products/market-web',
  'frontend/products/jobs-web',
  'frontend/products/services-web',
  'backend/products/market-api',
  'backend/products/jobs-api',
  'backend/products/services-api',
  'database/products/market',
  'database/products/jobs',
  'database/products/services',
]) {
  if (existsSync(join(root, forbidden))) {
    errors.push(`Unapproved future product plane exists: ${forbidden}`);
  }
}

if (existsSync(join(root, 'backend/api/package-lock.json'))) {
  errors.push('Nested package-lock.json conflicts with the canonical root pnpm-lock.yaml');
}

if (errors.length) {
  for (const error of errors) console.error(`ERROR: ${error}`);
  process.exit(1);
}

console.log(`Workspace boundaries valid from ${relative(process.cwd(), root) || '.'}`);
