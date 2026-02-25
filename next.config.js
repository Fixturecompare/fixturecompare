/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    outputFileTracingIncludes: {
      'app/api/share-image': [
        './node_modules/@sparticuz/chromium/**',
      ],
    },
    serverComponentsExternalPackages: [
      'puppeteer-core',
      '@sparticuz/chromium',
    ],
  },
}

module.exports = nextConfig