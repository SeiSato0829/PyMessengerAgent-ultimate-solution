-- ========================================
-- PyMessenger Agent 完全版テーブル定義
-- 1日50件のメッセージ送信と完全な履歴管理
-- ========================================

-- 1. Facebookアカウント管理
CREATE TABLE facebook_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  account_name VARCHAR(255) NOT NULL,
  facebook_user_id VARCHAR(100),
  page_id VARCHAR(100),
  page_name VARCHAR(255),
  access_token TEXT, -- 暗号化して保存
  refresh_token TEXT, -- 暗号化して保存
  token_expires_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'active', -- active, suspended, expired
  daily_limit INTEGER DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. メッセージ履歴（完全ログ）
CREATE TABLE message_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID REFERENCES facebook_accounts(id) ON DELETE CASCADE,
  recipient_id VARCHAR(255) NOT NULL,
  recipient_name VARCHAR(255),
  message_content TEXT NOT NULL,
  message_type VARCHAR(50) DEFAULT 'text', -- text, image, link
  facebook_message_id VARCHAR(255),
  status VARCHAR(50) NOT NULL, -- pending, sent, delivered, read, failed
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  retry_count INTEGER DEFAULT 0,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. メッセージタスクキュー
CREATE TABLE message_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID REFERENCES facebook_accounts(id) ON DELETE CASCADE,
  recipient_id VARCHAR(255) NOT NULL,
  message_content TEXT NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  priority INTEGER DEFAULT 5, -- 1-10 (1が最高優先度)
  status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed, cancelled
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  error_log TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 日次統計
CREATE TABLE daily_statistics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID REFERENCES facebook_accounts(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  read_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  response_count INTEGER DEFAULT 0, -- 返信数
  success_rate DECIMAL(5,2),
  avg_delivery_time INTEGER, -- 秒単位
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(account_id, date)
);

-- 5. リアルタイム統計（ダッシュボード用）
CREATE TABLE realtime_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  total_messages_today INTEGER DEFAULT 0,
  total_messages_week INTEGER DEFAULT 0,
  total_messages_month INTEGER DEFAULT 0,
  active_accounts INTEGER DEFAULT 0,
  pending_tasks INTEGER DEFAULT 0,
  processing_tasks INTEGER DEFAULT 0,
  success_rate_today DECIMAL(5,2),
  last_message_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 受信者リスト（連絡先管理）
CREATE TABLE recipients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  facebook_id VARCHAR(255) UNIQUE,
  name VARCHAR(255),
  profile_url VARCHAR(500),
  tags TEXT[], -- タグでグループ化
  last_contacted_at TIMESTAMP WITH TIME ZONE,
  total_messages_sent INTEGER DEFAULT 0,
  notes TEXT,
  status VARCHAR(50) DEFAULT 'active', -- active, blocked, unsubscribed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. メッセージテンプレート
CREATE TABLE message_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  variables TEXT[], -- {name}, {date}などの変数
  category VARCHAR(100),
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. 自動送信ルール
CREATE TABLE automation_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES facebook_accounts(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  trigger_type VARCHAR(50), -- time_based, event_based, manual
  schedule_cron VARCHAR(100), -- cron式
  recipient_filter JSONB, -- 受信者フィルター条件
  template_id UUID REFERENCES message_templates(id),
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMP WITH TIME ZONE,
  next_run_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. ワーカーステータス
CREATE TABLE worker_status (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id VARCHAR(100) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'idle', -- idle, processing, error, offline
  current_task_id UUID REFERENCES message_tasks(id),
  last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  memory_usage INTEGER, -- MB単位
  cpu_usage DECIMAL(5,2), -- パーセント
  tasks_processed_today INTEGER DEFAULT 0,
  error_count_today INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. システムログ
CREATE TABLE system_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  level VARCHAR(20) NOT NULL, -- debug, info, warning, error, critical
  category VARCHAR(100),
  message TEXT NOT NULL,
  details JSONB,
  user_id UUID REFERENCES auth.users(id),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- インデックス作成
-- ========================================

-- メッセージ履歴の検索最適化
CREATE INDEX idx_message_history_account_id ON message_history(account_id);
CREATE INDEX idx_message_history_status ON message_history(status);
CREATE INDEX idx_message_history_sent_at ON message_history(sent_at DESC);
CREATE INDEX idx_message_history_recipient ON message_history(recipient_id);

-- タスクキューの処理最適化
CREATE INDEX idx_message_tasks_status ON message_tasks(status);
CREATE INDEX idx_message_tasks_scheduled ON message_tasks(scheduled_at);
CREATE INDEX idx_message_tasks_priority ON message_tasks(priority);

-- 統計検索の最適化
CREATE INDEX idx_daily_statistics_date ON daily_statistics(date DESC);
CREATE INDEX idx_daily_statistics_account ON daily_statistics(account_id, date DESC);

-- ワーカー管理の最適化
CREATE INDEX idx_worker_status_heartbeat ON worker_status(last_heartbeat DESC);

-- ========================================
-- トリガー関数
-- ========================================

-- 更新時刻自動更新
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 各テーブルに更新トリガーを適用
CREATE TRIGGER update_facebook_accounts_updated_at BEFORE UPDATE ON facebook_accounts
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_message_tasks_updated_at BEFORE UPDATE ON message_tasks
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_recipients_updated_at BEFORE UPDATE ON recipients
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ========================================
-- Row Level Security (RLS)
-- ========================================

-- RLSを有効化
ALTER TABLE facebook_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のデータのみアクセス可能
CREATE POLICY "Users can view own accounts" ON facebook_accounts
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own messages" ON message_history
  FOR ALL USING (account_id IN (
    SELECT id FROM facebook_accounts WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can manage own tasks" ON message_tasks
  FOR ALL USING (account_id IN (
    SELECT id FROM facebook_accounts WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can manage own recipients" ON recipients
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own templates" ON message_templates
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own rules" ON automation_rules
  FOR ALL USING (auth.uid() = user_id);

-- ========================================
-- ビュー作成（統計用）
-- ========================================

-- 今日の統計サマリー
CREATE VIEW today_stats AS
SELECT
  COUNT(DISTINCT account_id) as active_accounts,
  COUNT(*) as total_messages,
  SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END) as sent_count,
  SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered_count,
  SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_count,
  ROUND(AVG(CASE WHEN status = 'sent' THEN 100.0 ELSE 0 END), 2) as success_rate
FROM message_history
WHERE DATE(sent_at) = CURRENT_DATE;

-- アカウント別パフォーマンス
CREATE VIEW account_performance AS
SELECT
  fa.id,
  fa.account_name,
  COUNT(mh.id) as total_messages,
  SUM(CASE WHEN mh.status = 'sent' THEN 1 ELSE 0 END) as sent_count,
  SUM(CASE WHEN mh.status = 'failed' THEN 1 ELSE 0 END) as failed_count,
  ROUND(AVG(CASE WHEN mh.status = 'sent' THEN 100.0 ELSE 0 END), 2) as success_rate
FROM facebook_accounts fa
LEFT JOIN message_history mh ON fa.id = mh.account_id
WHERE DATE(mh.sent_at) = CURRENT_DATE
GROUP BY fa.id, fa.account_name;

-- ========================================
-- 初期データ挿入
-- ========================================

-- リアルタイム統計の初期レコード
INSERT INTO realtime_stats (id) VALUES (gen_random_uuid());

-- ========================================
-- 完了メッセージ
-- ========================================
-- すべてのテーブル作成が完了しました。
-- Supabase SQLエディタで実行してください。