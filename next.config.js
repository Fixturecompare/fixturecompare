/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  experimental: {
    // Treat puppeteer and puppeteer-core as external server packages
    // so Next.js does NOT try to bundle or transpile them.
    serverComponentsExternalPackages: ['puppeteer', 'puppeteer-core'],
  },
};

module.exports = nextConfig;
