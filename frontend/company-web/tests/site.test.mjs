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

  it('publishes the company contact addresses and an RFC 9116 security.txt', () => {
    const contact = html('/contact/');
    for (const address of ['support', 'billing', 'legal', 'security']) {
      assert.match(contact, new RegExp(`href="mailto:${address}@oxinov\\.com"`), `contact: ${address}@`);
    }
    assert.match(contact, /href="tel:\+9779842572888"/);
    assert.match(contact, /href="https:\/\/wa\.me\/9779842572888"/);
    assert.match(text(contact), /Ward 8, Lalitpur/);
    assert.match(text(contact), /24\/7/);
    assert.match(html('/security/'), /href="mailto:security@oxinov\.com"/);
    assert.match(html('/legal/privacy/'), /href="mailto:legal@oxinov\.com"/);

    const securityTxt = readFileSync(join(out, '.well-known', 'security.txt'), 'utf8');
    assert.match(securityTxt, /^Contact: mailto:security@oxinov\.com$/m);
    const expires = new Date(securityTxt.match(/^Expires: (.+)$/m)?.[1] ?? '');
    const daysLeft = (expires.getTime() - Date.now()) / 86_400_000;
    // RFC 9116: Expires must be in the future and should be less than a year away. Renew it when this fails.
    assert.ok(daysLeft > 30 && daysLeft <= 366, `security.txt expires in ${Math.round(daysLeft)} days; renew it`);
  });

  it('defaults to the dark theme and offers the Daylight switch', () => {
    const page = html('/');
    assert.match(page, /<html[^>]*data-theme="dark"/);
    assert.match(page, /Daylight theme/);
  });
});

// docs/marketing/seo/technical.md (code in src/seo) and ADR-020 (one English site that translates well).
describe('search and sharing', () => {
  const site = 'https://oxinov.com';
  const meta = (page, attr, name) =>
    new RegExp(`<meta ${attr}="${name.replace(/[:]/g, '\$&')}" content="([^"]*)"`).exec(page)?.[1];
  const jsonLd = (page) =>
    [...page.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(([, json]) => JSON.parse(json));

  it('gives every page a canonical URL, a useful description, and link-preview data', () => {
    const descriptions = new Set();
    for (const route of routes) {
      const page = html(route);
      assert.match(page, new RegExp(`<link rel="canonical" href="${site}${route}"`), `${route}: canonical`);
      const description = meta(page, 'name', 'description');
      assert.ok(description && description.length >= 50 && description.length <= 160, `${route}: description length ${description?.length}`);
      assert.ok(!descriptions.has(description), `${route}: duplicate description`);
      descriptions.add(description);
      assert.equal(meta(page, 'property', 'og:url'), `${site}${route}`, `${route}: og:url`);
      assert.ok(meta(page, 'property', 'og:title')?.includes('Oxinov'), `${route}: og:title`);
      const image = meta(page, 'property', 'og:image');
      assert.equal(image, `${site}/og/oxinov.png`, `${route}: og:image`);
      assert.equal(meta(page, 'name', 'twitter:card'), 'summary_large_image', `${route}: twitter:card`);
    }
    assert.ok(existsSync(join(out, 'og', 'oxinov.png')), 'share image file');
  });

  it('describes the company in valid structured data on every page', () => {
    for (const route of routes) {
      const data = jsonLd(html(route));
      const organization = data.find((item) => item['@type'] === 'Organization');
      assert.ok(organization, `${route}: Organization`);
      assert.equal(organization.url, site);
      assert.equal(organization.contactPoint.availableLanguage, 'English');
      assert.ok(data.every((item) => item['@context'] === 'https://schema.org'), `${route}: @context`);
    }
    assert.ok(jsonLd(html('/contact/')).some((item) => item['@type'] === 'LocalBusiness'), 'contact: office');
    assert.ok(jsonLd(html('/products/')).some((item) => item['@type'] === 'ItemList'), 'products: list');
    for (const route of ['/education/', '/legal/privacy/']) {
      assert.ok(jsonLd(html(route)).some((item) => item['@type'] === 'BreadcrumbList'), `${route}: breadcrumbs`);
    }
  });

  it('publishes robots.txt and a sitemap that lists every page', () => {
    const robots = readFileSync(join(out, 'robots.txt'), 'utf8');
    assert.match(robots, /^User-Agent: \*$/m);
    assert.match(robots, /^Allow: \/$/m);
    assert.match(robots, new RegExp(`^Sitemap: ${site}/sitemap\.xml$`, 'm'));
    const sitemap = readFileSync(join(out, 'sitemap.xml'), 'utf8');
    const listed = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, url]) => url);
    assert.deepEqual([...listed].sort(), routes.map((route) => `${site}${route}`).sort());
    const priority = (route) => Number(new RegExp(`<loc>${site}${route}</loc>[\\s\\S]*?<priority>([\\d.]+)</priority>`).exec(sitemap)?.[1]);
    assert.equal(priority('/'), 1, 'home page first');
    assert.ok(priority('/products/') > priority('/legal/'), 'products above policies');
  });

  it('keeps the error page out of search results', () => {
    const page = readFileSync(join(out, '404.html'), 'utf8');
    assert.match(page, /<meta name="robots" content="noindex, follow"/);
    assert.doesNotMatch(page, /<link rel="canonical"/);
  });

  it('offers a web app manifest with installable icons', () => {
    const manifest = JSON.parse(readFileSync(join(out, 'manifest.webmanifest'), 'utf8'));
    assert.equal(manifest.lang, 'en');
    for (const icon of manifest.icons) assert.ok(existsSync(join(out, icon.src)), `icon ${icon.src}`);
    assert.ok(manifest.icons.some((icon) => icon.purpose === 'maskable'), 'maskable icon');
    assert.match(html('/'), /<link rel="manifest" href="\/manifest\.webmanifest"/);
    assert.match(html('/'), /<link rel="apple-touch-icon" href="\/icons\/apple-touch-icon\.png"/);
  });

  it('stays readable through browser translation (ADR-020)', () => {
    for (const route of routes) {
      const page = html(route);
      // Translators may translate everything except the brand name.
      for (const [tag] of page.matchAll(/<[^>]+translate="no"[^>]*>[^<]*/g)) assert.match(tag, />\s*OXINOV\s*$/i, `${route}: ${tag}`);
      assert.match(page, /translate="no"[^>]*>\s*OXINOV/, `${route}: brand name kept`);
    }
    const securityTxt = readFileSync(join(out, '.well-known', 'security.txt'), 'utf8');
    assert.match(securityTxt, /^Preferred-Languages: en$/m);
  });

  it('keeps preloaded fonts within the budget and Latin only (brand typography T1-T3)', () => {
    const page = html('/');
    const preloaded = [...page.matchAll(/<link rel="preload" href="([^"]+\.woff2)"/g)].map(([, href]) => href);
    const bytes = preloaded.reduce((sum, href) => sum + statSync(join(out, href)).size, 0);
    assert.ok(bytes <= 150 * 1024, `preloaded fonts are ${Math.round(bytes / 1024)} KB (budget 150 KB)`);
    assert.doesNotMatch(readFileSync(join(out, '..', 'src', 'app', 'layout.tsx'), 'utf8'), /Devanagari/);
  });
});
