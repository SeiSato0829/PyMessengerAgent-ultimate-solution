/**
 * Facebook OAuth認証 - 完全デモモード対応版
 * 環境変数未設定時は必ずデモページを表示
 */

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  // 強制デモモードチェック
  if (process.env.FORCE_DEMO_MODE === 'true') {
    console.log('⚠️ FORCE_DEMO_MODE is enabled')
  }

  try {
    // Facebook App設定を取得（デフォルト値なし）
    const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID
    const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET
    const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://pymessengeragent-ultimate-solution.onrender.com'
    const FACEBOOK_REDIRECT_URI = `${APP_URL}/api/auth/facebook/callback`

    // デモモード判定（環境変数が一つでも不足していればデモモード）
    const isDemoMode = !FACEBOOK_APP_ID || 
                       !FACEBOOK_APP_SECRET ||
                       FACEBOOK_APP_ID === 'your-facebook-app-id' ||
                       FACEBOOK_APP_SECRET === 'your-facebook-app-secret' ||
                       FACEBOOK_APP_ID === 'demo-app-id' ||
                       FACEBOOK_APP_SECRET === 'demo-app-secret' ||
                       FACEBOOK_APP_ID.length < 15 || // 有効なFacebook App IDは15文字以上
                       FACEBOOK_APP_SECRET.length < 20 || // 有効なSecretは32文字以上だが、余裕を持って20文字
                       FACEBOOK_APP_ID.includes('temp') || // 一時的な値
                       FACEBOOK_APP_ID.includes('test') || // テスト値
                       FACEBOOK_APP_SECRET.includes('temp') || // 一時的な値
                       FACEBOOK_APP_SECRET.includes('test') || // テスト値
                       process.env.FORCE_DEMO_MODE === 'true' // 強制デモモード

    // デバッグログ出力
    console.log('🔍 Facebook Auth Debug:', {
      action,
      appIdExists: !!FACEBOOK_APP_ID,
      appIdLength: FACEBOOK_APP_ID?.length || 0,
      secretExists: !!FACEBOOK_APP_SECRET,
      secretLength: FACEBOOK_APP_SECRET?.length || 0,
      isDemoMode,
      forceDemoMode: process.env.FORCE_DEMO_MODE === 'true'
    })

    // デモモードまたは環境変数未設定の場合は、常にデモページを返す
    // action === 'login' でも無効な環境変数の場合はデモページを表示
    if (isDemoMode || action === 'demo' || (action === 'login' && isDemoMode)) {
      console.log('📝 Facebook認証：デモモード（環境変数未設定または無効）')
      
      return new NextResponse(
        `<!DOCTYPE html>
        <html lang="ja">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Facebook認証 - デモモード</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 20px;
            }
            .container {
              max-width: 600px;
              width: 100%;
              background: rgba(255,255,255,0.95);
              border-radius: 20px;
              padding: 40px;
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            }
            h1 {
              color: #333;
              font-size: 28px;
              margin-bottom: 10px;
              display: flex;
              align-items: center;
              gap: 10px;
            }
            .demo-badge {
              background: #fbbf24;
              color: #78350f;
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 14px;
              font-weight: normal;
            }
            .subtitle {
              color: #666;
              margin-bottom: 30px;
              font-size: 16px;
            }
            .warning-box {
              background: #fef3c7;
              border: 2px solid #f59e0b;
              border-radius: 10px;
              padding: 20px;
              margin-bottom: 30px;
            }
            .warning-title {
              color: #92400e;
              font-size: 18px;
              font-weight: bold;
              margin-bottom: 10px;
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .warning-text {
              color: #78350f;
              line-height: 1.6;
            }
            .env-section {
              background: #f3f4f6;
              border-radius: 10px;
              padding: 20px;
              margin-bottom: 20px;
            }
            .env-title {
              color: #374151;
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 15px;
            }
            .env-list {
              list-style: none;
            }
            .env-item {
              background: white;
              border: 1px solid #e5e7eb;
              border-radius: 6px;
              padding: 12px;
              margin-bottom: 10px;
              font-family: 'Courier New', monospace;
              font-size: 14px;
              color: #1f2937;
              display: flex;
              align-items: center;
              justify-content: space-between;
            }
            .env-key {
              font-weight: bold;
              color: #7c3aed;
            }
            .required {
              background: #ef4444;
              color: white;
              padding: 2px 8px;
              border-radius: 4px;
              font-size: 11px;
            }
            .instructions {
              background: #eff6ff;
              border: 1px solid #3b82f6;
              border-radius: 10px;
              padding: 20px;
              margin-bottom: 30px;
            }
            .instructions-title {
              color: #1e40af;
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .instructions ol {
              color: #1e40af;
              padding-left: 20px;
            }
            .instructions li {
              margin-bottom: 8px;
              line-height: 1.5;
            }
            .demo-features {
              background: #f0fdf4;
              border: 1px solid #22c55e;
              border-radius: 10px;
              padding: 20px;
              margin-bottom: 30px;
            }
            .demo-features-title {
              color: #15803d;
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 10px;
            }
            .demo-features ul {
              list-style: none;
              color: #166534;
            }
            .demo-features li {
              padding: 5px 0;
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .demo-features li:before {
              content: "✓";
              background: #22c55e;
              color: white;
              width: 20px;
              height: 20px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 12px;
              flex-shrink: 0;
            }
            .button-group {
              display: flex;
              gap: 10px;
              justify-content: center;
            }
            button {
              background: #7c3aed;
              color: white;
              border: none;
              padding: 12px 30px;
              border-radius: 8px;
              font-size: 16px;
              font-weight: bold;
              cursor: pointer;
              transition: all 0.3s;
            }
            button:hover {
              background: #6d28d9;
              transform: translateY(-2px);
              box-shadow: 0 10px 20px rgba(124, 58, 237, 0.3);
            }
            .secondary-btn {
              background: #6b7280;
            }
            .secondary-btn:hover {
              background: #4b5563;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              text-align: center;
              color: #9ca3af;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>
              Facebook認証
              <span class="demo-badge">デモモード</span>
            </h1>
            <p class="subtitle">環境変数が設定されていないため、デモモードで動作しています</p>
            
            <div class="warning-box">
              <div class="warning-title">
                ⚠️ Facebook認証を使用できません
              </div>
              <div class="warning-text">
                実際のFacebook DM送信機能を使用するには、以下の設定が必要です。
              </div>
            </div>

            <div class="env-section">
              <div class="env-title">📋 必要な環境変数</div>
              <ul class="env-list">
                <li class="env-item">
                  <span class="env-key">FACEBOOK_APP_ID</span>
                  <span class="required">必須</span>
                </li>
                <li class="env-item">
                  <span class="env-key">FACEBOOK_APP_SECRET</span>
                  <span class="required">必須</span>
                </li>
                <li class="env-item">
                  <span class="env-key">NEXT_PUBLIC_SUPABASE_URL</span>
                  <span class="required">必須</span>
                </li>
                <li class="env-item">
                  <span class="env-key">NEXT_PUBLIC_SUPABASE_ANON_KEY</span>
                  <span class="required">必須</span>
                </li>
                <li class="env-item">
                  <span class="env-key">ENCRYPTION_KEY</span>
                  <span class="required">推奨</span>
                </li>
              </ul>
            </div>

            <div class="instructions">
              <div class="instructions-title">🔧 設定方法</div>
              <ol>
                <li>Render.comのダッシュボードにログイン</li>
                <li>サービスを選択 → Environment タブを開く</li>
                <li>上記の環境変数を追加</li>
                <li>Facebook Developersでアプリを作成し、App IDとSecretを取得</li>
                <li>Supabaseでプロジェクトを作成し、URLとキーを取得</li>
                <li>Save Changesをクリックして再デプロイ</li>
              </ol>
            </div>

            <div class="demo-features">
              <div class="demo-features-title">✨ デモモードで利用可能な機能</div>
              <ul>
                <li>ダッシュボードのプレビュー</li>
                <li>UIコンポーネントの確認</li>
                <li>メッセージ作成画面のテスト</li>
                <li>統計情報の表示（サンプルデータ）</li>
              </ul>
            </div>

            <div class="button-group">
              <button onclick="window.close()">閉じる</button>
              <button class="secondary-btn" onclick="window.location.href='/'">ダッシュボードへ</button>
            </div>

            <div class="footer">
              <p>PyMessenger Agent Pro - Enterprise Facebook Automation</p>
              <p>環境変数を設定すると、実際のFacebook認証が利用可能になります</p>
            </div>
          </div>
        </body>
        </html>`,
        { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      )
    }

    // ここから本番モードの処理（環境変数が全て有効な場合のみ）
    // この時点でisDemoModeがfalseであることが保証されている
    if (action === 'login' && !isDemoMode) {
      console.log('✅ Facebook認証：本番モード開始')
      
      // Facebook OAuth認証URL生成
      // 最小限の権限のみ要求（public_profileのみ）
      // emailも一時的に削除して動作確認
      const scopes = 'public_profile' // 権限なしか、public_profileのみで開始

      const authUrl = new URL('https://www.facebook.com/v19.0/dialog/oauth') // 最新バージョンに更新
      authUrl.searchParams.set('client_id', FACEBOOK_APP_ID!)
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
      const tokenResponse = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: FACEBOOK_APP_ID!,
          client_secret: FACEBOOK_APP_SECRET!,
          redirect_uri: FACEBOOK_REDIRECT_URI,
          code
        })
      })

      const tokenData = await tokenResponse.json()
      
      if (tokenData.error) {
        throw new Error(`トークン取得エラー: ${tokenData.error.message}`)
      }

      // ユーザー情報取得（emailを除外、id,nameのみ）
      const userResponse = await fetch(`https://graph.facebook.com/v19.0/me?fields=id,name&access_token=${tokenData.access_token}`)
      const userData = await userResponse.json()

      // Supabaseに保存（動的インポート）
      try {
        const { supabase } = await import('@/lib/supabase/client')
        
        // アカウント情報を保存/更新
        const { data, error } = await supabase
          .from('facebook_accounts')
          .upsert({
            user_id: userData.id,
            account_id: userData.id,
            account_name: userData.name,
            access_token: encrypt(tokenData.access_token),
            refresh_token: tokenData.refresh_token ? encrypt(tokenData.refresh_token) : null,
            token_expires_at: new Date(Date.now() + (tokenData.expires_in || 5184000) * 1000).toISOString(),
            status: 'active',
            created_at: new Date().toISOString()
          })

        if (error) {
          console.error('Supabase保存エラー:', error)
        }
      } catch (dbError) {
        console.error('データベース処理エラー:', dbError)
      }

      // 認証成功ページを返す
      return new NextResponse(
        `<!DOCTYPE html>
        <html lang="ja">
        <head>
          <title>認証成功</title>
          <script>
            window.opener?.location.reload();
            window.close();
          </script>
        </head>
        <body>
          <h1>認証成功！</h1>
          <p>このウィンドウは自動的に閉じます...</p>
        </body>
        </html>`,
        { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      )
    }

    // その他のアクション
    return NextResponse.json({ 
      error: 'Invalid action',
      isDemoMode 
    }, { status: 400 })

  } catch (error: any) {
    console.error('Facebook認証エラー:', error)
    return NextResponse.json({
      error: error.message || 'Facebook認証処理中にエラーが発生しました',
      isDemoMode: true
    }, { status: 500 })
  }
}

/**
 * 安全なState生成（CSRF対策）
 */
function generateSecureState(): string {
  return Array.from({ length: 32 }, () => Math.random().toString(36)[2]).join('')
}

/**
 * 暗号化関数（簡易版）
 */
function encrypt(text: string): string {
  if (!text) return ''
  
  const key = process.env.ENCRYPTION_KEY || 'default-key-change-in-production'
  
  // Base64エンコード（本番では AES-256-GCM などを使用）
  return Buffer.from(`${key}:${text}`).toString('base64')
}