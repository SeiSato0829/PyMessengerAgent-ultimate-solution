-- Step 5: Row Level Security (RLS) 設定

-- RLS有効化
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE facebook_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE worker_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE execution_logs ENABLE ROW LEVEL SECURITY;

-- プロファイルのポリシー
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Facebookアカウントのポリシー
CREATE POLICY "Users can manage own facebook accounts" ON facebook_accounts
    FOR ALL USING (user_id = auth.uid());

-- タスクのポリシー
CREATE POLICY "Users can manage own tasks" ON tasks
    FOR ALL USING (user_id = auth.uid());

-- ワーカーのポリシー
CREATE POLICY "Users can view own workers" ON worker_connections
    FOR ALL USING (user_id = auth.uid());

-- ログのポリシー
CREATE POLICY "Users can view own logs" ON execution_logs
    FOR SELECT USING (
        task_id IN (SELECT id FROM tasks WHERE user_id = auth.uid())
    );