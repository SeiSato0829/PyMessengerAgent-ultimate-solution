import { createClient } from '@supabase/supabase-js'
import { dummySupabase } from './dummy-client'

// 環境変数の取得（Vercelビルド時に確実に読み込む）
// Next.jsではビルド時にNEXT_PUBLIC_*環境変数が埋め込まれる
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rxipbozxhkzvlekrbjud.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4aXBib3p4aGt6dmxla3JianVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU2MDg0NzgsImV4cCI6MjA0MTE4NDQ3OH0.vTWRLqpPjUGTH2U0TBRZLM5N3r86O9E6Eq5INIoL7jY'

// ビルド時の環境変数状態をログ出力
if (typeof window === 'undefined') {
  console.log('🔧 Supabase Client初期化（ビルド時）')
  console.log('URL:', supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : '❌ 未設定')
  console.log('KEY:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 30)}...` : '❌ 未設定')
}

// Supabase設定の検証（修正版）
const isDummyMode = false // 常に実際のSupabaseを使用

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