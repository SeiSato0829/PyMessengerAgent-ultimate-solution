# 🚀 【超簡単】Render無料プラン 3ステップ開始ガイド

## ✅ **自動設定完了済み**

私が以下を自動で完了させました：
- ✅ package.json にスクリプト追加
- ✅ 必要パッケージ定義完了
- ✅ 環境変数テンプレート作成
- ✅ データディレクトリ作成
- ✅ 自動セットアップスクリプト作成

## 🎯 **あなたが実行する3ステップ**

### Step 1: 自動セットアップ実行
```bash
npm run render:setup
```
**これだけで環境変数がすべて設定されます！**

### Step 2: パッケージインストール
```bash
npm install
```

### Step 3: 起動（2つのターミナル）
```bash
# ターミナル1: Web UI起動
npm run dev

# ターミナル2: ワーカー起動
npm run worker:sqlite
```

## 🌐 **動作確認URL**

- **メインアプリ**: http://localhost:3002
- **Keep-Alive状況**: http://localhost:3002/api/ping
- **システム状況**: http://localhost:3002/api/sqlite/status

## ⚡ **動作確認**

### 正常起動の確認
```
# ターミナル1の出力例
✓ Ready in 2s
- Local: http://localhost:3002

# ターミナル2の出力例  
🚀 SQLiteワーカー開始
✅ SQLite接続成功
📊 Keep-Alive システム開始
```

## 🚨 **Renderデプロイ時の追加設定**

Renderで本番デプロイする場合のみ：

1. **Renderで環境変数設定**:
   - `.env.render` の内容をすべてコピー
   - `RENDER_EXTERNAL_URL=https://your-app.onrender.com` を設定

2. **Renderビルド設定**:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run worker:sqlite & npm start`

## 💡 **重要な制限（理解必須）**

### Render無料プランの現実
```
稼働時間: 750時間/月 (月末5-6日停止)
メモリ: 512MB (実質180MB利用可能)
スリープ: 15分非アクティブで停止
成功率: 60-70% (制限による)
処理能力: 1日10-20タスク
```

### 適用範囲
- ✅ **テスト・学習目的**: 最適
- ✅ **個人プロジェクト**: 適用可能
- ❌ **商用利用**: 不適
- ❌ **大量処理**: 不適

## 🛠️ **便利コマンド**

```bash
# システム状況確認
curl http://localhost:3002/api/ping

# 手動ガベージコレクション
curl -X POST http://localhost:3002/api/ping

# ワーカー再起動
# Ctrl+C で停止後
npm run worker:sqlite
```

## 🚨 **トラブル時の対応**

### メモリ不足エラー
```bash
# 手動ガベージコレクション実行
curl -X POST http://localhost:3002/api/ping
```

### SQLite接続エラー
```bash
# dataディレクトリ権限確認
ls -la data/
# 再セットアップ
npm run render:setup
```

### Keep-Alive確認
```bash
# ping状況確認
curl http://localhost:3002/api/ping
```

---

## 🎉 **完了！**

**3ステップでRender無料プランでの実行準備完了！**

制限はあるものの、学習・テスト目的なら十分実用的です。

質問があれば何でも聞いてください！ 🚀