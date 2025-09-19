/**
 * Facebook認証テスト用エンドポイント
 * Meta側のテストユーザー機能停止中の代替手段
 */

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Facebook App設定を取得
    const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID
    const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET
    const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://pymessengeragent-ultimate-solution.vercel.app'

    console.log('🧪 Facebook認証テスト実行:', {
      appId: FACEBOOK_APP_ID,
      hasSecret: !!FACEBOOK_APP_SECRET,
      appUrl: APP_URL
    })

    // App Access Tokenを生成
    const appAccessTokenUrl = `https://graph.facebook.com/oauth/access_token?client_id=${FACEBOOK_APP_ID}&client_secret=${FACEBOOK_APP_SECRET}&grant_type=client_credentials`
    
    const tokenResponse = await fetch(appAccessTokenUrl)
    const tokenData = await tokenResponse.json()

    if (!tokenResponse.ok) {
      throw new Error(`Facebook API Error: ${tokenData.error?.message || 'Unknown error'}`)
    }

    console.log('✅ App Access Token取得成功')

    // Facebook Login Statusを確認
    const debugUrl = `https://graph.facebook.com/debug_token?input_token=${tokenData.access_token}&access_token=${tokenData.access_token}`
    const debugResponse = await fetch(debugUrl)
    const debugData = await debugResponse.json()

    // テスト結果を返す
    return NextResponse.json({
      success: true,
      message: '✅ Facebook App設定は正常です',
      data: {
        appId: FACEBOOK_APP_ID,
        tokenType: debugData.data?.type || 'unknown',
        appName: debugData.data?.application || 'DM施策',
        validToken: debugData.data?.is_valid || false,
        loginUrl: `https://www.facebook.com/v19.0/dialog/oauth?client_id=${FACEBOOK_APP_ID}&redirect_uri=${APP_URL}/api/auth/facebook/callback&scope=public_profile&response_type=code`
      }
    })

  } catch (error: any) {
    console.error('❌ Facebook認証テストエラー:', error)
    
    return NextResponse.json({
      success: false,
      message: '❌ Facebook設定にエラーがあります',
      error: error.message,
      solution: [
        '1. FACEBOOK_APP_ID と FACEBOOK_APP_SECRET が正しく設定されているか確認',
        '2. Render.comで環境変数を再設定し、Clear cache and deploy を実行',
        '3. Facebook Appが有効な状態か確認'
      ]
    }, { status: 400 })
  }
}