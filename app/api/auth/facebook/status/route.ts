/**
 * Facebook認証状態確認API - 完全版
 * デモモード対応＆エラーハンドリング強化
 */

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // デモモードチェック（環境変数が設定されていない場合）
    const isDemoMode = !process.env.FACEBOOK_APP_ID || 
                       !process.env.FACEBOOK_APP_SECRET ||
                       process.env.FACEBOOK_APP_ID === 'your-facebook-app-id' ||
                       process.env.FACEBOOK_APP_SECRET === 'your-facebook-app-secret'

    if (isDemoMode) {
      console.log('📝 デモモードで動作中')
      // デモモード用の固定レスポンス
      return NextResponse.json({
        authenticated: false,
        isDemoMode: true,
        message: 'デモモードで動作中です。Facebook認証を使用するには環境変数を設定してください。',
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