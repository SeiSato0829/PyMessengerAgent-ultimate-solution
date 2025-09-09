-- PyMessenger Agent Database Backup Script
-- Render PostgreSQL 用のデータベース移行スクリプト

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create auth schema (Supabase compatible)
CREATE SCHEMA IF NOT EXISTS auth;

-- Create auth.users table (simplified version)
CREATE TABLE IF NOT EXISTS auth.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  encrypted_password VARCHAR(255),
  email_confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  raw_user_meta_data JSONB
);

-- Create public schema tables
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.facebook_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  account_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  encrypted_password TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, email)
);

CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES facebook_accounts(id) ON DELETE CASCADE,
  task_type VARCHAR(50) NOT NULL DEFAULT 'send_message',
  recipient_name VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  result JSONB,
  worker_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled'))
);

CREATE TABLE IF NOT EXISTS public.worker_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  worker_name VARCHAR(255) NOT NULL,
  worker_type VARCHAR(100) NOT NULL DEFAULT 'facebook_automation',
  status VARCHAR(50) DEFAULT 'offline',
  ip_address INET,
  hostname VARCHAR(255),
  system_info JSONB,
  system_stats JSONB,
  current_task_id UUID,
  last_heartbeat TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(worker_name),
  CHECK (status IN ('online', 'offline', 'busy'))
);

CREATE TABLE IF NOT EXISTS public.execution_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  worker_id UUID REFERENCES worker_connections(id) ON DELETE SET NULL,
  status VARCHAR(50) NOT NULL,
  error_message TEXT,
  execution_details JSONB,
  executed_at TIMESTAMPTZ DEFAULT NOW(),
  
  CHECK (status IN ('started', 'completed', 'failed'))
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON public.tasks(created_at);
CREATE INDEX IF NOT EXISTS idx_facebook_accounts_user_id ON public.facebook_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_worker_connections_status ON public.worker_connections(status);
CREATE INDEX IF NOT EXISTS idx_execution_logs_task_id ON public.execution_logs(task_id);

-- Create view for task statistics
CREATE OR REPLACE VIEW public.task_statistics AS
SELECT
  COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
  COUNT(*) FILTER (WHERE status = 'processing') as processing_count,  
  COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_count,
  COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) as today_count
FROM public.tasks;

-- Create function for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for auto-updating updated_at
CREATE TRIGGER update_profiles_updated_at 
  BEFORE UPDATE ON public.profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_facebook_accounts_updated_at 
  BEFORE UPDATE ON public.facebook_accounts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at 
  BEFORE UPDATE ON public.tasks 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create daily limit check function
CREATE OR REPLACE FUNCTION check_daily_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (
    SELECT COUNT(*) 
    FROM public.tasks 
    WHERE user_id = NEW.user_id 
    AND DATE(created_at) = CURRENT_DATE
    AND status != 'cancelled'
  ) >= 50 THEN
    RAISE EXCEPTION '1日の送信制限（50件）に達しています';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for daily limit
CREATE TRIGGER daily_limit_check
  BEFORE INSERT ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION check_daily_limit();

-- Insert sample data for testing
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'test@example.com', crypt('password123', gen_salt('bf')), NOW(), '{"name": "Test User"}')
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.profiles (id, email, full_name) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'test@example.com', 'Test User')
ON CONFLICT (id) DO NOTHING;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO PUBLIC;
GRANT ALL ON ALL TABLES IN SCHEMA public TO PUBLIC;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO PUBLIC;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO PUBLIC;

GRANT USAGE ON SCHEMA auth TO PUBLIC;  
GRANT SELECT ON auth.users TO PUBLIC;

-- Success message
SELECT 'PyMessenger Database Setup Complete!' as message;