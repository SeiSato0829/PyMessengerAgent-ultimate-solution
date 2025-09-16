/**
 * Facebook認証状態確認API - 完全版
 * デモモード対応＆エラーハンドリング強化
 */

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // LocalStorageの認証データを確認（クライアント側で送信される）
    const authHeader = request.headers.get('x-auth-data')
    
    if (authHeader) {
      try {
        // Base64デコード
        const decodedData = decodeURIComponent(atob(authHeader))
        const authData = JSON.parse(decodedData)
        
        if (authData.authenticated && authData.expiresAt) {
          const expiresAt = new Date(authData.expiresAt)
          const isExpired = expiresAt < new Date()
          
          if (!isExpired) {
            // 認証済み（LocalStorageから）- デモモードチェックをスキップ
            return NextResponse.json({
              authenticated: true,
              accountId: authData.userId,
              accountName: authData.userName || 'Facebook User',
              status: 'active',
              expiresAt: authData.expiresAt,
              message: 'Facebook認証済み（ローカルストレージ）',
              source: 'localStorage',
              isDemoMode: false // LocalStorage認証がある場合はデモモードではない
            })
          }
        }
      } catch (e) {
        console.error('認証データパースエラー:', e)
      }
    }
    
    // 環境変数の詳細チェック
    const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID
    const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET
    
    // デモモードチェック（環境変数が正しく設定されていない場合）
    const isDemoMode = !FACEBOOK_APP_ID || 
                       !FACEBOOK_APP_SECRET ||
                       FACEBOOK_APP_ID === 'your-facebook-app-id' ||
                       FACEBOOK_APP_SECRET === 'your-facebook-app-secret' ||
                       FACEBOOK_APP_ID === 'temporary_app_id' || // .env.starter.templateの値
                       FACEBOOK_APP_SECRET === 'temporary_app_secret' || // .env.starter.templateの値
                       process.env.FORCE_DEMO_MODE === 'true'
    
    // 無効な環境変数が設定されているかどうかを判定
    const hasInvalidEnvVars = FACEBOOK_APP_ID && FACEBOOK_APP_SECRET && (
      FACEBOOK_APP_ID.length < 15 ||
      FACEBOOK_APP_SECRET.length < 20 ||
      FACEBOOK_APP_ID.includes('temp') ||
      FACEBOOK_APP_ID.includes('test') ||
      FACEBOOK_APP_SECRET.includes('temp') ||
      FACEBOOK_APP_SECRET.includes('test')
    )

    if (isDemoMode) {
      console.log('📝 デモモードで動作中', {
        hasInvalidEnvVars,
        appIdLength: FACEBOOK_APP_ID?.length || 0,
        secretLength: FACEBOOK_APP_SECRET?.length || 0
      })
      
      // デモモード用の固定レスポンス
      return NextResponse.json({
        authenticated: false,
        isDemoMode: true,
        message: hasInvalidEnvVars
          ? '🚨 無効な環境変数が設定されています！Render.comで FACEBOOK_APP_ID と FACEBOOK_APP_SECRET を削除してください。'
          : 'デモモードで動作中です。Facebook認証を使用するには環境変数を設定してください。',
        requiredEnvVars: [
          'FACEBOOK_APP_ID',
          'FACEBOOK_APP_SECRET', 
          'NEXT_PUBLIC_SUPABASE_URL',
          'NEXT_PUBLIC_SUPABASE_ANON_KEY'
        ],
        demoFeatures: {
          messaging: 'シミュレーションモード',
          authentication: 'ダミー認証',
          database: 'メモリ内ストレージ'
        }
      })
    }

    // Supabase設定チェック
    const hasSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL && 
                       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
                       process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://your-project.supabase.co'

    if (!hasSupabase) {
      console.log('⚠️ Supabase未設定')
      return NextResponse.json({
        authenticated: false,
        error: 'データベース未設定',
        message: 'Supabaseの設定が必要です',
        isDemoMode: true
      })
    }

    // ここから本番モードの処理
    try {
      // 動的インポートでSupabaseクライアントを取得
      const { supabase } = await import('@/lib/supabase/client')
      
      // TODO: 実際のユーザーIDをセッションから取得
      const userId = 'current-user'

      // アクティブなFacebookアカウントを取得
      const { data: accounts, error } = await supabase
        .from('facebook_accounts')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .gt('token_expires_at', new Date().toISOString())

      if (error) {
        console.error('Supabaseクエリエラー:', error)
        return NextResponse.json({
          authenticated: false,
          error: 'データベースクエリエラー',
          details: error.message
        })
      }

      if (!accounts || accounts.length === 0) {
        return NextResponse.json({
          authenticated: false,
          message: 'Facebookアカウントが連携されていません',
          action: 'Facebook認証を開始してください'
        })
      }

      const account = accounts[0]
      
      // トークンの簡易検証（実際のFacebook API呼び出しは省略）
      const tokenExpired = new Date(account.token_expires_at) < new Date()
      
      if (tokenExpired) {
        // トークン期限切れの場合
        await supabase
          .from('facebook_accounts')
          .update({ status: 'expired' })
          .eq('id', account.id)

        return NextResponse.json({
          authenticated: false,
          error: 'Facebookトークンの期限が切れています',
          action: '再認証が必要です'
        })
      }

      // 認証成功レスポンス
      return NextResponse.json({
        authenticated: true,
        accountId: account.id,
        accountName: account.account_name || 'Facebook User',
        pageName: account.page_name || 'ページ未設定',
        dailyLimit: account.daily_limit || 50,
        status: account.status,
        expiresAt: account.token_expires_at,
        message: 'Facebook認証済み'
      })

    } catch (dbError: any) {
      console.error('データベース処理エラー:', dbError)
      return NextResponse.json({
        authenticated: false,
        error: 'データベース接続エラー',
        message: 'データベースに接続できません。デモモードで動作中です。',
        isDemoMode: true
      })
    }

  } catch (error: any) {
    console.error('認証状態確認エラー:', error)
    // エラーが発生してもクラッシュしないようにする
    return NextResponse.json({
      authenticated: false,
      error: '認証確認中にエラーが発生しました',
      message: error.message || '予期しないエラーが発生しました',
      isDemoMode: true
    })
  }
}