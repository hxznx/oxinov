import type { Price } from './edu-api.ts';

/** Prices are stored as integer minor units (FR shared rules); the currency decides the decimal places. */
export function formatPrice(price: Price, locale = 'en'): string {
  if (price.amountMinor === 0) return 'Free';
  const digits = new Intl.NumberFormat(locale, { style: 'currency', currency: price.currency }).resolvedOptions().maximumFractionDigits ?? 2;
  return new Intl.NumberFormat(locale, { style: 'currency', currency: price.currency }).format(price.amountMinor / 10 ** digits);
}

export function formatDuration(seconds: number | null): string | null {
  if (!seconds || seconds <= 0) return null;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return minutes % 60 === 0 ? `${hours} h` : `${hours} h ${minutes % 60} min`;
}

/** Workspace addresses (slugs) follow the API rule: 3-63 lowercase letters, digits, hyphens. */
export function suggestSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 63)
    .replace(/-+$/g, '');
}

/** Shows a join code in two readable halves: K7PX9QMD -> K7PX-9QMD. */
export function displayCode(code: string): string {
  return code.length === 8 ? `${code.slice(0, 4)}-${code.slice(4)}` : code;
}

/** Date in the workspace's time zone; an unknown zone name falls back to UTC instead of failing the page. */
export function formatDate(value: string | Date, timeZone: string, locale = 'en'): string {
  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
  try {
    return new Date(value).toLocaleDateString(locale, { ...options, timeZone });
  } catch {
    return new Date(value).toLocaleDateString(locale, { ...options, timeZone: 'UTC' });
  }
}
