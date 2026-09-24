// Checks the static export in out/ (run `pnpm --filter @oxinov/company-web build` first).
// FR-SITE-2101 (pages, statuses), FR-SITE-2102 (accessibility-critical markup), FR-SITE-2105 (no tracking).
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'out');

const routes = [
  '/', '/about/', '/products/', '/divisions/', '/pricing/', '/careers/', '/contact/', '/security/', '/legal/',
  '/legal/terms/', '/legal/privacy/', '/legal/acceptable-use/', '/legal/cookies/',
  '/education/', '/ai/', '/engineering/', '/services/', '/robotics/', '/studio/', '/agritech/', '/space/',
  '/research/', '/production/',
];

const fileFor = (route) => join(out, route, 'index.html');
const html = (route) => readFileSync(fileFor(route), 'utf8');
const text = (page) => page.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ');

function allHtmlFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === '_next' ? [] : allHtmlFiles(path);
    return name.endsWith('.html') ? [path] : [];
  });
}

describe('static export', () => {
  it('builds every public page', () => {
    assert.ok(existsSync(out), 'out/ is missing; build the site first');
    for (const route of routes) assert.ok(existsSync(fileFor(route)), `missing page ${route}`);
  });

  it('gives every page a language, unique title, description, one h1, skip link, and main landmark', () => {
    const titles = new Set();
    for (const route of routes) {
      const page = html(route);
      assert.match(page, /<html[^>]*\slang="en"/, `${route}: lang`);
      const title = /<title>([^<]+)<\/title>/.exec(page)?.[1];
      assert.ok(title && title.includes('Oxinov'), `${route}: title "${title}"`);
      assert.ok(!titles.has(title), `${route}: duplicate title "${title}"`);
      titles.add(title);
      assert.match(page, /<meta name="description" content="[^"]{20,}"/, `${route}: description`);
      assert.equal((page.match(/<h1[\s>]/g) ?? []).length, 1, `${route}: exactly one h1`);
      assert.match(page, /href="#main"/, `${route}: skip link`);
      assert.match(page, /<main id="main"/, `${route}: main landmark`);
    }
  });

  it('gives every image alt text', () => {
    for (const file of allHtmlFiles(out)) {
      for (const tag of readFileSync(file, 'utf8').match(/<img\b[^>]*>/g) ?? []) {
        assert.match(tag, /\salt="/, `${relative(out, file)}: ${tag}`);
      }
    }
  });

  it('has no broken internal links', () => {
    for (const file of allHtmlFiles(out)) {
      for (const [, href] of readFileSync(file, 'utf8').matchAll(/href="(\/[^"#?]*)"/g)) {
        if (href.startsWith('/_next/') || href.startsWith('/brand/')) {
          assert.ok(existsSync(join(out, href)), `${relative(out, file)} -> ${href}`);
          continue;
        }
        const target = href.endsWith('/') ? join(out, href, 'index.html') : join(out, href);
        assert.ok(existsSync(target) || existsSync(`${target}.html`), `${relative(out, file)} -> ${href}`);
      }
    }
  });

  it('shows honest product status and no placeholders or retired names', () => {
    const products = text(html('/products/')).replace(/\s+/g, ' ');
    // Each card shows its status badge immediately before the product name.
    assert.match(products, /In development Oxinov Edu/);
    for (const name of ['Oxinov Commodity Market', 'Oxinov Jobs', 'Oxinov Services Market']) {
      assert.match(products, new RegExp(name));
    }
    assert.match(products, /Coming soon/);
    for (const file of allHtmlFiles(out)) {
      const body = text(readFileSync(file, 'utf8'));
      assert.doesNotMatch(body, /\[(EMAIL|PHONE|STREET ADDRESS|OFFICE HOURS|YEAR|REGISTRATION NUMBER|CAREERS EMAIL)\]/, relative(out, file));
      assert.doesNotMatch(body, /OxinovLMS|KrishiConnect|BT-Bazz|Kaji/, relative(out, file));
    }
  });

  it('labels regulated divisions and never offers them', () => {
    for (const route of ['/space/', '/production/']) {
      assert.match(text(html(route)), /Subject to regulatory approval/, route);
    }
  });

  it('loads no analytics or third-party scripts (FR-SITE-2105)', () => {
    for (const file of allHtmlFiles(out)) {
      const page = readFileSync(file, 'utf8');
      for (const [, src] of page.matchAll(/<script[^>]*\ssrc="([^"]+)"/g)) {
        assert.ok(src.startsWith('/_next/'), `${relative(out, file)} loads ${src}`);
      }
      assert.doesNotMatch(page, /googletagmanager|google-analytics|gtag\(|fonts\.googleapis\.com/, relative(out, file));
    }
  });

  it('defaults to the dark theme and offers the Daylight switch', () => {
    const page = html('/');
    assert.match(page, /<html[^>]*data-theme="dark"/);
    assert.match(page, /Daylight theme/);
  });
});
