# Render デプロイ手順書

## 🚀 PyMessenger Dashboard を Render にデプロイする手順

### ステップ1: Githubリポジトリの準備
1. このプロジェクトをGitHubリポジトリにプッシュ
2. リポジトリを public または private で作成

### ステップ2: Render アカウント設定
1. [Render](https://render.com) でアカウント作成
2. GitHubアカウントと連携

### ステップ3: Web Service 作成
1. Render ダッシュボードで "New +" → "Web Service" 選択
2. GitHub リポジトリを選択
3. 以下の設定を入力：

**基本設定:**
- **Name**: `pymessenger-dashboard`
- **Environment**: `Node`
- **Region**: `Tokyo (Asia Pacific)`
- **Branch**: `main`
- **Root Directory**: 空白
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

**高度な設定:**
- **Node Version**: `20.x`
- **Instance Type**: `Free` (開始時) または `Starter`

### ステップ4: 環境変数設定
以下の環境変数をRender管理画面で設定：

```
NEXT_PUBLIC_SUPABASE_URL=https://dljjqtozqjszuxroelnr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsampxdG96cWpzenV4cm9lbG5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczOTM1ODcsImV4cCI6MjA3Mjk2OTU4N30.P2-H2JzV1C3_U3zL7HLSUyitXgZcxlH2H9WLs4QX3kQ
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsampxdG96cWpzenV4cm9lbG5yIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzM5MzU4NywiZXhwIjoyMDcyOTY5NTg3fQ.RV3CfBAFxa8gdM_64oIPIiRqfpS2d2C6hq9BRoExFbo
ENCRYPTION_KEY=bYfPGZk7FDqyd4vF1WEfJwbObCYa3tMd1pegrEOxhk8=
```

### ステップ5: デプロイ実行
1. "Create Web Service" をクリック
2. 自動ビルド・デプロイが開始
3. 完了まで約5-10分待機

### ステップ6: デプロイ後の確認
1. Render URLでアクセス (例: `https://pymessenger-dashboard.onrender.com`)
2. Supabase接続が正常であることを確認
3. 全機能の動作テスト

## ✅ 利点
- ✅ クリーンな本番環境
- ✅ 自動SSL証明書
- ✅ CDNによる高速配信  
- ✅ 自動スケーリング
- ✅ GitHub連携による自動デプロイ

## 📋 注意点
- フリープランは750時間/月制限あり
- スリープ機能あり（アクセスなしで一定時間後）
- 本格運用時はStarterプラン推奨（$7/月）

## 🔧 トラブルシューティング
**ビルドエラー時:**
1. ログを確認してTypeScriptエラーを修正
2. 依存関係の不足を解決
3. 環境変数が正しく設定されていることを確認

**実行エラー時:**
1. Start Commandが正しいか確認
2. ポート設定（Renderは自動）
3. Supabase接続設定を再確認