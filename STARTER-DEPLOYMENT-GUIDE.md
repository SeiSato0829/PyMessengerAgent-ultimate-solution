# 🚀 Starter本番デプロイ完全ガイド【辛口版】

## ⚠️ 警告：これを飛ばすと100%失敗します

### 現在の危険な状態
- ✅ コード: プロ版準備済み
- ✅ Starter: 登録完了
- ❌ 環境変数: 未設定 = **起動不可**
- ❌ デプロイ: 未実行 = **サービス停止中**

---

## 📝 STEP 1: 環境変数設定【5分】

### 1-1. Renderダッシュボード操作
```
1. https://dashboard.render.com
2. pymessenger-agent-pro をクリック
3. Environment → Add Environment Variable
```

### 1-2. 必須環境変数（これがないと起動しません）

```bash
# ========== Supabase設定（必須） ==========
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ========== セキュリティ（必須） ==========
ENCRYPTION_KEY=d7f8a9b3c2e1f4g5h6i7j8k9l0m1n2o3p4q5r6s7t8u9v0w1
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters

# ========== Facebook API（後で設定OK） ==========
FACEBOOK_APP_ID=temporary_value
FACEBOOK_APP_SECRET=temporary_value
FACEBOOK_PAGE_ACCESS_TOKEN=temporary_value
FACEBOOK_VERIFY_TOKEN=temporary_webhook_verify_token
```

### 1-3. パフォーマンス設定（推奨）

```bash
# 既にrender.yamlで設定済みですが確認
NODE_OPTIONS=--max-old-space-size=800
LOG_LEVEL=info
```

---

## 🔨 STEP 2: デプロイ実行【10分】

### 2-1. Manual Deploy
```
1. Renderダッシュボード → Manual Deploy
2. "Deploy latest commit" をクリック
3. ビルドログを監視（緑になるまで待つ）
```

### 2-2. ビルドエラー対策

#### ❌ よくあるエラーと解決法

**エラー1: Module not found**
```bash
# 解決: package.jsonの依存関係を確認
git pull origin main
git push origin main
```

**エラー2: Memory limit exceeded**
```bash
# 解決: NODE_OPTIONSを確認
NODE_OPTIONS=--max-old-space-size=800
```

**エラー3: Build timeout**
```bash
# 解決: 不要な依存関係を削除
npm prune --production
```

---

## 🔍 STEP 3: 動作確認【3分】

### 3-1. ヘルスチェック
```bash
# デプロイ完了後、以下のURLにアクセス
https://pymessenger-agent-pro.onrender.com/api/health

# 期待される応答
{"status":"ok","timestamp":"..."}
```

### 3-2. ダッシュボード確認
```bash
https://pymessenger-agent-pro.onrender.com

# ログイン画面が表示されればOK
```

---

## 🚨 STEP 4: よくある失敗と対策

### 失敗パターン1: 環境変数の設定ミス
- **症状**: Application error
- **原因**: SUPABASE_URLのコピペミス
- **解決**: 環境変数を再確認

### 失敗パターン2: ビルド失敗
- **症状**: Build failed
- **原因**: node_modules問題
- **解決**: GitHubで最新版確認

### 失敗パターン3: 起動後すぐ停止
- **症状**: Service unhealthy
- **原因**: ヘルスチェック失敗
- **解決**: /api/healthエンドポイント確認

---

## 📊 STEP 5: パフォーマンス最適化

### 5-1. 監視設定
```bash
# Renderダッシュボード → Metrics
- Memory使用率: 80%以下を維持
- CPU使用率: 70%以下を維持
- Response time: 500ms以下
```

### 5-2. アラート設定
```bash
# Settings → Notifications
- Service down: Email通知ON
- Deploy failed: Email通知ON
```

---

## ✅ 最終チェックリスト

### 必須確認項目
- [ ] 環境変数すべて設定済み
- [ ] デプロイ成功（緑のチェック）
- [ ] /api/health アクセス可能
- [ ] ダッシュボード表示確認
- [ ] ログにエラーなし
- [ ] メモリ使用率正常

### オプション確認項目
- [ ] Facebook API設定
- [ ] カスタムドメイン設定
- [ ] SSL証明書確認
- [ ] バックアップ設定

---

## 💡 辛口アドバイス

### やりがちな失敗
1. **環境変数の値にスペース** → 起動失敗
2. **URLの末尾にスラッシュ** → API接続失敗
3. **シークレットキーが短い** → セキュリティ脆弱

### 成功のコツ
1. **ログを見る** - エラーの90%はログに答えがある
2. **段階的確認** - 一気にやらず1つずつ確認
3. **バックアッププラン** - 失敗時の復旧手順を準備

---

## 🎯 今すぐやること

```bash
# 1. 環境変数設定（5分）
# 2. Deploy latest commit（10分）
# 3. ヘルスチェック（1分）
# 4. 完了！

# 合計: 16分で本番稼働
```

## 📈 期待される結果

- **15分後**: システム稼働開始
- **1時間後**: 自動化テスト可能
- **24時間後**: 初回レポート確認
- **1週間後**: 「手動に戻れない」

---

⚠️ **最重要**: 環境変数のSUPABASE_URLとKEYが間違っていると100%起動しません。コピペは慎重に！