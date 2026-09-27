/**
 * Where the app launcher sends people for a product (FR-ID-2207). Deployed portals use the
 * product's public address; local development may point a product at a local server with
 * PRODUCT_URLS, for example `edu=http://localhost:3002`.
 */
export function productUrl(product: { key: string; address: string }, overrides = process.env.PRODUCT_URLS): string {
  for (const entry of (overrides ?? '').split(',')) {
    const [key, url] = entry.split('=').map((part) => part.trim());
    if (key === product.key && url && /^https?:\/\//.test(url)) return url.replace(/\/$/, '');
  }
  return `https://${product.address}`;
}
