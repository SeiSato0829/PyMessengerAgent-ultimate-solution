#!/bin/bash

echo "🚀 緊急Vercelデプロイスクリプト"
echo "================================"
echo ""
echo "Renderがブロックされているため、Vercelに即座にデプロイします"
echo ""

# Node.jsとnpmの確認
if ! command -v node &> /dev/null; then
    echo "❌ Node.jsがインストールされていません"
    exit 1
fi

# ビルドの実行
echo "📦 プロジェクトをビルド中..."
npm run build || yarn build

# Vercel CLIのインストール確認
if ! command -v vercel &> /dev/null; then
    echo "📥 Vercel CLIをインストール中..."
    npm i -g vercel
fi

# Vercelにデプロイ
echo "🚀 Vercelにデプロイ中..."
echo ""
echo "以下の質問に答えてください："
echo "1. Set up and deploy? → Y"
echo "2. Scope → あなたのアカウント"
echo "3. Link to existing? → N"
echo "4. Project name → Enter（デフォルト）"
echo "5. Directory → Enter（デフォルト）"
echo "6. Build settings → Enter（自動検出）"
echo ""

vercel --prod

echo ""
echo "✅ デプロイ完了！"
echo "上記のURLにアクセスしてください"
echo ""
echo "例: https://pymessenger-agent.vercel.app"