# 🚀 PyMessenger Agent 完全デプロイメントガイド

## 🎯 システム概要

半自動Facebook Messenger Agent（1日50件、完全履歴管理）の最適解実装です。

### アーキテクチャ
- **Webダッシュボード**: Next.js 14 + Supabase + TypeScript
- **ローカルワーカー**: Python + Playwright + Facebook自動化
- **データベース**: Supabase PostgreSQL + RLS
- **リアルタイム更新**: Supabase Subscriptions

## 📋 事前準備

### 必要な環境
- Node.js 18.0.0以上
- Python 3.8以上
- Supabaseアカウント
- Facebookアカウント

## 🏗️ Step 1: Supabaseセットアップ

### 1.1 プロジェクト作成
1. [Supabase](https://supabase.com)にログイン
2. 新しいプロジェクトを作成
3. データベースパスワードを設定

### 1.2 データベーススキーマセットアップ
SQLエディタで以下のファイルを順番に実行：

```bash
supabase/step1_profiles.sql
supabase/step2_facebook_accounts.sql
supabase/step3_tasks.sql
supabase/step4_worker_connections.sql
supabase/step5_execution_logs.sql
supabase/step6_rls_policies.sql
supabase/step7_views_triggers.sql
```

### 1.3 APIキー取得
- Project URL: `https://xxx.supabase.co`
- Anon Key: Public API Key
- Service Role Key: Service Role Key

## 🌐 Step 2: Webダッシュボードセットアップ

### 2.1 環境変数設定
`.env.local`ファイルを作成：

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-role-key
ENCRYPTION_KEY=your-32-character-encryption-key
```

### 2.2 依存関係インストールと起動

```bash
# プロジェクトディレクトリに移動
cd ultimate-solution

# 依存関係インストール
npm install

# 開発サーバー起動
npm run dev
```

### 2.3 動作確認
1. http://localhost:3001 にアクセス
2. 新規アカウント作成でサインアップ
3. ダッシュボードが表示されることを確認

## 🤖 Step 3: ローカルワーカーセットアップ

### 3.1 ワーカーディレクトリ移動
```bash
cd worker
```

### 3.2 環境設定
```bash
# 環境変数ファイル作成
cp .env.example .env

# .envファイルを編集
nano .env
```

### 3.3 環境変数設定
```env
# Supabase設定（Webダッシュボードと同じ）
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

### 3.4 ワーカーセットアップ
```bash
# セットアップスクリプト実行
python setup.py

# または手動セットアップ
pip install -r requirements.txt
playwright install chromium
```

### 3.5 ワーカー起動
```bash
python main.py
```

## 🧪 Step 4: 統合テスト

### 4.1 システム状態確認
1. **Webダッシュボード**: ワーカー状態が「オンライン」表示
2. **ワーカーログ**: 「ワーカー登録完了」メッセージ
3. **Supabase**: `worker_connections`テーブルにレコード作成

### 4.2 Facebook連携テスト

#### Facebookアカウント登録
1. ダッシュボードの「アカウント管理」
2. 「新しいアカウントを追加」
3. Facebookメール・パスワード入力
4. 保存後、暗号化されて保存確認

#### テストメッセージ送信
1. 「新規タスク作成」セクション
2. 以下を入力：
   - アカウント: 登録したFacebookアカウント
   - 送信先: テスト用の友達の名前
   - メッセージ: "テストメッセージ"
3. 「タスク作成」クリック

### 4.3 自動化フロー確認
1. **タスク作成**: ステータス「pending」
2. **ワーカー処理**: 
   - ステータス「processing」に変更
   - ワーカーログでFacebookログイン
   - メッセージ送信実行
3. **完了**: 
   - ステータス「completed」
   - 実行ログ記録
   - リアルタイム通知表示

## 📊 Step 5: 運用開始

### 5.1 日次制限設定
1日50件の制限を守るため：

```sql
-- 日次制限チェック関数をSupabaseに追加
CREATE OR REPLACE FUNCTION check_daily_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (
    SELECT COUNT(*) 
    FROM tasks 
    WHERE user_id = NEW.user_id 
    AND DATE(created_at) = CURRENT_DATE
    AND status != 'cancelled'
  ) >= 50 THEN
    RAISE EXCEPTION '1日の送信制限（50件）に達しています';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガー設定
CREATE TRIGGER daily_limit_check
  BEFORE INSERT ON tasks
  FOR EACH ROW EXECUTE FUNCTION check_daily_limit();
```

### 5.2 監視設定
- ワーカーハートビート監視
- エラー率監視
- 日次送信数監視

### 5.3 バックアップ設定
- Supabaseの自動バックアップ確認
- ローカルログのローテーション設定

## 🔒 セキュリティ設定

### 5.1 RLS (Row Level Security) 確認
- 全テーブルでRLS有効
- ユーザー認証済みのみアクセス可能
- 個人データの分離保証

### 5.2 パスワード暗号化確認
- Facebookパスワードは暗号化保存
- ローカルワーカーでのみ復号化
- 暗号化キーの安全な管理

## 🚨 トラブルシューティング

### よくある問題

#### 1. Next.js起動エラー
```bash
# node_modulesクリア
rm -rf node_modules package-lock.json
npm install
```

#### 2. ワーカー接続エラー
- Supabase URLとキーの確認
- ネットワーク接続確認
- 環境変数の再確認

#### 3. Facebook自動化エラー
- 2FA無効化または手動認証
- ブラウザヘッドレスモード無効化でデバッグ
- Facebookパスワード変更の確認

#### 4. データベースエラー
- RLSポリシーの確認
- テーブル権限の確認
- SQLログの確認

## 📈 スケーリング

### 複数ワーカー運用
```bash
# ワーカー1
WORKER_NAME=worker-1 python main.py

# ワーカー2  
WORKER_NAME=worker-2 python main.py
```

### 複数Facebookアカウント
- 各ワーカーに異なるFacebookアカウント設定
- ロードバランシング実装
- アカウント健康状態監視

## ✅ 完了チェックリスト

- [ ] Supabaseプロジェクト作成・設定完了
- [ ] データベーススキーマセットアップ完了
- [ ] Next.js Webダッシュボード起動成功
- [ ] ローカルワーカーセットアップ完了
- [ ] ワーカーがダッシュボードでオンライン表示
- [ ] Facebookアカウント登録成功
- [ ] テストメッセージ送信成功
- [ ] リアルタイム更新動作確認
- [ ] エラーハンドリング動作確認
- [ ] 日次制限設定完了
- [ ] セキュリティ設定確認完了

## 🎉 運用開始

全ての設定が完了したら、本格運用を開始できます：

1. **タスク作成**: Webダッシュボードから毎日最大50件
2. **自動実行**: ワーカーが5秒間隔で新タスクをチェック
3. **リアルタイム監視**: ダッシュボードで進行状況を確認
4. **履歴管理**: 全ての送信記録が完全保存

**🚀 PyMessenger Agent の準備完了です！**