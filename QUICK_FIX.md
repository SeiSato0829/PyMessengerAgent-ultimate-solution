# ⚡ クイック修正手順

## 現在の状況
node_modulesは既に削除済みです。

## 次の手順

### 1. package-lock.json を削除（存在する場合）
```powershell
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
```

### 2. キャッシュをクリア
```powershell
npm cache clean --force
```

### 3. Next.jsを直接インストール
```powershell
npm install next@14.0.4 react@18.2.0 react-dom@18.2.0 typescript @types/react @types/node
```

### 4. その他の依存関係をインストール
```powershell
npm install
```

### 5. 起動テスト
```powershell
npm run dev
```

## もし手順3でエラーが出た場合

新しいプロジェクトを作成する方が早いです：

```powershell
# 親ディレクトリに移動
cd ..

# 新しいNext.jsプロジェクト作成
npx create-next-app@latest pymessenger-clean --typescript --tailwind --app

# 新プロジェクトに移動
cd pymessenger-clean

# 起動
npm run dev
```

## 期待する結果
```
▲ Next.js 14.0.4
- Local:        http://localhost:3000
✓ Ready in 2s
```

ブラウザで http://localhost:3000 にアクセスしてNext.jsのページが表示されれば成功です。