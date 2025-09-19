/** @type {import('next').NextConfig} */

// Vercel初回デプロイ用にデフォルト値を設定
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://rxipbozxhkzvlekrbjud.supabase.co';
}
if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4aXBib3p4aGt6dmxla3JianVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU2MDg0NzgsImV4cCI6MjA0MTE4NDQ3OH0.vTWRLqpPjUGTH2U0TBRZLM5N3r86O9E6Eq5INIoL7jY';
}
if (!process.env.FACEBOOK_APP_ID) {
  process.env.FACEBOOK_APP_ID = '1074848747815619';
}
if (!process.env.FACEBOOK_APP_SECRET) {
  process.env.FACEBOOK_APP_SECRET = 'ae554f1df345416e5d6d08c22d07685d';
}
if (!process.env.NEXT_PUBLIC_APP_URL) {
  process.env.NEXT_PUBLIC_APP_URL = 'https://pymessengeragent-ultimate-solution.vercel.app';
}

const nextConfig = {
  reactStrictMode: true,
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
  },
}

module.exports = nextConfig