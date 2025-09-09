# 🚀 Render.com デプロイメントガイド

PyMessenger Agent をRenderで本格運用するための完全ガイドです。

## 📋 事前準備

### 1. GitHubリポジトリの準備
```bash
# GitHubに新しいリポジトリを作成し、コードをプッシュ
git init
git add .
git commit -m "Initial PyMessenger Agent commit"
git remote add origin https://github.com/yourusername/pymessenger-agent.git
git push -u origin main
```

### 2. 必要なファイルの確認
- ✅ `package.json` (PostgreSQL対応済み)
- ✅ `supabase_backup.sql` (データベース移行用)
- ✅ `render.yaml` (Render設定)
- ✅ `.env.production.example` (環境変数テンプレート)

## 🗄️ Step 1: PostgreSQLデータベースのセットアップ

### 1.1 Renderでデータベース作成
1. [Render Dashboard](https://dashboard.render.com) にログイン
2. **New** → **PostgreSQL** を選択
3. 以下の設定で作成：
   - **Name**: `pymessenger-db`
   - **Database**: `pymessenger`
   - **User**: `pymessenger_user`
   - **Plan**: Free (development) / Starter (production)

### 1.2 データベース初期化
データベース作成後、接続情報を取得し、以下のコマンドを実行：

```bash
# psqlを使用してSQL実行
psql "postgres://pymessenger_user:password@hostname:port/pymessenger" -f supabase_backup.sql
```

または、Renderダッシュボードの**Connect**タブでSQL実行：
```sql
-- supabase_backup.sqlの内容を貼り付けて実行
```

## 🌐 Step 2: Webサービスのデプロイ

### 2.1 Renderでサービス作成
1. **New** → **Web Service** を選択
2. GitHubリポジトリを接続
3. 以下の設定：
   - **Name**: `pymessenger-dashboard`
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Node Version**: 18 (Auto-detect recommended)

### 2.2 環境変数の設定
**Environment** タブで以下の環境変数を設定：

```env
# 基本設定
NODE_ENV=production
PORT=3000

# データベース接続（RenderのPostgreSQL接続文字列）
DATABASE_URL=postgres://pymessenger_user:password@hostname:port/pymessenger

# Supabase互換設定（ダミー値でOK）
NEXT_PUBLIC_SUPABASE_URL=https://your-render-app.onrender.com
NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy_anon_key_render
SUPABASE_SERVICE_KEY=dummy_service_key_render

# アプリケーションURL
NEXT_PUBLIC_APP_URL=https://your-render-app.onrender.com

# 暗号化キー（32文字以上のランダム文字列）
ENCRYPTION_KEY=your-secure-32-character-encryption-key
```

## 🔧 Step 3: アプリケーション設定の調整

### 3.1 データベース切り替え対応
Renderの本格運用では、Supabaseクライアントの代わりにPostgreSQLクライアントを使用：

`lib/supabase/client.ts` を以下で置換：
```typescript
import { createSupabaseCompatibleClient } from '@/lib/database/postgres';

export const supabase = process.env.NODE_ENV === 'production' 
  ? createSupabaseCompatibleClient()
  : createClient(supabaseUrl, supabaseAnonKey);
```

### 3.2 認証システムの調整
本格運用では独自認証システムを使用することを推奨。

## 📊 Step 4: 動作確認

### 4.1 デプロイ完了確認
1. Renderダッシュボードでビルドログを確認
2. **Live** ボタンでアプリケーションにアクセス
3. エラーがないことを確認

### 4.2 機能テスト
1. ユーザー登録・ログイン
2. Facebookアカウント追加
3. テストメッセージ送信
4. データベース保存確認

## 🚨 トラブルシューティング

### よくある問題

#### 1. ビルドエラー
```
Error: Cannot find module 'pg'
```
**解決策**: `package.json` に `pg` と `@types/pg` を追加

#### 2. データベース接続エラー
```
ECONNREFUSED
```
**解決策**: `DATABASE_URL` の接続文字列を確認

#### 3. 環境変数エラー
```
Supabase環境変数が設定されていません
```
**解決策**: ダミー値でも環境変数を設定

## 🔒 セキュリティ設定

### SSL/TLS
Renderは自動的にHTTPS証明書を設定

### 環境変数の保護
- 本番環境の機密情報はRenderの環境変数機能を使用
- `.env` ファイルはGitにコミットしない

### データベースセキュリティ
- PostgreSQL接続にSSLを使用
- 強力なパスワードを設定
- 必要に応じてIP制限を設定

## 📈 スケーリング

### 無料プランの制限
- 750時間/月の稼働時間
- 非アクティブ時の自動スリープ
- PostgreSQL: 1GB storage, 100 connections

### 有料プランへのアップグレード
本格運用時は以下をおすすめ：
- **Web Service**: Starter ($7/month)
- **PostgreSQL**: Starter ($7/month)

## 🔄 CI/CD設定

### 自動デプロイ
Renderは自動的にGitHubの`main`ブランチの変更を検出してデプロイ

### デプロイ前のテスト
`.github/workflows/test.yml` を作成：
```yaml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm run build
      - run: npm run lint
```

## 📊 監視・ログ

### Renderダッシュボード
- リアルタイムログ表示
- メトリクス監視
- アラート設定

### 外部監視サービス
本格運用では以下を検討：
- UptimeRobot（無料）
- Pingdom（有料）
- Datadog（本格運用）

## ✅ デプロイチェックリスト

- [ ] GitHubリポジトリ作成・プッシュ完了
- [ ] RenderでPostgreSQLデータベース作成
- [ ] `supabase_backup.sql` でデータベース初期化
- [ ] Webサービス作成・デプロイ完了  
- [ ] 環境変数すべて設定完了
- [ ] HTTPS接続確認
- [ ] ユーザー登録・ログイン動作確認
- [ ] Facebookアカウント追加動作確認
- [ ] メッセージ送信機能動作確認
- [ ] データベース保存確認
- [ ] エラーログ確認
- [ ] パフォーマンス確認

## 🎉 運用開始

全ての設定が完了すると、以下のURLでアプリケーションが利用可能：

**🌐 Live URL**: `https://your-app-name.onrender.com`

これで、PyMessenger Agent がRender上で本格運用開始です！🚀