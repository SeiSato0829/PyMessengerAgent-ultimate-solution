import { NextResponse } from 'next/server'

export async function GET() {
  const clientId = process.env.FACEBOOK_APP_ID || '1074848747815619'

  // デプロイメント環境に応じてURLを自動設定
  let appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!appUrl) {
    if (process.env.RAILWAY_ENVIRONMENT) {
      appUrl = 'https://pymessenger-agent.up.railway.app'
    } else if (process.env.VERCEL) {
      appUrl = 'https://pymessengeragent-ultimate-solution.vercel.app'
    } else {
      appUrl = 'http://localhost:3000'
    }
  }
  const redirectUri = encodeURIComponent(`${appUrl}/api/auth/facebook/callback`)

  // 必要な権限スコープ
  const scopes = [
    'pages_messaging',           // ページメッセージング
    'pages_messaging_subscriptions',
    'pages_read_engagement',
    'pages_manage_metadata',
    'pages_read_user_content',
    'pages_manage_engagement',
    'business_management',
    'instagram_basic',
    'instagram_manage_messages'  // Instagram DM
  ].join(',')

  // Facebook OAuth URLを生成
  const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
    `client_id=${clientId}` +
    `&redirect_uri=${redirectUri}` +
    `&scope=${scopes}` +
    `&response_type=code` +
    `&auth_type=rerequest`

  return NextResponse.redirect(authUrl)
}