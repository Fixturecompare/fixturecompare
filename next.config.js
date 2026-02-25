/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    outputFileTracingIncludes: {
      '/api/share-image': [
        './node_modules/@sparticuz/chromium/bin/**',
      ],
    },
  },
}

module.exports = nextConfig