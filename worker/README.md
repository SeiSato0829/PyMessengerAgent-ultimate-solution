# 🤖 PyMessenger Local Worker

Facebook Messenger自動化ローカルワーカー

## 📋 概要

このワーカーは、Webダッシュボードから作成されたタスクを受信し、Facebook Messengerを自動操作してメッセージを送信します。

## 🚀 セットアップ

### 1. 依存関係インストール

```bash
# セットアップスクリプト実行
python setup.py

# または手動インストール
pip install -r requirements.txt
playwright install chromium
```

### 2. 環境変数設定

`.env.example`をコピーして`.env`ファイルを作成：

```bash
cp .env.example .env
```

`.env`ファイルを編集：

```env
# Supabase設定
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-service-role-key

# ワーカー設定
WORKER_NAME=local-worker-1
WORKER_TYPE=facebook_automation
ENCRYPTION_KEY=your-32-character-encryption-key

# Facebook設定
FACEBOOK_EMAIL=your-facebook-email@example.com
FACEBOOK_PASSWORD=your-facebook-password

# ブラウザ設定
HEADLESS=true
BROWSER_TIMEOUT=30000
RETRY_COUNT=3
```

### 3. ワーカー起動

```bash
python main.py
```

## 📊 機能

### ✅ 実装済み機能

- ✅ Supabaseデータベース接続
- ✅ ワーカー登録・ハートビート送信
- ✅ タスクの自動監視・処理
- ✅ Facebook自動ログイン
- ✅ Messenger自動メッセージ送信
- ✅ エラーハンドリングとリトライ
- ✅ 実行ログ記録
- ✅ システム情報監視

### 🔄 処理フロー

1. **ワーカー起動**: システム情報を収集してSupabaseに登録
2. **ハートビート**: 30秒間隔でサーバーに生存報告
3. **タスク監視**: 5秒間隔で新しいタスクをチェック
4. **タスク処理**:
   - タスクを`processing`状態に更新
   - Facebook自動ログイン（未ログインの場合）
   - メッセージ送信実行
   - 結果をデータベースに記録

## 🛠️ 設定オプション

| 環境変数 | 説明 | デフォルト値 |
|---------|------|-------------|
| `HEADLESS` | ブラウザをヘッドレスモードで実行 | `true` |
| `BROWSER_TIMEOUT` | ブラウザ操作タイムアウト(ms) | `30000` |
| `RETRY_COUNT` | 失敗時のリトライ回数 | `3` |
| `WORKER_NAME` | ワーカー識別名 | `worker-{hostname}` |

## 📝 ログ

ワーカーの動作ログは以下に出力されます：

- **コンソール出力**: リアルタイムログ
- **worker.log**: ファイルログ
- **スクリーンショット**: `screenshots/`ディレクトリ

## 🔒 セキュリティ

- パスワードは暗号化されてデータベースに保存
- ローカル環境でのみ復号化
- ブラウザセッションは自動クリーンアップ

## 🚨 トラブルシューティング

### よくある問題

1. **ブラウザが起動しない**
   ```bash
   # Chromiumを再インストール
   playwright install chromium
   ```

2. **Facebookログインに失敗する**
   - 2FA設定を確認
   - パスワードに特殊文字が含まれる場合はエスケープ
   - ヘッドレスモードを無効にして確認

3. **メッセージが送信されない**
   - Facebookインターフェースの変更の可能性
   - スクリーンショットでUIを確認

### デバッグモード

ヘッドレスモードを無効にしてデバッグ：

```env
HEADLESS=false
```

## 📈 監視

ワーカーの状態はWebダッシュボードで監視できます：

- ✅ オンライン/オフライン状態
- 📊 システムリソース使用率
- 📋 現在処理中のタスク
- 📈 処理統計

## 🔄 自動復旧

ワーカーは以下の場合に自動復旧を試行します：

- ネットワーク接続エラー
- ブラウザクラッシュ
- Facebook セッション期限切れ

## ⚙️ 高度な設定

### 複数ワーカー運用

```bash
# ワーカー1
WORKER_NAME=worker-1 python main.py

# ワーカー2
WORKER_NAME=worker-2 python main.py
```

### プロキシ使用

```python
# facebook_automation.py のブラウザ起動部分を編集
self.browser = await self.playwright.chromium.launch(
    headless=self.headless,
    proxy={
        'server': 'http://proxy-server:port',
        'username': 'proxy-user',
        'password': 'proxy-pass'
    }
)
```

## 📞 サポート

問題が発生した場合：

1. ログファイルを確認
2. エラーメッセージをコピー
3. 環境変数設定を確認
4. GitHubのIssueに報告