#!/bin/bash

# 🚀 Render PostgreSQL統合セットアップスクリプト
# 本気で実装するための自動化スクリプト

set -e

echo "🔥 Render PostgreSQL統合セットアップ開始"
echo "=================================="

# 色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# エラーハンドリング
handle_error() {
    echo -e "${RED}❌ エラーが発生しました: $1${NC}"
    exit 1
}

# 成功メッセージ
success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# 警告メッセージ
warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

# 情報メッセージ
info() {
    echo -e "${BLUE}ℹ️ $1${NC}"
}

# 必須パッケージチェック
check_requirements() {
    info "必須パッケージをチェック中..."
    
    if ! command -v node &> /dev/null; then
        handle_error "Node.js がインストールされていません"
    fi
    
    if ! command -v npm &> /dev/null; then
        handle_error "npm がインストールされていません"
    fi
    
    if ! command -v psql &> /dev/null; then
        warning "psql がインストールされていません（PostgreSQL接続テストに必要）"
    fi
    
    success "必須パッケージチェック完了"
}

# 環境変数チェック
check_env_vars() {
    info "環境変数をチェック中..."
    
    if [ -z "$RENDER_DATABASE_URL" ]; then
        warning "RENDER_DATABASE_URL が設定されていません"
        echo "例: export RENDER_DATABASE_URL='postgres://user:pass@hostname:port/dbname'"
    fi
    
    if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
        warning "NEXT_PUBLIC_SUPABASE_URL が設定されていません"
    fi
    
    if [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
        warning "NEXT_PUBLIC_SUPABASE_ANON_KEY が設定されていません"
    fi
}

# パッケージインストール
install_packages() {
    info "追加パッケージをインストール中..."
    
    npm install pg @types/pg
    
    if [ $? -ne 0 ]; then
        handle_error "パッケージインストールに失敗しました"
    fi
    
    success "パッケージインストール完了"
}

# データベースセットアップ
setup_database() {
    info "Renderデータベースセットアップを開始..."
    
    if [ -z "$RENDER_DATABASE_URL" ]; then
        warning "RENDER_DATABASE_URL が設定されていないため、データベースセットアップをスキップします"
        return 0
    fi
    
    # データベース接続テスト
    psql "$RENDER_DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1
    if [ $? -ne 0 ]; then
        handle_error "Renderデータベースに接続できません。URL を確認してください"
    fi
    
    # スキーマ実行
    info "ワーカーデータベーススキーマを作成中..."
    psql "$RENDER_DATABASE_URL" -f sql/render_worker_schema.sql > /dev/null
    
    if [ $? -eq 0 ]; then
        success "データベーススキーマ作成完了"
    else
        handle_error "データベーススキーマ作成に失敗しました"
    fi
}

# 環境変数ファイル更新
update_env_file() {
    info ".env.local ファイルを更新中..."
    
    # .env.local.renderバックアップ作成
    if [ -f .env.local ]; then
        cp .env.local .env.local.backup
        info "既存の .env.local を .env.local.backup としてバックアップしました"
    fi
    
    # Render用の環境変数を追加
    cat >> .env.local << EOF

# Render PostgreSQL統合設定 (追加: $(date))
RENDER_DATABASE_URL=${RENDER_DATABASE_URL:-"postgres://user:pass@hostname:port/dbname"}
SYNC_INTERVAL=${SYNC_INTERVAL:-"30000"}
WORKER_BATCH_SIZE=${WORKER_BATCH_SIZE:-"5"}
WORKER_MAX_CONCURRENT=${WORKER_MAX_CONCURRENT:-"3"}
WORKER_RETRY_DELAY=${WORKER_RETRY_DELAY:-"60000"}
WORKER_HEARTBEAT_INTERVAL=${WORKER_HEARTBEAT_INTERVAL:-"30000"}
EOF
    
    success ".env.local ファイル更新完了"
}

# package.json にスクリプト追加
update_package_json() {
    info "package.json にワーカースクリプトを追加中..."
    
    # 現在のpackage.jsonを読み取り、scriptsに追加
    node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    pkg.scripts = pkg.scripts || {};
    pkg.scripts['worker:render'] = 'node --loader ts-node/esm worker/render-worker.ts';
    pkg.scripts['worker:dev'] = 'nodemon --exec \"npm run worker:render\"';
    pkg.scripts['sync:render'] = 'node --loader ts-node/esm scripts/manual-sync.ts';
    pkg.scripts['db:setup'] = './scripts/setup-render-integration.sh';
    
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
    console.log('package.json updated');
    "
    
    success "package.json 更新完了"
}

# TypeScript設定更新
update_tsconfig() {
    info "TypeScript設定を更新中..."
    
    # tsconfig.jsonにpathエイリアスが含まれているかチェック
    if ! grep -q "\"@/lib/*\"" tsconfig.json 2>/dev/null; then
        warning "tsconfig.json にパスエイリアス設定が必要です"
        echo "以下を compilerOptions.paths に追加してください:"
        echo "  \"@/lib/*\": [\"./lib/*\"],"
        echo "  \"@/worker/*\": [\"./worker/*\"]"
    fi
}

# 初期同期テスト
test_sync() {
    info "初期同期テストを実行中..."
    
    # Node.jsでテスト実行
    node -e "
    const { getRenderSyncManager } = require('./lib/render/sync-manager.ts');
    
    (async () => {
      try {
        const syncManager = getRenderSyncManager();
        const health = await syncManager.healthCheck();
        
        console.log('ヘルスチェック結果:', health);
        
        if (health.render && health.supabase) {
          console.log('✅ 接続テスト成功');
          process.exit(0);
        } else {
          console.log('❌ 接続テスト失敗');
          process.exit(1);
        }
      } catch (error) {
        console.error('テストエラー:', error.message);
        process.exit(1);
      }
    })();
    " 2>/dev/null
    
    if [ $? -eq 0 ]; then
        success "接続テスト成功"
    else
        warning "接続テストに失敗しました。環境変数を確認してください。"
    fi
}

# 使用方法表示
show_usage() {
    echo ""
    echo -e "${GREEN}🎉 Render PostgreSQL統合セットアップ完了！${NC}"
    echo "=================================="
    echo ""
    echo "次のステップ:"
    echo ""
    echo "1. 開発サーバー起動:"
    echo "   npm run dev"
    echo ""
    echo "2. ワーカー起動 (別ターミナル):"
    echo "   npm run worker:render"
    echo ""
    echo "3. 同期状況確認:"
    echo "   http://localhost:3002/api/render/status"
    echo ""
    echo "4. 手動同期実行:"
    echo "   npm run sync:render"
    echo ""
    echo "📊 監視ダッシュボード:"
    echo "   http://localhost:3002/render/dashboard"
    echo ""
    echo -e "${YELLOW}注意事項:${NC}"
    echo "- Renderデータベースは$7/月の費用がかかります"
    echo "- ワーカーは別プロセスで実行する必要があります"
    echo "- 本番環境ではワーカーをVPSで実行することを推奨"
    echo ""
}

# メイン実行
main() {
    echo "セットアップを開始します..."
    echo ""
    
    check_requirements
    check_env_vars
    install_packages
    update_env_file
    update_package_json
    update_tsconfig
    
    # データベースセットアップ（オプション）
    if [ "$1" != "--skip-db" ]; then
        setup_database
    else
        info "データベースセットアップをスキップしました"
    fi
    
    # 接続テスト（オプション）
    if [ "$1" != "--skip-test" ] && [ "$2" != "--skip-test" ]; then
        test_sync
    else
        info "接続テストをスキップしました"
    fi
    
    show_usage
}

# ヘルプ表示
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "Render PostgreSQL統合セットアップスクリプト"
    echo ""
    echo "使用方法:"
    echo "  ./scripts/setup-render-integration.sh [オプション]"
    echo ""
    echo "オプション:"
    echo "  --skip-db     データベースセットアップをスキップ"
    echo "  --skip-test   接続テストをスキップ"
    echo "  --help, -h    このヘルプを表示"
    echo ""
    echo "事前準備:"
    echo "  1. Renderでデータベースを作成"
    echo "  2. RENDER_DATABASE_URL を環境変数に設定"
    echo "  3. このスクリプトを実行"
    echo ""
    exit 0
fi

# メイン実行
main "$@"