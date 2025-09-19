#!/bin/bash

# Vercel CLI インストールと即座のデプロイ
echo "🚀 Vercel クイックデプロイスクリプト"
echo "====================================="

# 1. Vercel CLIのインストール
echo "📦 Vercel CLIをインストール中..."
npm i -g vercel

# 2. プロジェクトのビルド
echo "🔨 プロジェクトをビルド中..."
yarn build

# 3. Vercelにデプロイ
echo "🚀 Vercelにデプロイ中..."
vercel --prod \
  --env FACEBOOK_APP_ID=1074848747815619 \
  --env FACEBOOK_APP_SECRET=ae554f1df345416e5d6d08c22d07685d \
  --env NEXT_PUBLIC_SUPABASE_URL=https://rxipbozxhkzvlekrbjud.supabase.co \
  --env NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4aXBib3p4aGt6dmxla3JianVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU2MDg0NzgsImV4cCI6MjA0MTE4NDQ3OH0.vTWRLqpPjUGTH2U0TBRZLM5N3r86O9E6Eq5INIoL7jY \
  --yes

echo "✅ デプロイ完了！"
echo "URLは上記に表示されています。"