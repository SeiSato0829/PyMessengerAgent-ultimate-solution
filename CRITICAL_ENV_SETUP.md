# 🚨 緊急：環境変数設定（必須）

## Render.comで今すぐ設定が必要な環境変数

### 1. Supabase設定
```
NEXT_PUBLIC_SUPABASE_URL=https://dljjqtozqjszuxroelnr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=（あなたのanon keyをここに）
SUPABASE_SERVICE_KEY=（あなたのservice keyをここに）
```

### 2. Facebook認証設定（重要！）
```
FACEBOOK_APP_ID=1074848747815619
FACEBOOK_APP_SECRET=ae554f1df345416e5d6d08c22d07685d
NEXT_PUBLIC_APP_URL=https://pymessengeragent-ultimate-solution.onrender.com
```

### 3. その他の必須設定
```
JWT_SECRET=super-secret-jwt-key-minimum-32-characters-long-2024
ENCRYPTION_KEY=d7f8a9b3c2e1f4g5h6i7j8k9l0m1n2o3p4q5r6s7t8u9v0w1
```

## 📝 設定手順

1. **Render.comダッシュボード** → **Environment**タブ
2. 上記の環境変数を**すべて**追加
3. **Save Changes**をクリック
4. **Manual Deploy** → **Clear cache and deploy**を実行

## ⚠️ 重要な注意点

- NEXT_PUBLIC_SUPABASE_ANON_KEYは`eyJ`で始まる長い文字列
- SUPABASE_SERVICE_KEYも`eyJ`で始まる長い文字列（Supabaseの Settings → API → service_role）
- Facebook環境変数が設定されていないと「このアプリではFacebookログインを現在利用できません」エラーになります

## 🔍 確認方法

デプロイ後のビルドログで以下を確認：
```
✅ NEXT_PUBLIC_SUPABASE_URL: 設定済み
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY: 設定済み
✅ Facebook App ID: 1074848747815619
```

## Facebook App設定も確認

1. https://developers.facebook.com/apps/1074848747815619
2. **設定** → **ベーシック**
3. **アプリモード**が「ライブ」になっているか確認
4. もし「開発」モードなら「ライブ」に切り替える