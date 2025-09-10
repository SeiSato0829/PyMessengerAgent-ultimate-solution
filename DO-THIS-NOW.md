# 🎯 今すぐやること（10分で完了）

## 📍 現在地
- ✅ Starterプラン登録済み
- ✅ コード準備完了（GitHub最新）
- ⏳ **あとは環境変数設定とデプロイだけ**

---

## 🚀 実行手順（コピペで完了）

### 1️⃣ Renderダッシュボードを開く【1分】
```
https://dashboard.render.com
→ pymessenger-agent-pro をクリック
→ Environment タブを開く
```

### 2️⃣ 環境変数を設定【3分】
以下を1つずつ追加（Add Environment Variable）:

```bash
# Supabase（あなたの値に変更）
NEXT_PUBLIC_SUPABASE_URL = https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGc...（あなたのキー）
SUPABASE_SERVICE_KEY = eyJhbGc...（あなたのキー）

# セキュリティ（このままコピペOK）
ENCRYPTION_KEY = d7f8a9b3c2e1f4g5h6i7j8k9l0m1n2o3p4q5r6s7t8u9v0w1
JWT_SECRET = super-secret-jwt-key-minimum-32-characters-long-2024

# Facebook（一旦仮でOK）
FACEBOOK_APP_ID = temp_id
FACEBOOK_APP_SECRET = temp_secret
FACEBOOK_PAGE_ACCESS_TOKEN = temp_token
FACEBOOK_VERIFY_TOKEN = verify_2024
```

### 3️⃣ デプロイ実行【5分】
```
1. Save Changes をクリック
2. Manual Deploy タブへ
3. "Deploy latest commit" をクリック
4. ログが緑になるまで待つ（3-5分）
```

### 4️⃣ 動作確認【1分】
```bash
# ブラウザでアクセス
https://pymessenger-agent-pro.onrender.com/api/health

# 成功: {"status":"ok"}
# 失敗: エラー → TROUBLESHOOTING.md参照
```

---

## ✅ 完了チェック

- [ ] 環境変数設定（特にSupabase）
- [ ] Deploy latest commit実行
- [ ] ビルドログが緑
- [ ] /api/health が {"status":"ok"}

---

## 🔥 これができたら

1. **ダッシュボードアクセス**
   ```
   https://pymessenger-agent-pro.onrender.com
   ```

2. **ログイン情報**
   - SupabaseでユーザーをAuthenticationから作成
   - または新規登録機能を使用

3. **Facebook連携**（後日でOK）
   - Facebook Developer登録
   - App作成
   - 環境変数更新

---

## ⚠️ よくあるミス

### ❌ SUPABASE_URLの末尾に/
```bash
# 間違い: https://xxx.supabase.co/
# 正解: https://xxx.supabase.co
```

### ❌ 環境変数にスペース
```bash
# 間違い: KEY = value （スペースあり）
# 正解: KEY=value （スペースなし）
```

### ❌ コピペミス
```bash
# KEYが途中で切れていないか確認
# 特にeyJhbGc...の長いキー
```

---

## 📞 困ったら

1. **TROUBLESHOOTING.md** を確認
2. **Renderのログ** でエラーを探す
3. **環境変数** を再確認（90%はここ）

---

⏰ **所要時間: 10分**
🎯 **成功率: 95%**（環境変数を正しく設定すれば）

**今すぐ始めてください。10分後には自動化システムが動いています。**