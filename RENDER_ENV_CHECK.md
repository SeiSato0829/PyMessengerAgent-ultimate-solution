# 🚨 緊急確認事項 - Render.com環境変数

## 問題
「アプリIDが無効」エラーが表示される = **環境変数が実際に設定されている**

## 原因
Render.comで以下のような値が設定されている可能性：
- `FACEBOOK_APP_ID` = 何らかの値（無効な値）
- `FACEBOOK_APP_SECRET` = 何らかの値

## 確認方法

### 1. デバッグエンドポイントで確認
```
https://pymessengeragent-ultimate-solution.onrender.com/api/auth/facebook/debug
```

### 2. Render.comダッシュボードで確認
1. https://dashboard.render.com にログイン
2. サービスを選択
3. **Environment** タブを開く
4. 設定されている環境変数を確認

## 対処法

### A. 環境変数を削除（デモモードにする）
Render.comで以下の環境変数を**削除**：
- `FACEBOOK_APP_ID`
- `FACEBOOK_APP_SECRET`

### B. 正しい値を設定（本番モード）
1. [Facebook Developers](https://developers.facebook.com)でアプリ作成
2. 正しいApp IDとSecretを取得
3. Render.comで設定

### C. 強制デモモード（一時対応）
Render.comで以下を追加：
```
FORCE_DEMO_MODE=true
```

## 現在の状況
- コードは正しく修正済み
- デモモード判定も実装済み
- **問題は環境変数の設定値**

## 次のアクション
1. Render.comの環境変数を確認
2. 不要な環境変数を削除
3. または`FORCE_DEMO_MODE=true`を設定