#!/bin/bash

echo "============================================================"
echo "Render.com ビルドスクリプト開始"
echo "============================================================"

# 環境変数のデバッグ出力
echo "現在の環境変数状態:"
echo "NEXT_PUBLIC_SUPABASE_URL: ${NEXT_PUBLIC_SUPABASE_URL:-未設定}"
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY: ${NEXT_PUBLIC_SUPABASE_ANON_KEY:-未設定}"
echo "============================================================"

# 環境変数が未設定の場合の警告
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
  echo "⚠️  警告: Supabase環境変数が未設定です"
  echo "Render.comダッシュボードで設定してください:"
  echo "1. Environment タブを開く"
  echo "2. NEXT_PUBLIC_SUPABASE_URL を追加"
  echo "3. NEXT_PUBLIC_SUPABASE_ANON_KEY を追加"
  echo "4. Save Changes をクリック"
  echo "============================================================"
fi

# node_modulesのクリア（キャッシュ問題対策）
if [ -d "node_modules" ]; then
  echo "node_modules をクリア中..."
  rm -rf node_modules
fi

# .nextのクリア（ビルドキャッシュ問題対策）
if [ -d ".next" ]; then
  echo ".next をクリア中..."
  rm -rf .next
fi

# 依存関係のインストール
echo "依存関係をインストール中..."
npm ci --legacy-peer-deps

# 環境変数検証
echo "環境変数を検証中..."
node scripts/validate-env.js

# ビルド実行
echo "Next.js ビルドを実行中..."
npm run build

echo "============================================================"
echo "ビルド完了"
echo "============================================================"