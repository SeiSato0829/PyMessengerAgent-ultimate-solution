# ⚡ Render クイックスタート（5分版）

## 1️⃣ Renderで新規作成【2分】

### A. ログインして新規作成
```
1. https://dashboard.render.com
2. 右上「New +」→「Web Service」
3. GitHub連携（初回のみ）
```

### B. リポジトリ接続
```
1. "PyMessengerAgent-ultimate-solution" を選択
2. 「Connect」をクリック
```

---

## 2️⃣ サービス設定【1分】

```yaml
Name: pymessenger-agent-pro
Region: Oregon (US West)
Branch: main
Instance Type: Starter ($7/month) ← 重要！
```

**「Create Web Service」をクリック**

---

## 3️⃣ 環境変数設定【2分】

ビルドが始まったら、すぐに：

### Environment → Add Environment Variable

```bash
# 必須（Supabaseから取得）
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_KEY=eyJhbGc...

# セキュリティ（コピペOK）
ENCRYPTION_KEY=d7f8a9b3c2e1f4g5h6i7j8k9l0m1n2o3p4q5r6s7t8u9v0w1
JWT_SECRET=super-secret-jwt-key-minimum-32-characters-long-2024

# Facebook（仮でOK）
FACEBOOK_APP_ID=temp
FACEBOOK_APP_SECRET=temp
FACEBOOK_PAGE_ACCESS_TOKEN=temp
FACEBOOK_VERIFY_TOKEN=temp

# パフォーマンス
NODE_OPTIONS=--max-old-space-size=800
```

**「Save Changes」→「Manual Deploy」→「Deploy latest commit」**

---

## ✅ 動作確認

```bash
# 5分後にアクセス
https://pymessenger-agent-pro.onrender.com/api/health

# OK: {"status":"ok"}
```

---

## ⚠️ エラー時の対処

### Build failed
→ 環境変数を再確認

### Application failed
→ SUPABASE_URLの末尾に/がないか確認

### 500 Error
→ 環境変数のコピペミスを確認

---

**所要時間: 5-10分で完了！**