# 🚀 Supabaseセットアップ完全ガイド

## Step 1: Supabaseアカウント作成

### 1. Supabaseにアクセス
https://supabase.com にアクセス

### 2. アカウント作成
- **「Start your project」**をクリック
- GitHubアカウントでサインイン推奨
- または、メールアドレスで新規登録

### 3. 新規プロジェクト作成
```yaml
プロジェクト設定:
  - Project name: pymessenger-dashboard
  - Database Password: 強力なパスワードを生成（メモ必須）
  - Region: Northeast Asia (Tokyo)
  - Pricing Plan: Free（無料プラン）
```

### 4. プロジェクト作成完了まで待つ
- 通常2-3分かかります
- 「Project has been created」と表示されたら完了

---

## Step 2: データベーススキーマの適用

### 1. SQL Editorを開く
- 左メニューから**「SQL Editor」**をクリック
- **「New query」**をクリック

### 2. スキーマSQLを実行
以下のSQLをコピー&ペーストして**「Run」**をクリック：

\`\`\`sql
-- プロファイル管理（Supabase Auth連携）
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Facebookアカウント管理
CREATE TABLE facebook_accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    account_name TEXT NOT NULL,
    email TEXT NOT NULL,
    encrypted_password TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    last_login TIMESTAMPTZ,
    cookies JSONB,
    daily_limit INT DEFAULT 50,
    hourly_limit INT DEFAULT 10,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, email)
);

-- タスク管理
CREATE TABLE tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    account_id UUID REFERENCES facebook_accounts(id) ON DELETE CASCADE,
    task_type TEXT NOT NULL DEFAULT 'send_message',
    recipient_name TEXT,
    message TEXT,
    scheduled_at TIMESTAMPTZ,
    status TEXT DEFAULT 'pending',
    retry_count INT DEFAULT 0,
    result JSONB,
    error_message TEXT,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ワーカー接続管理
CREATE TABLE worker_connections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    worker_name TEXT NOT NULL,
    worker_type TEXT DEFAULT 'local',
    ip_address INET,
    last_heartbeat TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'offline',
    capabilities JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 実行ログ
CREATE TABLE execution_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    worker_id UUID REFERENCES worker_connections(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    details JSONB,
    screenshot_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security (RLS) 有効化
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE facebook_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE execution_logs ENABLE ROW LEVEL SECURITY;

-- セキュリティポリシー
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can manage own facebook accounts" ON facebook_accounts
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can manage own tasks" ON tasks
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can view own workers" ON worker_connections
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can view own logs" ON execution_logs
    FOR SELECT USING (
        task_id IN (SELECT id FROM tasks WHERE user_id = auth.uid())
    );

-- インデックス作成（パフォーマンス向上）
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_scheduled_at ON tasks(scheduled_at);
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_worker_heartbeat ON worker_connections(last_heartbeat);
CREATE INDEX idx_logs_task_id ON execution_logs(task_id);

-- リアルタイム設定
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE worker_connections;
ALTER PUBLICATION supabase_realtime ADD TABLE execution_logs;

-- 統計ビュー
CREATE VIEW task_statistics AS
SELECT 
    user_id,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
    COUNT(*) FILTER (WHERE status = 'processing') as processing_count,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_count,
    COUNT(*) as total_count
FROM tasks
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY user_id;

-- プロファイル自動作成トリガー
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
\`\`\`

### 3. 実行確認
- **「Success. No rows returned」**と表示されれば成功
- エラーが出た場合は、SQLをもう一度確認

---

## Step 3: API Keys取得

### 1. Project Settingsを開く
- 左メニューから**「Settings」**をクリック
- **「API」**タブを選択

### 2. 必要な情報をコピー
以下の情報をメモ帳などにコピー：

\`\`\`
Project URL: https://xxxxxxxxx.supabase.co
anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxxxxxx
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxxxxxx
\`\`\`

**⚠️ 注意: service_role keyは秘密情報です。他人に共有しないでください**

---

## Step 4: 環境変数ファイルの作成

### ultimate-solutionディレクトリで実行：

\`\`\`bash
# .env.localファイルを作成
cp .env.local.example .env.local
\`\`\`

### .env.localファイルを編集：

\`\`\`env
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxxxxxx
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxxxxxx

# アプリケーション設定
NEXT_PUBLIC_APP_URL=http://localhost:3000

# 暗号化キー（自動生成されたものをそのまま使用）
ENCRYPTION_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
\`\`\`

---

## Step 5: 認証設定

### 1. Authenticationを開く
- 左メニューから**「Authentication」**をクリック
- **「Settings」**タブを選択

### 2. Email設定を確認
\`\`\`yaml
Email Auth: 有効（デフォルト）
Confirm email: 有効（開発時は無効でもOK）
Secure email change: 有効
\`\`\`

### 3. Site URL設定
\`\`\`
Site URL: http://localhost:3000
Additional redirect URLs: 
  - http://localhost:3000
  - https://your-app.vercel.app（本番環境用）
\`\`\`

---

## Step 6: 接続テスト

### 1. Next.jsアプリを起動
\`\`\`bash
cd ultimate-solution
npm run dev
\`\`\`

### 2. ブラウザでアクセス
http://localhost:3000/login にアクセス

### 3. テストアカウント作成
- メールアドレス: test@example.com
- パスワード: testpass123

### 4. 成功確認
- 「確認メールを送信しました」と表示されれば接続成功
- ダッシュボードにリダイレクトされればOK

---

## ✅ チェックリスト

- [ ] Supabaseプロジェクト作成完了
- [ ] データベーススキーマ適用完了
- [ ] API Keys取得完了
- [ ] .env.localファイル作成完了
- [ ] 認証設定完了
- [ ] Next.jsアプリ起動成功
- [ ] ログインページアクセス成功
- [ ] テストアカウント作成成功

---

## 🚨 トラブルシューティング

### よくあるエラーと対処法

#### 1. "Project URL not found" エラー
- .env.localファイルのURLが正しいか確認
- https:// が含まれているか確認

#### 2. "Invalid API Key" エラー  
- anon keyが正しくコピーされているか確認
- 先頭・末尾にスペースがないか確認

#### 3. SQL実行エラー
- 全てのSQLを一度にコピー&ペーストしているか確認
- SQL Editorで1つずつ実行してみる

#### 4. 認証エラー
- Authenticationの設定でSite URLが正しいか確認
- メールアドレスの形式が正しいか確認

---

**すべての設定が完了したら、次の実装ステップに進みます！**