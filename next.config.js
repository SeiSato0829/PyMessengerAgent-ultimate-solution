/** @type {import('next').NextConfig} */

// Railway環境を自動検出
const isRailway = process.env.RAILWAY_ENVIRONMENT !== undefined
const isProduction = process.env.NODE_ENV === 'production'

// デプロイメント環境に応じてURLを設定
let appUrl
if (isRailway) {
  // Railway環境（優先）
  appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pymessenger-agent.up.railway.app'
  console.log('🚂 Railway環境で動作中:', appUrl)
} else if (process.env.VERCEL) {
  // Vercel環境
  appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://pymessengeragent-ultimate-solution.vercel.app'
  console.log('▲ Vercel環境で動作中:', appUrl)
} else {
  // ローカル環境
  appUrl = 'http://localhost:3000'
  console.log('💻 ローカル環境で動作中:', appUrl)
}

// 環境変数のデフォルト値を設定
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://rxipbozxhkzvlekrbjud.supabase.co'
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4aXBib3p4aGt6dmxla3JianVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU2MDg0NzgsImV4cCI6MjA0MTE4NDQ3OH0.vTWRLqpPjUGTH2U0TBRZLM5N3r86O9E6Eq5INIoL7jY'
}
if (!process.env.FACEBOOK_APP_ID) {
  process.env.FACEBOOK_APP_ID = '1074848747815619'
}
if (!process.env.FACEBOOK_APP_SECRET) {
  process.env.FACEBOOK_APP_SECRET = 'ae554f1df345416e5d6d08c22d07685d'
}
if (!process.env.NEXT_PUBLIC_APP_URL) {
  process.env.NEXT_PUBLIC_APP_URL = appUrl
}

const nextConfig = {
  // Railway最適化設定
  output: isRailway ? 'standalone' : undefined,

  // 環境に応じた設定
  reactStrictMode: !isProduction,

  typescript: {
    ignoreBuildErrors: true,
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  // 環境変数を明示的に公開
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    FACEBOOK_APP_ID: process.env.FACEBOOK_APP_ID,
    FACEBOOK_APP_SECRET: process.env.FACEBOOK_APP_SECRET,
    IS_RAILWAY: String(isRailway),
    DEPLOYMENT_PLATFORM: isRailway ? 'railway' : process.env.VERCEL ? 'vercel' : 'local',
  },

  // Railway用のヘッダー設定
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Deployment-Platform',
            value: isRailway ? 'Railway' : process.env.VERCEL ? 'Vercel' : 'Local'
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
        ]
      }
    ]
  },

  // Railway用のWebpack設定
  webpack: (config, { isServer }) => {
    if (isRailway) {
      // Railway環境用の最適化
      config.optimization = {
        ...config.optimization,
        minimize: isProduction,
      }
    }

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

// 設定内容をログ出力
console.log('='.repeat(60))
console.log('Next.js Configuration')
console.log('Platform:', process.env.DEPLOYMENT_PLATFORM || 'unknown')
console.log('App URL:', process.env.NEXT_PUBLIC_APP_URL)
console.log('Supabase:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Configured' : '❌ Not configured')
console.log('Facebook:', process.env.FACEBOOK_APP_ID ? '✅ Configured' : '❌ Not configured')
console.log('='.repeat(60))

module.exports = nextConfig