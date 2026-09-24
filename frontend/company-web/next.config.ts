import type { NextConfig } from 'next';

// oxinov.com is a static export served from S3 behind CloudFront (no Node server in production).
const config: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  poweredByHeader: false,
  reactStrictMode: true,
};

export default config;
