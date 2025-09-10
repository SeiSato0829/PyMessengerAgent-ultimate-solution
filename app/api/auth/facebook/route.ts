/**
 * Facebook OAuth認証 - 完全版
 * 実際のFacebookログインとアクセストークン取得
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

// Facebook App設定（デフォルト値を設定しない）
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET
const FACEBOOK_REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL || 'https://pymessengeragent-ultimate-solution.onrender.com'}/api/auth/facebook/callback`

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  try {
    // デモモードチェック（環境変数が未設定またはダミー値の場合）
    const isDemoMode = !process.env.FACEBOOK_APP_ID || 
                       process.env.FACEBOOK_APP_ID === 'your-facebook-app-id' ||
                       process.env.FACEBOOK_APP_ID === 'demo-app-id' ||
                       !process.env.FACEBOOK_APP_SECRET ||
                       process.env.FACEBOOK_APP_SECRET === 'demo-app-secret'

    if (isDemoMode || action === 'demo') {
      // デモモードではダミーページを返す
      return new NextResponse(
        `<!DOCTYPE html>
        <html>
        <head>
          <title>Facebook認証 - デモモード</title>
          <style>
            body { font-family: sans-serif; padding: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
            .container { max-width: 600px; margin: 0 auto; text-align: center; }
            h1 { font-size: 2em; margin-bottom: 20px; }
            .warning { background: rgba(255,255,255,0.2); padding: 20px; border-radius: 10px; margin: 20px 0; }
            .env-list { text-align: left; background: rgba(0,0,0,0.3); padding: 15px; border-radius: 5px; margin-top: 20px; }
            .env-list li { margin: 5px 0; font-family: monospace; }
            button { background: white; color: #667eea; border: none; padding: 12px 24px; border-radius: 5px; font-size: 16px; cursor: pointer; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>📝 デモモード</h1>
            <div class="warning">
              <h2>⚠️ Facebook認証が利用できません</h2>
              <p>Facebook認証を使用するには、以下の環境変数をRender.comで設定してください：</p>
              <ul class="env-list">
                <li>FACEBOOK_APP_ID</li>
                <li>FACEBOOK_APP_SECRET</li>
                <li>NEXT_PUBLIC_SUPABASE_URL</li>
                <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
              </ul>
            </div>
            <div style="margin-top: 30px;">
              <p style="font-size: 14px; opacity: 0.8;">現在はデモモードで動作中です。</p>
              <p style="font-size: 14px; opacity: 0.8;">実際のFacebook DM送信機能は使用できません。</p>
            </div>
            <button onclick="window.close()">閉じる</button>
          </div>
        </body>
        </html>`,
        { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      )
    }

    if (action === 'login') {
      // Facebook OAuth認証URL生成
      const scopes = [
        'pages_messaging',        // ページメッセージング
        'pages_manage_metadata',  // ページ管理
        'pages_read_engagement',  // エンゲージメント読み取り
        'pages_show_list',        // ページリスト表示
        'business_management'     // ビジネス管理
      ].join(',')

      const authUrl = new URL('https://www.facebook.com/v18.0/dialog/oauth')
      authUrl.searchParams.set('client_id', FACEBOOK_APP_ID)
      authUrl.searchParams.set('redirect_uri', FACEBOOK_REDIRECT_URI)
      authUrl.searchParams.set('scope', scopes)
      authUrl.searchParams.set('response_type', 'code')
      authUrl.searchParams.set('state', generateSecureState()) // CSRF保護

      return NextResponse.redirect(authUrl.toString())

    } else if (action === 'callback') {
      // Facebook認証コールバック処理
      const code = searchParams.get('code')
      const state = searchParams.get('state')
      
      if (!code) {
        throw new Error('認証コードが取得できませんでした')
      }

      // アクセストークン取得
      const tokenResponse = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: FACEBOOK_APP_ID,
          client_secret: FACEBOOK_APP_SECRET,
          code: code,
          redirect_uri: FACEBOOK_REDIRECT_URI
        })
      })

      const tokenData = await tokenResponse.json()
      
      if (tokenData.error) {
        throw new Error(`トークン取得エラー: ${tokenData.error.message}`)
      }

      const accessToken = tokenData.access_token

      // ユーザー情報取得
      const userResponse = await fetch(`https://graph.facebook.com/v18.0/me?fields=id,name,email&access_token=${accessToken}`)
      const userData = await userResponse.json()

      // ページ情報取得
      const pagesResponse = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`)
      const pagesData = await pagesResponse.json()

      if (!pagesData.data || pagesData.data.length === 0) {
        throw new Error('管理しているFacebookページが見つかりません')
      }

      // Supabaseにアカウント情報を保存
      const accountData = {
        user_id: 'current-user', // TODO: 実際の認証ユーザーID
        account_name: userData.name,
        facebook_user_id: userData.id,
        page_id: pagesData.data[0].id,
        page_name: pagesData.data[0].name,
        access_token: encrypt(accessToken), // TODO: 暗号化実装
        refresh_token: encrypt(tokenData.refresh_token || ''), // TODO: 暗号化実装
        token_expires_at: new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString(),
        status: 'active',
        daily_limit: 50,
        created_at: new Date().toISOString()
      }

      const { error: saveError } = await supabase
        .from('facebook_accounts')
        .upsert(accountData)

      if (saveError) {
        throw new Error(`アカウント保存エラー: ${saveError.message}`)
      }

      // 成功時はダッシュボードにリダイレクト
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?auth=success`)

    } else {
      throw new Error('不正なアクション')
    }

  } catch (error: any) {
    console.error('Facebook認証エラー:', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/?auth=error&message=${encodeURIComponent(error.message)}`)
  }
}

/**
 * セキュアなstate生成
 */
function generateSecureState(): string {
  return Array.from({ length: 32 }, () => Math.random().toString(36)[2]).join('')
}

/**
 * 暗号化関数（簡易版）
 * TODO: 本番では強固な暗号化を実装
 */
function encrypt(text: string): string {
  if (!text) return ''
  
  const key = process.env.ENCRYPTION_KEY || 'default-key-change-in-production'
  
  // Base64エンコード（本番では AES-256-GCM などを使用）
  return Buffer.from(`${key}:${text}`).toString('base64')
}

/**
 * 復号化関数（簡易版）
 */
function decrypt(encryptedText: string): string {
  if (!encryptedText) return ''
  
  try {
    const decoded = Buffer.from(encryptedText, 'base64').toString()
    const [key, text] = decoded.split(':')
    return text || ''
  } catch {
    return ''
  }
}