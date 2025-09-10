/** @type {import('next').NextConfig} */
const nextConfig = {
  // 無料プラン用超軽量設定
  output: 'standalone',
  
  // 全ての最適化を無効化してメモリ削減
  swcMinify: false,
  
  // 画像最適化完全無効
  images: {
    unoptimized: true,
  },
  
  // React厳密モード無効（メモリ節約）
  reactStrictMode: false,
  poweredByHeader: false,
  
  // Webpack超軽量設定
  webpack: (config, { isServer }) => {
    // 全ての重いライブラリを除外
    config.resolve.alias = {
      ...config.resolve.alias,
      'react-hot-toast': false,
      'recharts': false,
      'framer-motion': false,
      '@next/bundle-analyzer': false,
      'playwright': false,
      'lodash': false,
    }
    
    // チャンクサイズを最小に
    config.optimization.splitChunks = {
      chunks: 'all',
      maxSize: 20000, // 20KB以下
      minSize: 0,
    }
    
    // メモリ使用量制限
    if (!isServer) {
      config.optimization.runtimeChunk = false
    }
    
    return config
  },
  
  // 環境変数でメモリ制限
  env: {
    NODE_OPTIONS: '--max-old-space-size=350', // 350MB制限
  }
}

module.exports = nextConfig