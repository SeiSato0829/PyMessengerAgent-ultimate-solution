-- Step 6: インデックスとパフォーマンス最適化

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_scheduled_at ON tasks(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_worker_heartbeat ON worker_connections(last_heartbeat);
CREATE INDEX IF NOT EXISTS idx_logs_task_id ON execution_logs(task_id);

-- リアルタイム設定
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE worker_connections;
ALTER PUBLICATION supabase_realtime ADD TABLE execution_logs;