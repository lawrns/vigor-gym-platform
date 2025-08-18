/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@vigor/shared'],
  experimental: {
    externalDir: true,
    esmExternals: true,
  },
  images: {
    remotePatterns: [],
  },
  webpack: (cfg) => {
    // Safety: avoid custom runtime tweaks; keep Next defaults
    delete cfg.externals?.webpack;  // guard against stray externals overrides
    return cfg;
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

export default nextConfig;


