import bundleAnalyzer from '@next/bundle-analyzer';

/** @type {import('next').NextConfig} */
const baseConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true, // Temp to remove image optimizer from equation
  },
  async rewrites() {
    return [
      {
        source: '/v1/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}/v1/:path*`,
      },
      {
        source: '/auth/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001'}/auth/:path*`,
      },
    ];
  },
};

const withAnalyzer = bundleAnalyzer({ enabled: process.env.ANALYZE === 'true' });
const nextConfig = withAnalyzer(baseConfig);

export default nextConfig;
