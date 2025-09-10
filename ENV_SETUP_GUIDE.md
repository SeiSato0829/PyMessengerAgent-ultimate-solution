# 環境変数設定ガイド - Facebook DM送信システム

## 必要な環境変数一覧

このシステムを動作させるには、以下の5つの環境変数が必要です。

---

## 1. Facebook App ID & Secret

### 📘 FACEBOOK_APP_ID
### 🔐 FACEBOOK_APP_SECRET

**取得手順：**

1. **Facebook開発者アカウントを作成**
   - https://developers.facebook.com にアクセス
   - 「始める」または「Get Started」をクリック
   - Facebookアカウントでログイン

2. **新しいアプリを作成**
   - 右上の「マイアプリ」→「アプリを作成」をクリック
   - アプリタイプを選択：
     - 「ビジネス」を選択（推奨）
   - アプリ名を入力（例：「My Messenger Bot」）
   - メールアドレスを確認

3. **App IDとSecretを取得**
   - アプリ作成後、ダッシュボードに移動
   - **App ID**：画面上部に表示される15〜16桁の数字
   - **App Secret**：
     - 「設定」→「ベーシック」をクリック
     - 「アプリシークレット」の「表示」をクリック
     - パスワードを入力して確認
     - 32文字の英数字が表示される

4. **必要な権限を設定**
   - 「製品を追加」→「Messenger」を選択
   - 「設定」から以下の権限を有効化：
     - `pages_messaging`
     - `pages_manage_metadata`
     - `pages_read_engagement`

**例：**
```
FACEBOOK_APP_ID=1234567890123456
FACEBOOK_APP_SECRET=abcdef123456789abcdef123456789ab
```

---

## 2. Supabase設定

### 🌐 NEXT_PUBLIC_SUPABASE_URL
### 🔑 NEXT_PUBLIC_SUPABASE_ANON_KEY

**取得手順：**

1. **Supabaseアカウントを作成**
   - https://supabase.com にアクセス
   - 「Start your project」をクリック
   - GitHubまたはメールでサインアップ

2. **新しいプロジェクトを作成**
   - 「New Project」をクリック
   - プロジェクト情報を入力：
     - **Name**：任意の名前（例：facebook-dm-system）
     - **Database Password**：強力なパスワードを生成
     - **Region**：最寄りのリージョンを選択（日本なら「Northeast Asia (Tokyo)」）
   - 「Create new project」をクリック

3. **APIキーを取得**
   - プロジェクト作成後、左サイドバーの「Settings」をクリック
   - 「API」タブを選択
   - 以下の2つをコピー：
     - **Project URL**：`https://xxxxxxxxxxxxx.supabase.co`の形式
     - **anon public**：`eyJ...`で始まる長い文字列

**例：**
```
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...（長い文字列）
```

---

## 3. 暗号化キー

### 🔒 ENCRYPTION_KEY

**生成方法：**

**方法1：Node.jsで生成（推奨）**
```bash
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

**方法2：オンラインツール**
- https://www.random.org/strings/ にアクセス
- 設定：
  - Length: 32
  - Characters: Lowercase + Digits
- 「Get Strings」をクリック

**方法3：手動生成**
- 32文字の英数字をランダムに組み合わせる
- 例：`a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`

**例：**
```
ENCRYPTION_KEY=your32characterencryptionkeyhere
```

---

## Render.comでの設定方法

1. **Render.comにログイン**
   - https://dashboard.render.com

2. **サービスを選択**
   - 「pymessengeragent-ultimate-solution」をクリック

3. **Environment変数を追加**
   - 「Environment」タブをクリック
   - 「Add Environment Variable」をクリック
   - 各変数を追加：

```
Key: FACEBOOK_APP_ID
Value: （取得したApp ID）

Key: FACEBOOK_APP_SECRET
Value: （取得したSecret）

Key: NEXT_PUBLIC_SUPABASE_URL
Value: （SupabaseのProject URL）

Key: NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: （Supabaseのanon key）

Key: ENCRYPTION_KEY
Value: （生成した32文字のキー）
```

4. **保存とデプロイ**
   - 「Save Changes」をクリック
   - 自動的に再デプロイが開始される
   - 約5分待つ

---

## ⚠️ 重要な注意事項

1. **一時的な値は使用しない**
   - `temp_app_id`、`test123`などの仮の値は使用しない
   - 必ず実際の値を取得して設定する

2. **環境変数の文字数**
   - FACEBOOK_APP_ID：15文字以上
   - FACEBOOK_APP_SECRET：32文字
   - ENCRYPTION_KEY：32文字

3. **セキュリティ**
   - これらの値は絶対に公開しない
   - GitHubにコミットしない
   - スクリーンショットに含めない

4. **デモモードの解除**
   - 全ての環境変数を正しく設定すると、自動的にデモモードが解除される
   - 設定後、5分待ってからアクセスする

---

## トラブルシューティング

### 「アプリIDが無効」エラーが出る場合
1. Render.comで古い環境変数を削除
2. 正しい値で再設定
3. Save Changesをクリック
4. 5分待つ

### データベース接続エラーが出る場合
1. Supabaseのプロジェクトがアクティブか確認
2. URLとキーが正しくコピーされているか確認
3. NEXT_PUBLIC_プレフィックスを忘れていないか確認

### 認証が機能しない場合
1. Facebook Appが「開発モード」になっているか確認
2. 必要な権限が有効になっているか確認
3. App IDとSecretが完全にコピーされているか確認

---

## サポート

問題が解決しない場合は、以下を確認：
- `/api/auth/facebook/debug`エンドポイントで環境変数の状態を確認
- Render.comのログでエラーメッセージを確認
- Facebook開発者コンソールでアプリの状態を確認