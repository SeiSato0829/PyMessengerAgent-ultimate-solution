/** @type {import('next').NextConfig} */
const nextConfig = {
  // エンタープライズ級設定
  output: 'standalone',
  
  // 最大パフォーマンス設定
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
    styledComponents: true,
  },
  
  // 画像最適化有効（プロプランで十分なメモリ）
  images: {
    unoptimized: false,
    domains: ['supabase.co', 'localhost'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // 完全機能有効
  poweredByHeader: false,
  reactStrictMode: true,
  
  // プロダクション最適化
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // フル機能webpack設定
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true,
        },
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          priority: -10,
          chunks: 'all',
        },
      },
    }
    
    // 本格的なBundle分析対応
    if (process.env.ANALYZE === 'true') {
      const BundleAnalyzerPlugin = require('@next/bundle-analyzer')()
      config.plugins.push(new BundleAnalyzerPlugin())
    }
    
    return config
  },
  
  // 実験的機能有効（プロプランで安定動作）
  experimental: {
    appDir: true,
    serverActions: true,
    instrumentationHook: true,
  },
  
  // セキュリティヘッダー
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
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig