/**
 * Facebook OAuth Callback Handler
 * 認証後のコールバックを処理
 */

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  try {
    // エラーチェック
    if (error) {
      console.error('Facebook認証エラー:', error, errorDescription)
      return new NextResponse(
        `<!DOCTYPE html>
        <html lang="ja">
        <head>
          <meta charset="UTF-8">
          <title>認証エラー</title>
          <style>
            body { 
              font-family: sans-serif; 
              display: flex; 
              justify-content: center; 
              align-items: center; 
              min-height: 100vh;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              margin: 0;
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 10px;
              box-shadow: 0 10px 30px rgba(0,0,0,0.2);
              text-align: center;
              max-width: 400px;
            }
            h1 { color: #e53e3e; margin-bottom: 20px; }
            p { color: #4a5568; margin-bottom: 30px; }
            button {
              background: #667eea;
              color: white;
              border: none;
              padding: 12px 30px;
              border-radius: 5px;
              font-size: 16px;
              cursor: pointer;
            }
            button:hover { background: #5a67d8; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>認証エラー</h1>
            <p>${errorDescription || 'Facebook認証中にエラーが発生しました'}</p>
            <button onclick="window.close()">閉じる</button>
          </div>
        </body>
        </html>`,
        { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      )
    }

    // 認証コードが取得できない場合
    if (!code) {
      throw new Error('認証コードが取得できませんでした')
    }

    // 環境変数チェック
    const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || '1074848747815619'
    const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET || 'ae554f1df345416e5d6d08c22d07685d'

    // デプロイメント環境に応じてURLを自動設定
    let APP_URL = process.env.NEXT_PUBLIC_APP_URL
    if (!APP_URL) {
      if (process.env.RAILWAY_ENVIRONMENT) {
        APP_URL = 'https://pymessenger-agent.up.railway.app'
      } else if (process.env.VERCEL) {
        APP_URL = 'https://pymessengeragent-ultimate-solution.vercel.app'
      } else {
        APP_URL = 'http://localhost:3000'
      }
    }
    const FACEBOOK_REDIRECT_URI = `${APP_URL}/api/auth/facebook/callback`

    if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
      throw new Error('Facebook App credentials not configured')
    }

    // アクセストークン取得
    console.log('アクセストークン取得開始...')
    const tokenUrl = new URL('https://graph.facebook.com/v19.0/oauth/access_token')
    tokenUrl.searchParams.set('client_id', FACEBOOK_APP_ID)
    tokenUrl.searchParams.set('client_secret', FACEBOOK_APP_SECRET)
    tokenUrl.searchParams.set('redirect_uri', FACEBOOK_REDIRECT_URI)
    tokenUrl.searchParams.set('code', code)

    const tokenResponse = await fetch(tokenUrl.toString())
    const tokenData = await tokenResponse.json()
    
    if (tokenData.error) {
      console.error('トークン取得エラー:', tokenData.error)
      throw new Error(`トークン取得エラー: ${tokenData.error.message}`)
    }

    console.log('アクセストークン取得成功')

    // ユーザー情報取得
    const userResponse = await fetch(
      `https://graph.facebook.com/v19.0/me?fields=id,name&access_token=${tokenData.access_token}`
    )
    const userData = await userResponse.json()

    if (userData.error) {
      console.error('ユーザー情報取得エラー:', userData.error)
      throw new Error(`ユーザー情報取得エラー: ${userData.error.message}`)
    }

    console.log('Facebook認証成功:', {
      userId: userData.id,
      userName: userData.name
    })

    // 認証情報をCookieに保存（データベース不要の簡易実装）
    const authData = {
      authenticated: true,
      userId: userData.id,
      userName: userData.name,
      accessToken: tokenData.access_token,
      expiresAt: new Date(Date.now() + (tokenData.expires_in || 5184000) * 1000).toISOString(),
      timestamp: new Date().toISOString()
    }

    // LocalStorageに保存するためのスクリプトを成功ページに埋め込む
    const authDataScript = `
      <script>
        // 認証データをLocalStorageに保存
        const authData = ${JSON.stringify(authData)};
        localStorage.setItem('facebook_auth', JSON.stringify(authData));
        console.log('認証データをLocalStorageに保存しました');
      </script>
    `

    // 成功ページを返す
    return new NextResponse(
      `<!DOCTYPE html>
      <html lang="ja">
      <head>
        <meta charset="UTF-8">
        <title>認証成功</title>
        <style>
          body { 
            font-family: sans-serif; 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
          }
          .container {
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            text-align: center;
            max-width: 400px;
          }
          h1 { color: #48bb78; margin-bottom: 20px; }
          p { color: #4a5568; margin-bottom: 10px; }
          .user-name { 
            font-size: 20px; 
            font-weight: bold; 
            color: #2d3748;
            margin: 20px 0;
          }
          button {
            background: #667eea;
            color: white;
            border: none;
            padding: 12px 30px;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
            margin: 10px;
          }
          button:hover { background: #5a67d8; }
          .spinner {
            border: 3px solid #f3f3f3;
            border-top: 3px solid #667eea;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            animation: spin 1s linear infinite;
            margin: 20px auto;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
        ${authDataScript}
        <script>
          // 親ウィンドウをリロードして閉じる
          setTimeout(() => {
            if (window.opener) {
              window.opener.location.reload();
              window.close();
            } else {
              // 親ウィンドウがない場合はダッシュボードにリダイレクト
              window.location.href = '/';
            }
          }, 2000);
        </script>
      </head>
      <body>
        <div class="container">
          <h1>✅ 認証成功！</h1>
          <div class="user-name">${userData.name}様</div>
          <p>Facebook認証が完了しました</p>
          <div class="spinner"></div>
          <p style="color: #718096; font-size: 14px;">自動的にダッシュボードに戻ります...</p>
          <button onclick="window.close()">今すぐ閉じる</button>
        </div>
      </body>
      </html>`,
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    )

  } catch (error: any) {
    console.error('Facebook認証コールバックエラー:', error)
    
    // エラーページを返す
    return new NextResponse(
      `<!DOCTYPE html>
      <html lang="ja">
      <head>
        <meta charset="UTF-8">
        <title>認証エラー</title>
        <style>
          body { 
            font-family: sans-serif; 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
          }
          .container {
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            text-align: center;
            max-width: 500px;
          }
          h1 { color: #e53e3e; margin-bottom: 20px; }
          .error-detail {
            background: #fed7d7;
            color: #742a2a;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
            font-size: 14px;
            text-align: left;
          }
          button {
            background: #667eea;
            color: white;
            border: none;
            padding: 12px 30px;
            border-radius: 5px;
            font-size: 16px;
            cursor: pointer;
            margin: 10px;
          }
          button:hover { background: #5a67d8; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>⚠️ 認証処理エラー</h1>
          <div class="error-detail">
            ${error.message || '予期しないエラーが発生しました'}
          </div>
          <p style="color: #718096;">もう一度お試しください</p>
          <button onclick="window.location.href='/'">ダッシュボードへ</button>
          <button onclick="window.close()">閉じる</button>
        </div>
      </body>
      </html>`,
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    )
  }
}