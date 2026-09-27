import type { NextConfig } from 'next';

// edu.oxinov.com runs as a Node server (container) because it holds sessions and calls the Edu API.
const config: NextConfig = {
  output: 'standalone',
  // Shared TypeScript source packages are compiled by Next.js.
  transpilePackages: ['@oxinov/web-auth'],
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

export default config;
