/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    outputFileTracingIncludes: {
      'src/app/api/share-image': [
        './node_modules/@sparticuz/chromium/**',
      ],
    },
    serverComponentsExternalPackages: [
      'puppeteer-core',
      '@sparticuz/chromium',
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig