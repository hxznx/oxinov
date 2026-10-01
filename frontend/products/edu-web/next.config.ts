import type { NextConfig } from 'next';

// edu.oxinov.com runs as a Node server (container) because it holds sessions and calls the Edu API.
const config: NextConfig = {
  output: 'standalone',
  // Shared TypeScript source packages are compiled by Next.js.
  transpilePackages: ['@oxinov/web-auth'],
  poweredByHeader: false,
  reactStrictMode: true,
  // Store administration moved into Oxinov Studio (ADR-028); earlier links and bookmarks keep working.
  async redirects() {
    return [
      { source: '/w/:slug/store/payments/:paymentId', destination: '/w/:slug/studio/payments/:paymentId', permanent: false },
      { source: '/w/:slug/store/payments', destination: '/w/:slug/studio/payments', permanent: false },
      { source: '/w/:slug/store/settings', destination: '/w/:slug/studio/settings', permanent: false },
      { source: '/w/:slug/teach/:courseId/plans', destination: '/w/:slug/studio/offerings/:courseId/plans', permanent: false },
      { source: '/w/:slug/people', destination: '/w/:slug/studio/people', permanent: false },
    ];
  },
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
