import { createClient } from '@supabase/supabase-js'
import { dummySupabase } from './dummy-client'

// 環境変数の取得（Render.comビルド時に確実に読み込む）
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// ビルド時の環境変数状態をログ出力
if (typeof window === 'undefined') {
  console.log('🔧 Supabase Client初期化（ビルド時）')
  console.log('URL:', supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : '❌ 未設定')
  console.log('KEY:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 30)}...` : '❌ 未設定')
}

// Supabase設定の検証（修正版）
const isDummyMode = !supabaseUrl || 
                    !supabaseAnonKey || 
                    supabaseUrl === 'https://your-project.supabase.co' ||
                    supabaseUrl.includes('xxxxx') ||
                    supabaseUrl.includes('your-project') ||
                    supabaseAnonKey === 'your-anon-key' ||
                    supabaseAnonKey.includes('dummy') ||
                    supabaseAnonKey.length < 50 // キー長チェックを緩和

if (isDummyMode) {
  console.warn('⚠️ Supabase未設定：デモモードで動作中')
  console.warn('環境変数状態:', { 
    url: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : '❌ 未設定',
    key: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 30)}...` : '❌ 未設定',
    isDummy: isDummyMode,
    reason: !supabaseUrl ? 'URL未設定' : 
            !supabaseAnonKey ? 'KEY未設定' :
            supabaseUrl.includes('xxxxx') ? 'ダミーURL検出' :
            supabaseUrl.includes('demo-') ? 'デモURL検出' :
            supabaseAnonKey.length < 100 ? 'KEY長さ不足' : '不明'
  })
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