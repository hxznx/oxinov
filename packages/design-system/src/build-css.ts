import { copyFileSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderTokensCss } from './css.js';

// Runs after `tsc`: writes dist/tokens.css and copies brand assets so apps import them from the package.
const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(packageRoot, 'dist');
writeFileSync(join(dist, 'tokens.css'), renderTokensCss());

const assets = join(packageRoot, 'assets', 'brand');
const target = join(dist, 'brand');
mkdirSync(target, { recursive: true });
for (const file of readdirSync(assets)) {
  if (!file.endsWith('.md')) copyFileSync(join(assets, file), join(target, file));
}
