# 🚀 アプリケーション起動ガイド

## 📝 起動手順

### 1. PowerShellまたはコマンドプロンプトを開く

### 2. プロジェクトディレクトリに移動
```bash
cd C:\Users\music-020\Desktop\PyMessengerAgent\ultimate-solution
```

### 3. 依存関係をインストール（初回のみ）
```bash
npm install
```

このコマンドで以下がインストールされます：
- Next.js
- React
- Supabase
- その他の依存関係

⚠️ **エラーが出た場合**：
- `npm cache clean --force` を実行してから再試行
- Node.jsが古い場合は最新版をインストール

### 4. 開発サーバーを起動
```bash
npm run dev
```

### 5. ブラウザでアクセス
```
http://localhost:3000
```

## 📊 期待される出力

```
> pymessenger-dashboard@2.0.0 dev
> next dev

   ▲ Next.js 14.0.4
   - Local:        http://localhost:3000
   - Environments: .env.local

 ✓ Ready in 2s
```

## 🔍 動作確認URL

- テストページ: http://localhost:3000/test
- ログインページ: http://localhost:3000/login
- メインページ: http://localhost:3000

## ⚠️ トラブルシューティング

### ポート3000が使用中の場合
```bash
# 別のポートで起動
npm run dev -- -p 3001
```

### 依存関係のエラー
```bash
# node_modulesを削除してやり直し
rmdir /s /q node_modules
npm install
```

### キャッシュの問題
```bash
# Next.jsのキャッシュをクリア
rmdir /s /q .next
npm run dev
```

## 📱 正常に起動した場合の確認方法

1. http://localhost:3000/test にアクセス
2. 「テストページ」と「Next.jsアプリケーションが動作しています！」が表示される
3. コンソールにエラーが出ていない

## 🛑 停止方法

ターミナルで `Ctrl + C` を押す

---

**問題が解決しない場合は、エラーメッセージを教えてください！**