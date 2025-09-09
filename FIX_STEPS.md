# 🔧 Next.js起動エラーの修正手順

## エラーの原因
Next.jsモジュールが正しくインストールされていません。

## 修正手順

### 1. node_modulesとpackage-lock.jsonを削除
PowerShellで以下を実行：

```powershell
# 現在のディレクトリを確認
cd C:\Users\music-020\Desktop\PyMessengerAgent\ultimate-solution

# node_modulesフォルダを削除
Remove-Item -Recurse -Force node_modules

# package-lock.jsonを削除（存在する場合）
Remove-Item -Force package-lock.json
```

### 2. npmキャッシュをクリア
```powershell
npm cache clean --force
```

### 3. Next.jsを再インストール
```powershell
npm install next@14.0.4 react@18.2.0 react-dom@18.2.0
```

### 4. その他の依存関係をインストール
```powershell
npm install
```

### 5. 開発サーバーを起動
```powershell
npm run dev
```

## それでもエラーが出る場合

### Option A: npxを使って直接起動
```powershell
npx next dev
```

### Option B: 新しいNext.jsプロジェクトを作成
```powershell
# 一つ上のディレクトリに移動
cd ..

# 新しいNext.jsプロジェクトを作成
npx create-next-app@latest pymessenger-v2 --typescript --tailwind --app --no-src-dir

# プロジェクトに移動
cd pymessenger-v2

# 開発サーバー起動
npm run dev
```

## 確認方法
ブラウザで http://localhost:3000 にアクセスして、Next.jsのデフォルトページが表示されれば成功です。