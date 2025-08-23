/** @type {import('next').NextConfig} */

// =============================================================================
// Next.js Configuration for Staging Environment
// =============================================================================
// Optimized configuration for staging deployment with proper security,
// performance, and monitoring settings.

const nextConfig = {
  // =============================================================================
  // Environment Configuration
  // =============================================================================
  env: {
    CUSTOM_KEY: 'staging',
    ENVIRONMENT: 'staging',
  },

  // =============================================================================
  // Build Configuration
  // =============================================================================
  output: 'standalone',
  generateEtags: true,
  poweredByHeader: false,
  compress: true,

  // =============================================================================
  // Performance Optimizations
  // =============================================================================
  experimental: {
    // Enable modern bundling optimizations
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],

    // Server-side rendering optimizations
    serverComponentsExternalPackages: ['pino', 'pino-pretty'],

    // Caching optimizations
    staleTimes: {
      dynamic: 30,
      static: 180,
    },
  },

  // =============================================================================
  // Image Optimization
  // =============================================================================
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 7, // 7 days
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    domains: ['staging.gogym.mx', 'api-staging.gogym.mx'],
  },

  // =============================================================================
  // Security Headers
  // =============================================================================
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://checkout.stripe.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https://api-staging.vigor-gym.com https://api.stripe.com",
              "frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              'upgrade-insecure-requests',
            ].join('; '),
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // =============================================================================
  // API Rewrites for Same-Origin Requests
  // =============================================================================
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: `${process.env.API_ORIGIN || 'https://api-staging.vigor-gym.com'}/v1/:path*`,
      },
      {
        source: '/api/auth/:path*',
        destination: `${process.env.API_ORIGIN || 'https://api-staging.vigor-gym.com'}/auth/:path*`,
      },
      {
        source: '/api/health',
        destination: `${process.env.API_ORIGIN || 'https://api-staging.vigor-gym.com'}/health`,
      },
    ];
  },

  // =============================================================================
  // Redirects
  // =============================================================================
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/admin/dashboard',
        permanent: false,
      },
      {
        source: '/dashboard',
        destination: '/admin/dashboard',
        permanent: false,
      },
    ];
  },

  // =============================================================================
  // Webpack Configuration
  // =============================================================================
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Optimize bundle size
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            enforce: true,
          },
        },
      },
    };

    // Add bundle analyzer in staging
    if (process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
          reportFilename: isServer ? '../analyze/server.html' : './analyze/client.html',
        })
      );
    }

    return config;
  },

  // =============================================================================
  // Logging Configuration
  // =============================================================================
  logging: {
    fetches: {
      fullUrl: true,
    },
  },

  // =============================================================================
  // TypeScript Configuration
  // =============================================================================
  typescript: {
    ignoreBuildErrors: false,
  },

  // =============================================================================
  // ESLint Configuration
  // =============================================================================
  eslint: {
    ignoreDuringBuilds: false,
  },

  // =============================================================================
  // Development Configuration
  // =============================================================================
  reactStrictMode: true,
  swcMinify: true,

  // =============================================================================
  // Monitoring and Analytics
  // =============================================================================
  analyticsId: process.env.NEXT_PUBLIC_ANALYTICS_ID,
};

module.exports = nextConfig;
