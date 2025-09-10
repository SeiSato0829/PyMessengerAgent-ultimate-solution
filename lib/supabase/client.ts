import { createClient } from '@supabase/supabase-js'
import { dummySupabase } from './dummy-client'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Supabase設定がない場合はダミークライアントを使用（デモモード）
const isDummyMode = !supabaseUrl || !supabaseAnonKey || 
                    supabaseUrl === 'https://your-project.supabase.co' ||
                    supabaseAnonKey === 'your-anon-key'

if (isDummyMode) {
  console.warn('⚠️ Supabase未設定：デモモードで動作中')
  console.warn('本番環境では正しいSupabase設定を環境変数に追加してください')
}

export const supabase = isDummyMode
  ? dummySupabase as any
  : createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })