/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/housatonic-maintenance',
        destination: '/store-maintenance-order',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig
