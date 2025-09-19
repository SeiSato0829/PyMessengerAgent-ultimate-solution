# Vercel無料デプロイガイド

## 📋 前提条件
- GitHubアカウント
- リポジトリ: https://github.com/SeiSato0829/PyMessengerAgent-ultimate-solution

## 🚀 デプロイ手順

### 1. Vercelアカウント作成
1. https://vercel.com にアクセス
2. "Sign Up" をクリック
3. "Continue with GitHub" を選択
4. GitHubアカウントでログイン

### 2. プロジェクトインポート
1. Vercelダッシュボードで "Add New..." → "Project"
2. GitHubリポジトリ一覧から `PyMessengerAgent-ultimate-solution` を選択
3. "Import" をクリック

### 3. 環境変数設定
以下の環境変数を設定：

```env
FACEBOOK_APP_ID=1074848747815619
FACEBOOK_APP_SECRET=ae554f1df345416e5d6d08c22d07685d
NEXT_PUBLIC_SUPABASE_URL=https://rxipbozxhkzvlekrbjud.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4aXBib3p4aGt6dmxla3JianVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU2MDg0NzgsImV4cCI6MjA0MTE4NDQ3OH0.vTWRLqpPjUGTH2U0TBRZLM5N3r86O9E6Eq5INIoL7jY
```

### 4. デプロイ設定
- **Framework Preset**: Next.js（自動検出）
- **Build Command**: `yarn build`（デフォルト）
- **Output Directory**: `.next`（デフォルト）
- **Install Command**: `yarn install`（デフォルト）

### 5. デプロイ実行
1. "Deploy" ボタンをクリック
2. 約2-3分でデプロイ完了
3. `https://[プロジェクト名].vercel.app` でアクセス可能

## ✅ デプロイ後の確認

### アクセスURL例
```
https://pymessenger-agent.vercel.app
または
https://pymessenger-agent-[ユーザー名].vercel.app
```

## 🔧 カスタムドメイン設定（オプション）

1. Vercelダッシュボードで "Settings" → "Domains"
2. カスタムドメインを追加
3. DNSレコードを設定

## 📊 Vercel無料プランの特徴

### ✅ メリット
- **ビルド時間制限なし**
- **100GBの帯域幅/月**
- **自動HTTPS**
- **自動デプロイ**（GitHubプッシュ時）
- **プレビューデプロイ**
- **高速なグローバルCDN**

### ⚠️ 制限事項
- 商用利用は制限あり
- Function実行時間: 10秒
- デプロイ: 100回/日

## 🆘 トラブルシューティング

### ビルドエラーの場合
```bash
# package.jsonを確認
{
  "scripts": {
    "build": "next build"
  }
}
```

### 環境変数エラーの場合
- Vercelダッシュボード → Settings → Environment Variables
- すべての環境変数が正しく設定されているか確認

## 📞 サポート
- Vercelドキュメント: https://vercel.com/docs
- Next.jsドキュメント: https://nextjs.org/docs

---

**推定デプロイ時間: 3分**
**コスト: 完全無料**