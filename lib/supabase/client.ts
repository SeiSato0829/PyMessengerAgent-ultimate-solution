import { createClient } from '@supabase/supabase-js'
import { dummySupabase } from './dummy-client'

// 環境変数の取得（Render.comビルド時に確実に読み込む）
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://demo.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbW8iLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYwMTU0MDQwMCwiZXhwIjoxOTE2ODk5MjAwfQ.demo_key_for_development_only'

// ビルド時の環境変数状態をログ出力
if (typeof window === 'undefined') {
  console.log('🔧 Supabase Client初期化（ビルド時）')
  console.log('URL:', supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : '❌ 未設定')
  console.log('KEY:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 30)}...` : '❌ 未設定')
}

// Supabase設定の検証（修正版）
const isDummyMode = supabaseUrl === 'https://demo.supabase.co' ||
                    supabaseUrl.includes('xxxxx') ||
                    supabaseUrl.includes('your-project') ||
                    supabaseAnonKey.includes('demo_key_for_development_only')

if (isDummyMode) {
  console.warn('⚠️ Supabase未設定：デモモードで動作中')
  console.warn('環境変数を設定してください:')
  console.warn('- NEXT_PUBLIC_SUPABASE_URL')
  console.warn('- NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

// 必ずダミークライアントか正しいクライアントを返す
export const supabase = isDummyMode
  ? dummySupabase as any
  : createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })