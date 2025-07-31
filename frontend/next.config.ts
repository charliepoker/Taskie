import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    typedRoutes: true,
    optimizePackageImports: [
      'antd',
      '@ant-design/icons',
      'chart.js',
      'react-chartjs-2',
    ],
  },
  output: 'standalone',
  env: {
    BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:5000',
  },
  // CDN configuration
  assetPrefix: process.env.CDN_URL || '',
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // CDN loader configuration
    loader: process.env.CDN_URL ? 'custom' : 'default',
    loaderFile: process.env.CDN_URL ? './src/lib/imageLoader.ts' : undefined,
  },
  // Enable compression
  compress: true,
  // Enable SWC minification
  swcMinify: true,
  // Optimize bundle splitting
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
          },
          antd: {
            test: /[\\/]node_modules[\\/](antd|@ant-design)[\\/]/,
            name: 'antd',
            chunks: 'all',
            priority: 20,
          },
          charts: {
            test: /[\\/]node_modules[\\/](chart\.js|react-chartjs-2)[\\/]/,
            name: 'charts',
            chunks: 'all',
            priority: 20,
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 5,
            reuseExistingChunk: true,
          },
        },
      };
    }
    return config;
  },
  // Performance optimizations
  poweredByHeader: false,
  generateEtags: true,
  // Static optimization
  trailingSlash: false,
  // Headers for caching
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
