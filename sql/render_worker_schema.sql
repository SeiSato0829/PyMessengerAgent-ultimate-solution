-- Render PostgreSQL Worker Database Schema
-- ワーカー専用データベーススキーマ

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create worker schema
CREATE SCHEMA IF NOT EXISTS worker;

-- Worker Tasks Table (Supabase同期用)
CREATE TABLE IF NOT EXISTS worker.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supabase_task_id UUID NOT NULL UNIQUE, -- Supabaseとの同期用ID
    worker_id VARCHAR(255),
    worker_name VARCHAR(255),
    task_type VARCHAR(50) DEFAULT 'facebook_message',
    recipient_name VARCHAR(255),
    message TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    priority INTEGER DEFAULT 1,
    
    -- タイムスタンプ
    scheduled_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- 結果・エラー
    result JSONB,
    error_log TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    
    -- メタデータ
    facebook_account_id UUID,
    execution_details JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_status CHECK (
        status IN ('pending', 'assigned', 'processing', 'completed', 'failed', 'cancelled', 'retrying')
    )
);

-- Execution Logs Table (詳細ログ)
CREATE TABLE IF NOT EXISTS worker.execution_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES worker.tasks(id) ON DELETE CASCADE,
    step_name VARCHAR(255) NOT NULL,
    step_order INTEGER NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'started',
    
    -- パフォーマンスメトリクス
    execution_time_ms INTEGER,
    memory_usage_mb DECIMAL(10, 2),
    
    -- 詳細情報
    input_data JSONB,
    output_data JSONB,
    error_details JSONB,
    
    -- スクリーンショットパス（デバッグ用）
    screenshot_path TEXT,
    
    logged_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_status CHECK (
        status IN ('started', 'completed', 'failed', 'skipped')
    )
);

-- Worker System Metrics Table (システム監視)
CREATE TABLE IF NOT EXISTS worker.system_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    worker_id VARCHAR(255) NOT NULL,
    hostname VARCHAR(255),
    
    -- システムメトリクス
    cpu_usage DECIMAL(5,2), -- パーセンテージ
    memory_usage DECIMAL(5,2), -- パーセンテージ  
    memory_total_mb INTEGER,
    memory_used_mb INTEGER,
    
    -- ワーカー状況
    active_tasks INTEGER DEFAULT 0,
    completed_tasks_today INTEGER DEFAULT 0,
    failed_tasks_today INTEGER DEFAULT 0,
    
    -- ブラウザ情報
    browser_count INTEGER DEFAULT 0,
    browser_memory_mb INTEGER DEFAULT 0,
    
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Worker Status Table (ワーカー状態管理)
CREATE TABLE IF NOT EXISTS worker.worker_status (
    worker_id VARCHAR(255) PRIMARY KEY,
    worker_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'offline',
    version VARCHAR(50),
    
    -- 接続情報
    ip_address INET,
    hostname VARCHAR(255),
    user_agent TEXT,
    
    -- 能力情報
    max_concurrent_tasks INTEGER DEFAULT 3,
    supported_platforms JSONB, -- ['facebook', 'instagram'] etc
    
    -- ステータス
    last_heartbeat TIMESTAMPTZ DEFAULT NOW(),
    last_task_completed TIMESTAMPTZ,
    total_tasks_completed INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_worker_status CHECK (
        status IN ('online', 'offline', 'busy', 'maintenance', 'error')
    )
);

-- Task Queue Management Table (キュー管理)
CREATE TABLE IF NOT EXISTS worker.task_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES worker.tasks(id) ON DELETE CASCADE,
    queue_name VARCHAR(100) DEFAULT 'default',
    priority INTEGER DEFAULT 1,
    
    -- スケジューリング
    available_at TIMESTAMPTZ DEFAULT NOW(),
    locked_at TIMESTAMPTZ,
    locked_by VARCHAR(255),
    
    -- 処理回数
    attempts INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance Tracking Table (パフォーマンス追跡)
CREATE TABLE IF NOT EXISTS worker.performance_stats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE DEFAULT CURRENT_DATE,
    worker_id VARCHAR(255),
    
    -- 処理統計
    tasks_completed INTEGER DEFAULT 0,
    tasks_failed INTEGER DEFAULT 0,
    total_execution_time_ms BIGINT DEFAULT 0,
    
    -- 成功率統計
    success_rate DECIMAL(5,2),
    avg_execution_time_ms INTEGER,
    
    -- Facebook特有メトリクス
    facebook_login_attempts INTEGER DEFAULT 0,
    facebook_login_successes INTEGER DEFAULT 0,
    facebook_blocks_detected INTEGER DEFAULT 0,
    facebook_captcha_encountered INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(date, worker_id)
);

-- Sync Status Table (Supabase同期状態)
CREATE TABLE IF NOT EXISTS worker.sync_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sync_type VARCHAR(100) NOT NULL, -- 'tasks_from_supabase', 'results_to_supabase'
    last_sync_at TIMESTAMPTZ,
    records_processed INTEGER DEFAULT 0,
    errors_count INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending',
    error_details JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT valid_sync_status CHECK (
        status IN ('pending', 'running', 'completed', 'failed')
    )
);

-- インデックス作成（パフォーマンス最適化）
CREATE INDEX IF NOT EXISTS idx_worker_tasks_status ON worker.tasks(status);
CREATE INDEX IF NOT EXISTS idx_worker_tasks_worker_id ON worker.tasks(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_tasks_supabase_id ON worker.tasks(supabase_task_id);
CREATE INDEX IF NOT EXISTS idx_worker_tasks_scheduled_at ON worker.tasks(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_worker_tasks_created_at ON worker.tasks(created_at);

CREATE INDEX IF NOT EXISTS idx_execution_logs_task_id ON worker.execution_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_execution_logs_logged_at ON worker.execution_logs(logged_at);

CREATE INDEX IF NOT EXISTS idx_system_metrics_worker_id ON worker.system_metrics(worker_id);
CREATE INDEX IF NOT EXISTS idx_system_metrics_recorded_at ON worker.system_metrics(recorded_at);

CREATE INDEX IF NOT EXISTS idx_task_queue_available_at ON worker.task_queue(available_at);
CREATE INDEX IF NOT EXISTS idx_task_queue_priority ON worker.task_queue(priority);
CREATE INDEX IF NOT EXISTS idx_task_queue_locked_at ON worker.task_queue(locked_at);

-- ビュー作成（よく使用するクエリ）
CREATE OR REPLACE VIEW worker.task_statistics AS
SELECT
    COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
    COUNT(*) FILTER (WHERE status = 'processing') as processing_count,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_count,
    COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) as today_count,
    ROUND(
        COUNT(*) FILTER (WHERE status = 'completed') * 100.0 / 
        NULLIF(COUNT(*) FILTER (WHERE status IN ('completed', 'failed')), 0), 2
    ) as success_rate
FROM worker.tasks
WHERE created_at > NOW() - INTERVAL '24 hours';

CREATE OR REPLACE VIEW worker.worker_performance AS
SELECT
    w.worker_id,
    w.worker_name,
    w.status as worker_status,
    w.last_heartbeat,
    COUNT(t.id) FILTER (WHERE t.status = 'completed' AND t.completed_at > NOW() - INTERVAL '24 hours') as tasks_completed_24h,
    COUNT(t.id) FILTER (WHERE t.status = 'failed' AND t.updated_at > NOW() - INTERVAL '24 hours') as tasks_failed_24h,
    ROUND(AVG(EXTRACT(EPOCH FROM (t.completed_at - t.started_at)) * 1000), 0) as avg_execution_time_ms
FROM worker.worker_status w
LEFT JOIN worker.tasks t ON t.worker_id = w.worker_id
GROUP BY w.worker_id, w.worker_name, w.status, w.last_heartbeat;

-- トリガー関数：updated_at自動更新
CREATE OR REPLACE FUNCTION worker.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- トリガー作成
CREATE TRIGGER update_worker_tasks_updated_at 
    BEFORE UPDATE ON worker.tasks 
    FOR EACH ROW EXECUTE FUNCTION worker.update_updated_at_column();

CREATE TRIGGER update_worker_status_updated_at 
    BEFORE UPDATE ON worker.worker_status 
    FOR EACH ROW EXECUTE FUNCTION worker.update_updated_at_column();

CREATE TRIGGER update_task_queue_updated_at 
    BEFORE UPDATE ON worker.task_queue 
    FOR EACH ROW EXECUTE FUNCTION worker.update_updated_at_column();

-- パーティショニング（大量データ対応）
-- execution_logsテーブルの月次パーティション例
CREATE TABLE worker.execution_logs_y2025m01 PARTITION OF worker.execution_logs
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

-- 権限設定
GRANT USAGE ON SCHEMA worker TO PUBLIC;
GRANT ALL ON ALL TABLES IN SCHEMA worker TO PUBLIC;
GRANT ALL ON ALL SEQUENCES IN SCHEMA worker TO PUBLIC;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA worker TO PUBLIC;

-- 初期データ挿入
INSERT INTO worker.sync_status (sync_type, status) VALUES
('tasks_from_supabase', 'pending'),
('results_to_supabase', 'pending')
ON CONFLICT DO NOTHING;

-- 成功メッセージ
SELECT 'Render Worker Database Schema Setup Complete! 🚀' as message,
       'Tables: ' || COUNT(*) || ' created' as details
FROM information_schema.tables 
WHERE table_schema = 'worker';