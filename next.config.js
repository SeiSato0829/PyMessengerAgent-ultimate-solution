/** @type {import('next').NextConfig} */
const nextConfig = {
  // プロプラン用の高性能設定
  output: 'standalone',
  
  // 画像最適化
  images: {
    domains: ['graph.facebook.com', 'scontent.xx.fbcdn.net'],
    formats: ['image/avif', 'image/webp'],
  },
  
  // React厳密モード有効（品質向上）
  reactStrictMode: true,
  
  
  // 実験的機能
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  
  // セキュリティヘッダー
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          }
        ]
      }
    ]
  },
  
  // Webpack設定
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    return config
  }
}

module.exports = nextConfig