-- Step 3: タスクテーブル作成
CREATE TABLE IF NOT EXISTS tasks (
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