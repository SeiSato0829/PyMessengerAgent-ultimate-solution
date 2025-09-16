# 🚨 緊急: Render.com環境変数の正しい設定

## 現在の問題
LocalStorage認証があってもデモモードになる原因：
- 環境変数が未設定または間違った値

## 必須環境変数（正確な値）

```bash
# Facebook認証（必須！）
FACEBOOK_APP_ID=1074848747815619
FACEBOOK_APP_SECRET=ae554f1df345416e5d6d08c22d07685d

# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=https://dljjqtozqjszuxroelnr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=（あなたのキー）

# アプリURL
NEXT_PUBLIC_APP_URL=https://pymessengeragent-ultimate-solution.onrender.com

# セキュリティ
JWT_SECRET=super-secret-jwt-key-minimum-32-characters-long-2024
ENCRYPTION_KEY=d7f8a9b3c2e1f4g5h6i7j8k9l0m1n2o3p4q5r6s7t8u9v0w1
```

## ⚠️ 削除すべき環境変数

以下の値が設定されている場合は**削除**してください：
- `temporary_app_id`
- `temporary_app_secret`
- `your-facebook-app-id`
- `demo-app-id`

## 設定手順

1. **Render.comダッシュボード** → **Environment**
2. 古い値を全て削除
3. 上記の正確な値を追加
4. **Save Changes**
5. **Manual Deploy** → **Clear cache and deploy**

## 確認方法

デプロイ後のログで確認：
```
✅ FACEBOOK_APP_ID: 設定済み
✅ FACEBOOK_APP_SECRET: 設定済み
```

## トラブルシューティング

もし設定後もデモモードになる場合：
1. ブラウザのキャッシュをクリア
2. LocalStorageを再設定（/auth-fix.html使用）
3. Render.comで再度Clear cache and deploy