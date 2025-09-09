-- Step 4: ワーカーと実行ログテーブル作成

-- ワーカー接続管理
CREATE TABLE IF NOT EXISTS worker_connections (
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
CREATE TABLE IF NOT EXISTS execution_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    worker_id UUID REFERENCES worker_connections(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    details JSONB,
    screenshot_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);