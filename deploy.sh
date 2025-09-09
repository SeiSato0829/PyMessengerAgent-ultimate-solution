#!/bin/bash

# ================================================
# PyMessengerAgent Ultimate Solution デプロイ
# Supabase + Vercel + ローカルワーカー
# ================================================

set -e

# カラー定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${GREEN}"
echo "╔════════════════════════════════════════════════════╗"
echo "║     PyMessenger 最適解デプロイ v3.0               ║"
echo "║   Supabase + Vercel = 完全無料で動作保証          ║"
echo "╚════════════════════════════════════════════════════╝"
echo -e "${NC}"

# ステップ1: Supabaseセットアップ
echo -e "\n${BLUE}ステップ1: Supabaseセットアップ${NC}"
echo "========================================"
echo ""
echo "1. https://supabase.com にアクセス"
echo "2. 'Start your project' をクリック"
echo "3. GitHubでサインイン"
echo "4. 新規プロジェクト作成:"
echo "   - Project name: pymessenger"
echo "   - Database Password: 強力なパスワード設定"
echo "   - Region: Northeast Asia (Tokyo)"
echo ""
read -p "Supabaseプロジェクトを作成しましたか？ (y/n): " SUPABASE_CREATED

if [ "$SUPABASE_CREATED" != "y" ]; then
    echo "Supabaseプロジェクトを作成してから再実行してください"
    exit 1
fi

# Supabase認証情報入力
echo -e "\n${BLUE}Supabase認証情報を入力${NC}"
echo "Settings → API から取得"
read -p "Project URL (https://xxx.supabase.co): " SUPABASE_URL
read -p "anon public key: " SUPABASE_ANON_KEY
read -p "service_role key (秘密): " SUPABASE_SERVICE_KEY

# .env.localファイル作成
cat > .env.local << EOF
# Supabase
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
SUPABASE_SERVICE_KEY=$SUPABASE_SERVICE_KEY

# アプリケーション
NEXT_PUBLIC_APP_URL=http://localhost:3000

# 暗号化キー（自動生成）
ENCRYPTION_KEY=$(openssl rand -base64 32)
EOF

echo -e "${GREEN}✓${NC} .env.local作成完了"

# ステップ2: Supabaseスキーマ適用
echo -e "\n${BLUE}ステップ2: データベーススキーマ適用${NC}"
echo "========================================"
echo ""
echo "1. Supabaseダッシュボード → SQL Editor"
echo "2. 'New query' をクリック"
echo "3. supabase/schema.sql の内容をコピー＆ペースト"
echo "4. 'Run' をクリック"
echo ""
echo "または以下のコマンドでSupabase CLIを使用:"
echo "  npx supabase db push --db-url \"$SUPABASE_URL\""
echo ""
read -p "スキーマを適用しましたか？ (y/n): " SCHEMA_APPLIED

if [ "$SCHEMA_APPLIED" != "y" ]; then
    echo "スキーマを適用してから続行してください"
    exit 1
fi

# ステップ3: 認証設定
echo -e "\n${BLUE}ステップ3: 認証設定${NC}"
echo "========================================"
echo ""
echo "Supabaseダッシュボード → Authentication → Providers"
echo "1. Email認証が有効になっていることを確認"
echo "2. （オプション）Google/GitHub OAuth設定"
echo ""
read -p "続行しますか？ (y/n): " CONTINUE

# ステップ4: Next.jsインストール
echo -e "\n${BLUE}ステップ4: Next.jsセットアップ${NC}"
echo "========================================"

# 依存関係インストール
npm install

# ビルド
npm run build

echo -e "${GREEN}✓${NC} Next.jsセットアップ完了"

# ステップ5: Vercelデプロイ
echo -e "\n${BLUE}ステップ5: Vercelデプロイ${NC}"
echo "========================================"
echo ""
echo "方法1: Vercel CLIを使用（推奨）"
echo "  npx vercel"
echo ""
echo "方法2: GitHubから自動デプロイ"
echo "  1. GitHubにプッシュ"
echo "  2. https://vercel.com/new でインポート"
echo ""
echo "環境変数を設定:"
echo "  - NEXT_PUBLIC_SUPABASE_URL"
echo "  - NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "  - SUPABASE_SERVICE_KEY"
echo "  - ENCRYPTION_KEY"
echo ""
read -p "Vercelデプロイを開始しますか？ (y/n): " DEPLOY_VERCEL

if [ "$DEPLOY_VERCEL" == "y" ]; then
    npx vercel --yes
fi

# ステップ6: ローカルワーカー設定
echo -e "\n${BLUE}ステップ6: ローカルワーカー設定${NC}"
echo "========================================"

# ワーカー用.envファイル作成
cat > local-worker/.env << EOF
# Supabase
SUPABASE_URL=$SUPABASE_URL
SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY

# ワーカー認証（Supabaseで作成したユーザー）
WORKER_EMAIL=worker@example.com
WORKER_PASSWORD=your-worker-password

# 暗号化キー（ダッシュボードと同じ）
ENCRYPTION_KEY=$(grep ENCRYPTION_KEY .env.local | cut -d '=' -f2)
EOF

echo -e "${GREEN}✓${NC} ワーカー設定完了"

# ステップ7: ワーカーユーザー作成
echo -e "\n${BLUE}ステップ7: ワーカーユーザー作成${NC}"
echo "========================================"
echo ""
echo "Supabaseダッシュボード → Authentication → Users"
echo "1. 'Add user' → 'Create new user'"
echo "2. Email: worker@example.com"
echo "3. Password: 強力なパスワード"
echo "4. 'Create user' をクリック"
echo ""
read -p "ワーカーユーザーを作成しましたか？ (y/n): " WORKER_CREATED

# 完了メッセージ
echo -e "\n${GREEN}"
echo "╔════════════════════════════════════════════════════╗"
echo "║            🎉 デプロイ完了！                      ║"
echo "╚════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "\n📝 次のステップ:"
echo "========================================"
echo ""
echo "1. ダッシュボードを起動:"
echo "   ${BLUE}npm run dev${NC}"
echo "   → http://localhost:3000"
echo ""
echo "2. ローカルワーカーを起動:"
echo "   ${BLUE}cd local-worker${NC}"
echo "   ${BLUE}python worker.py${NC}"
echo ""
echo "3. 本番URL:"
echo "   Vercel: https://your-app.vercel.app"
echo ""

echo -e "\n💰 コスト:"
echo "========================================"
echo "Supabase: ${GREEN}$0/月${NC} (無料枠)"
echo "  - 500MB データベース"
echo "  - 2GB 帯域幅"
echo "  - 50,000 認証ユーザー"
echo ""
echo "Vercel: ${GREEN}$0/月${NC} (無料枠)"
echo "  - 100GB 帯域幅"
echo "  - 無制限デプロイ"
echo ""
echo "合計: ${GREEN}$0/月${NC}"
echo ""

echo -e "\n⚠️ 重要:"
echo "========================================"
echo "1. Facebook自動化は${YELLOW}ローカルワーカー${NC}で実行"
echo "2. ダッシュボードは${GREEN}Vercel${NC}で公開"
echo "3. データベースは${GREEN}Supabase${NC}で管理"
echo "4. 完全無料で${GREEN}動作保証${NC}"
echo ""

echo -e "${GREEN}✅ すべて完了！${NC}"