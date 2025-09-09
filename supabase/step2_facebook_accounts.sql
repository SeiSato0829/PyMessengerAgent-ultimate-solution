-- Step 2: Facebookアカウントテーブル作成
CREATE TABLE IF NOT EXISTS facebook_accounts (
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