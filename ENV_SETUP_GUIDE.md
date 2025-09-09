# 🔑 環境変数セットアップガイド

## 1. Supabase API Keys を取得

1. **Supabaseダッシュボード**にログイン
2. 左メニューから **Settings** → **API** をクリック
3. 以下の情報をコピー：

### Project URL
```
https://xxxxxxxxx.supabase.co
```

### anon public key
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxxxxxx...
```

### service_role key（秘密！）
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxxxxxx...
```

## 2. .env.local ファイルを編集

`.env.local` ファイルを開いて、以下のように編集：

```env
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=ここにProject URLを貼り付け
NEXT_PUBLIC_SUPABASE_ANON_KEY=ここにanon keyを貼り付け
SUPABASE_SERVICE_KEY=ここにservice_role keyを貼り付け

# アプリケーション設定
NEXT_PUBLIC_APP_URL=http://localhost:3000

# 暗号化キー（以下のコマンドで生成）
ENCRYPTION_KEY=ランダムな文字列を生成して貼り付け
```

## 3. 暗号化キーの生成

PowerShellまたはコマンドプロンプトで：

```powershell
# PowerShell
[System.Convert]::ToBase64String((1..32 | ForEach {Get-Random -Maximum 256}))
```

または

```bash
# WSL/Linux
openssl rand -base64 32
```

## 4. 確認

`.env.local` ファイルが以下のようになっていることを確認：

```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJz...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJz...
NEXT_PUBLIC_APP_URL=http://localhost:3000
ENCRYPTION_KEY=h3K9mP2xL8vQ5nR7wT1yB4jG6kA0sD3f=
```

## ⚠️ 重要な注意事項

- **`.env.local`** ファイルは **絶対にGitにコミットしない**
- **service_role key** は特に秘密（誰にも共有しない）
- 本番環境では異なるキーを使用する

## ✅ セットアップ完了後

環境変数の設定が完了したら、ターミナルで：

```bash
cd ultimate-solution
npm run dev
```

http://localhost:3000 にアクセスして動作確認！