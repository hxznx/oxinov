/** Platform API address (api.oxinov.com). Sign-in settings are read by @oxinov/web-auth. */
let platformApiUrl: string | undefined;

export function platformApiBaseUrl(): string {
  if (platformApiUrl) return platformApiUrl;
  const value = process.env.PLATFORM_API_URL?.trim();
  if (!value) throw new Error('PLATFORM_API_URL is required (see frontend/platform-web/.env.example)');
  return (platformApiUrl = value.replace(/\/$/, ''));
}
