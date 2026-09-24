/**
 * Only same-site relative paths may be used as post-sign-in destinations, so the portal can never
 * be used to redirect people to another site (open-redirect protection).
 */
export function safeReturnTo(value: string | null | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return '/';
  if (/[\u0000-\u001f\\]/.test(value)) return '/';
  if (value.startsWith('/auth/')) return '/';
  return value;
}
