/**
 * 環境変数デバッグエンドポイント
 * 本番環境で環境変数が正しく読み込まれているか確認
 */

import { NextResponse } from 'next/server'

export async function GET() {
  const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID
  const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET
  const NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  // セキュリティのため、値の一部のみ表示
  const maskValue = (value: string | undefined) => {
    if (!value) return '❌ 未設定'
    if (value.length < 10) return '❌ 無効な値'
    return `✅ ${value.substring(0, 10)}...${value.substring(value.length - 5)}`
  }
  
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    isRender: !!process.env.RENDER,
    
    facebook: {
      appId: {
        status: FACEBOOK_APP_ID ? '✅ 設定済み' : '❌ 未設定',
        value: maskValue(FACEBOOK_APP_ID),
        expected: '1074848747815619',
        match: FACEBOOK_APP_ID === '1074848747815619' ? '✅ 一致' : '❌ 不一致'
      },
      appSecret: {
        status: FACEBOOK_APP_SECRET ? '✅ 設定済み' : '❌ 未設定',
        value: maskValue(FACEBOOK_APP_SECRET),
        hasValue: !!FACEBOOK_APP_SECRET,
        length: FACEBOOK_APP_SECRET?.length || 0
      }
    },
    
    supabase: {
      url: {
        status: NEXT_PUBLIC_SUPABASE_URL ? '✅ 設定済み' : '❌ 未設定',
        value: maskValue(NEXT_PUBLIC_SUPABASE_URL),
        isDummy: NEXT_PUBLIC_SUPABASE_URL?.includes('xxxxx') || NEXT_PUBLIC_SUPABASE_URL?.includes('your-project')
      },
      key: {
        status: NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ 設定済み' : '❌ 未設定',
        hasValue: !!NEXT_PUBLIC_SUPABASE_ANON_KEY,
        length: NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0
      }
    },
    
    diagnosis: {
      facebookConfigured: !!(FACEBOOK_APP_ID && FACEBOOK_APP_SECRET && FACEBOOK_APP_ID === '1074848747815619'),
      supabaseConfigured: !!(NEXT_PUBLIC_SUPABASE_URL && NEXT_PUBLIC_SUPABASE_ANON_KEY && !NEXT_PUBLIC_SUPABASE_URL.includes('xxxxx')),
      shouldBeInDemoMode: !FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET || FACEBOOK_APP_ID !== '1074848747815619',
      
      problems: [
        !FACEBOOK_APP_ID && 'FACEBOOK_APP_ID未設定',
        !FACEBOOK_APP_SECRET && 'FACEBOOK_APP_SECRET未設定',
        FACEBOOK_APP_ID && FACEBOOK_APP_ID !== '1074848747815619' && 'FACEBOOK_APP_IDが間違っている',
        !NEXT_PUBLIC_SUPABASE_URL && 'NEXT_PUBLIC_SUPABASE_URL未設定',
        NEXT_PUBLIC_SUPABASE_URL?.includes('xxxxx') && 'Supabase URLがダミー値'
      ].filter(Boolean)
    },
    
    solution: '📌 Render.comで以下を設定:\n' +
             'FACEBOOK_APP_ID=1074848747815619\n' +
             'FACEBOOK_APP_SECRET=ae554f1df345416e5d6d08c22d07685d\n' +
             'その後、Manual Deploy → Clear cache and deploy'
  })
}