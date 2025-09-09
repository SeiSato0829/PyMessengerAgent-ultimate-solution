-- Supabase スキーマ定義（完全版）
-- 無料プランで全機能動作

-- ユーザー管理（Supabase Auth統合）
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
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, email)
);

-- タスク管理
CREATE TABLE tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    account_id UUID REFERENCES facebook_accounts(id) ON DELETE CASCADE,
    task_type TEXT NOT NULL, -- 'send_message', 'post_update', etc
    recipient_name TEXT,
    message TEXT,
    scheduled_at TIMESTAMPTZ,
    status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
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
    worker_type TEXT DEFAULT 'local', -- local, vps, ec2
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

-- Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE facebook_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE execution_logs ENABLE ROW LEVEL SECURITY;

-- ポリシー設定
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

-- インデックス
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_scheduled_at ON tasks(scheduled_at);
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_worker_heartbeat ON worker_connections(last_heartbeat);

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