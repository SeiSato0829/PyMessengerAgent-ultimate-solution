/**
 * デバッグエンドポイント - 環境変数状態確認
 */

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  // 環境変数の状態を確認（値は隠す）
  const envStatus = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'not set',
    facebook: {
      appId: {
        exists: !!process.env.FACEBOOK_APP_ID,
        length: process.env.FACEBOOK_APP_ID?.length || 0,
        isDefault: process.env.FACEBOOK_APP_ID === 'your-facebook-app-id' ||
                   process.env.FACEBOOK_APP_ID === 'demo-app-id',
        preview: process.env.FACEBOOK_APP_ID 
          ? `${process.env.FACEBOOK_APP_ID.substring(0, 4)}...` 
          : 'NOT SET'
      },
      appSecret: {
        exists: !!process.env.FACEBOOK_APP_SECRET,
        length: process.env.FACEBOOK_APP_SECRET?.length || 0,
        isDefault: process.env.FACEBOOK_APP_SECRET === 'your-facebook-app-secret' ||
                   process.env.FACEBOOK_APP_SECRET === 'demo-app-secret'
      }
    },
    supabase: {
      url: {
        exists: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        isDefault: process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://your-project.supabase.co'
      },
      anonKey: {
        exists: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        isDefault: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === 'your-anon-key'
      }
    },
    encryption: {
      keyExists: !!process.env.ENCRYPTION_KEY,
      keyLength: process.env.ENCRYPTION_KEY?.length || 0
    },
    forceDemoMode: process.env.FORCE_DEMO_MODE === 'true',
    shouldBeInDemoMode: !process.env.FACEBOOK_APP_ID || 
                        !process.env.FACEBOOK_APP_SECRET ||
                        process.env.FACEBOOK_APP_ID === 'your-facebook-app-id' ||
                        process.env.FACEBOOK_APP_SECRET === 'your-facebook-app-secret' ||
                        process.env.FACEBOOK_APP_ID === 'demo-app-id' ||
                        process.env.FACEBOOK_APP_SECRET === 'demo-app-secret' ||
                        process.env.FORCE_DEMO_MODE === 'true'
  }

  return NextResponse.json(envStatus, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  })
}