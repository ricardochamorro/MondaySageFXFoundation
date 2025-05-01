/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@mondaysagefx/ui'],
  images: {
    domains: ['avatars.githubusercontent.com', 'monday.com'],
  },
}

module.exports = nextConfig 