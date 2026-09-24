// Copies the approved logo files from @oxinov/design-system into public/brand before dev and build.
import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const source = join(dirname(require.resolve('@oxinov/design-system/tokens.css')), 'brand');
if (!existsSync(source)) {
  throw new Error('Build @oxinov/design-system first: pnpm --filter @oxinov/design-system build');
}
const target = join(here, '..', 'public', 'brand');
mkdirSync(target, { recursive: true });
cpSync(source, target, { recursive: true });
