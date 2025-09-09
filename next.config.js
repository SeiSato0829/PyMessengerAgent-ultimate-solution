/** @type {import('next').NextConfig} */
const nextConfig = {
  // 超軽量化設定
  output: 'standalone',
  experimental: {
    outputStandalone: true,
  },
  
  // JavaScript最小化
  swcMinify: true,
  compiler: {
    removeConsole: true,
  },
  
  // 画像最適化無効（メモリ節約）
  images: {
    unoptimized: true,
  },
  
  // 不要機能削除
  poweredByHeader: false,
  reactStrictMode: false,
  
  // webpack最適化
  webpack: (config, { isServer }) => {
    // 重いライブラリの削除
    config.resolve.alias = {
      ...config.resolve.alias,
      'react-hot-toast': false,
      'recharts': false,
    }
    
    // メモリ制限
    config.optimization.splitChunks = {
      chunks: 'all',
      maxSize: 50000, // 50KB chunks
    }
    
    return config
  },
  
  // 環境変数
  env: {
    NODE_OPTIONS: '--max-old-space-size=400',
  }
}

module.exports = nextConfig