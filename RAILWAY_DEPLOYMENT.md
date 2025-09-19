# Railway デプロイメント完全ガイド

## 🚂 Railway移行完了！Vercelから完全移行対応済み

### なぜRailway？
- **フルスタック対応**: Next.js + PostgreSQL + Redisを1つのプロジェクトで管理
- **柔軟な料金体系**: 従量課金制で小規模なら月$5以内
- **バックエンド強化**: 長時間処理、WebSocket、重いAPIも問題なし
- **DB統合**: PostgreSQLが簡単に追加でき、接続情報も自動設定

---

## 📋 デプロイ前の準備

### 1. Railway アカウント作成
1. https://railway.app にアクセス
2. GitHubアカウントでサインアップ（推奨）
3. 支払い方法を設定（無料枠：月$5分のクレジット付き）

### 2. Railway CLI インストール（オプション）
```bash
# macOS/Linux
curl -fsSL https://railway.app/install.sh | sh

# Windows (PowerShell)
iwr -useb https://railway.app/install.ps1 | iex
```

---

## 🚀 デプロイ手順

### 方法1: GitHub連携（推奨）

1. **Railwayダッシュボードで新規プロジェクト作成**
   - https://railway.app/dashboard にログイン
   - 「New Project」クリック
   - 「Deploy from GitHub repo」選択

2. **GitHubリポジトリ選択**
   - `SeiSato0829/PyMessengerAgent-ultimate-solution` を選択
   - ブランチを `main` に設定

3. **環境変数の設定**
   - プロジェクト設定 → Variables タブ
   - 以下を追加：

```env
# アプリケーションURL（Railway提供のURLに変更）
NEXT_PUBLIC_APP_URL=https://your-app-name.up.railway.app

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://rxipbozxhkzvlekrbjud.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4aXBib3p4aGt6dmxla3JianVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU2MDg0NzgsImV4cCI6MjA0MTE4NDQ3OH0.vTWRLqpPjUGTH2U0TBRZLM5N3r86O9E6Eq5INIoL7jY

# Facebook
FACEBOOK_APP_ID=1074848747815619
FACEBOOK_APP_SECRET=ae554f1df345416e5d6d08c22d07685d

# Node
NODE_ENV=production
```

4. **PostgreSQLデータベース追加（オプション）**
   - 「Add Service」→「Database」→「PostgreSQL」
   - 自動的に`DATABASE_URL`が設定される

5. **デプロイ開始**
   - 「Deploy」ボタンをクリック
   - ビルドログを確認（約3-5分）

### 方法2: Railway CLI（ローカルから直接）

```bash
# Railwayにログイン
railway login

# プロジェクト作成
railway init

# 環境変数設定
railway variables set NEXT_PUBLIC_APP_URL=https://your-app.up.railway.app
railway variables set FACEBOOK_APP_ID=1074848747815619
railway variables set FACEBOOK_APP_SECRET=ae554f1df345416e5d6d08c22d07685d

# デプロイ
railway up
```

---

## 🔧 デプロイ後の設定

### 1. カスタムドメイン設定（オプション）
- Settings → Domains
- カスタムドメインを追加
- DNSレコードを設定

### 2. Facebook開発者コンソール更新

**重要**: Facebook開発者コンソールでコールバックURLを更新

1. https://developers.facebook.com にログイン
2. アプリ設定 → Facebookログイン → 設定
3. **有効なOAuthリダイレクトURI**に追加：
   ```
   https://your-app-name.up.railway.app/api/auth/facebook/callback
   ```

### 3. ヘルスチェック確認
```bash
curl https://your-app-name.up.railway.app/api/health
```

---

## 📊 Railway ダッシュボード

### メトリクス確認
- **Deployments**: デプロイ履歴とログ
- **Metrics**: CPU、メモリ、帯域幅使用量
- **Logs**: リアルタイムログ表示
- **Variables**: 環境変数管理
- **Settings**: ドメイン、リージョン設定

### 料金監視
- **Usage**: 現在の使用量と料金
- **Billing**: 請求履歴
- アラート設定で予算超過を防ぐ

---

## 🔍 トラブルシューティング

### ビルドエラー時
```bash
# ログ確認
railway logs

# 環境変数確認
railway variables
```

### よくあるエラーと解決法

1. **`Module not found`エラー**
   - `npm ci`または`npm install`を確実に実行
   - package-lock.jsonをコミット

2. **環境変数未設定**
   - Railway ダッシュボードで確認
   - NEXT_PUBLIC_APP_URLが正しく設定されているか

3. **ポート設定エラー**
   - package.jsonの`start`スクリプトに`-p ${PORT:-3000}`を追加済み

---

## ✅ デプロイ完了チェックリスト

- [ ] Railwayにデプロイ成功
- [ ] https://your-app.up.railway.app でアクセス可能
- [ ] Facebook認証が動作
- [ ] 環境変数が正しく設定
- [ ] ヘルスチェック応答確認
- [ ] Facebook開発者コンソールでコールバックURL更新

---

## 🎉 完了！

RailwayでのNext.jsアプリケーションが稼働開始しました。

### 次のステップ
1. PostgreSQLデータベースを追加して本格的なデータ管理
2. Redisを追加してセッション管理やキャッシング
3. GitHub Actionsと連携してCI/CD構築

### サポート
- Railway公式ドキュメント: https://docs.railway.app
- Railwayコミュニティ: https://discord.gg/railway
- このプロジェクトの問題: GitHubのIssuesへ