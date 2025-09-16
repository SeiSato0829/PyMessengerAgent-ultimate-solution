/**
 * Facebook Page経由のメッセージ送信API
 * Page Access Tokenを使用（App Review不要）
 */

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { recipientId, message, pageAccessToken } = body

    // 入力検証
    if (!recipientId || !message) {
      return NextResponse.json({
        error: '必須パラメータが不足しています',
        details: {
          recipientId: !!recipientId,
          message: !!message,
          pageAccessToken: !!pageAccessToken
        }
      }, { status: 400 })
    }

    // Page Access Tokenが提供されていない場合は環境変数から取得
    const token = pageAccessToken || process.env.PAGE_ACCESS_TOKEN

    if (!token) {
      return NextResponse.json({
        error: 'Page Access Tokenが設定されていません',
        solution: [
          '1. Facebook Pageを作成',
          '2. 開発者ダッシュボードでPage Access Tokenを取得',
          '3. Render.comの環境変数PAGE_ACCESS_TOKENに設定'
        ]
      }, { status: 400 })
    }

    console.log('📤 Page経由メッセージ送信開始:', {
      recipientId,
      messageLength: message.length,
      hasToken: !!token
    })

    // Facebook Graph API エンドポイント（Page経由）
    const apiVersion = 'v18.0'
    const url = `https://graph.facebook.com/${apiVersion}/me/messages`

    // メッセージペイロード
    const payload = {
      recipient: { 
        id: recipientId 
      },
      message: { 
        text: message 
      },
      messaging_type: 'RESPONSE' // ユーザーからのメッセージへの返信
    }

    console.log('📡 Graph API呼び出し:', url)
    console.log('📦 ペイロード:', payload)

    // API呼び出し
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })

    const responseData = await response.json()
    console.log('📥 API応答:', responseData)

    if (!response.ok) {
      console.error('❌ Facebook APIエラー:', responseData)
      
      // エラーの詳細を解析
      const errorMessage = responseData.error?.message || 'メッセージ送信に失敗しました'
      const errorCode = responseData.error?.code
      const errorType = responseData.error?.type
      
      // 24時間ポリシー違反
      if (errorCode === 10 && errorMessage.includes('24 hour')) {
        return NextResponse.json({
          error: '24時間ポリシー違反',
          details: {
            message: 'ユーザーが最後にページにメッセージを送信してから24時間以上経過しています',
            solution: [
              '1. ユーザーからページに新しいメッセージを送信してもらう',
              '2. 送信後24時間以内に返信する',
              '3. または messaging_type を UPDATE に変更'
            ]
          },
          errorCode,
          errorType
        }, { status: 403 })
      }
      
      // 無効なページアクセストークン
      if (errorCode === 190) {
        return NextResponse.json({
          error: '無効なPage Access Token',
          details: {
            message: 'Page Access Tokenが無効または期限切れです',
            solution: [
              '1. Facebook開発者ダッシュボードで新しいTokenを取得',
              '2. 環境変数を更新',
              '3. アプリを再デプロイ'
            ]
          }
        }, { status: 401 })
      }
      
      return NextResponse.json({
        error: errorMessage,
        details: responseData.error,
        errorCode,
        errorType
      }, { status: response.status })
    }

    // 成功
    console.log('✅ Page経由メッセージ送信成功:', {
      messageId: responseData.message_id,
      recipientId: responseData.recipient_id
    })

    return NextResponse.json({
      success: true,
      messageId: responseData.message_id,
      recipientId: responseData.recipient_id,
      timestamp: new Date().toISOString(),
      method: 'page_access_token',
      debug: {
        apiVersion,
        endpoint: url,
        recipientId: recipientId,
        messagingType: 'RESPONSE'
      }
    })

  } catch (error: any) {
    console.error('🔥 Page送信APIエラー:', error)
    return NextResponse.json({
      error: error.message || '送信に失敗しました',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}

// デバッグ用GETエンドポイント
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/messages/send-page',
    method: 'POST',
    description: 'Facebook Page経由でメッセージを送信（App Review不要）',
    requiredParams: {
      recipientId: 'Facebook User ID (例: 61578211067618)',
      message: 'メッセージ本文',
      pageAccessToken: 'Page Access Token（オプション・環境変数優先）'
    },
    advantages: [
      'App Review承認不要',
      'Page Access Tokenですぐに利用可能',
      '24時間ポリシー内で確実に送信可能'
    ],
    setupRequired: [
      '1. Facebook Pageを作成',
      '2. Page Access Tokenを取得',
      '3. 環境変数PAGE_ACCESS_TOKENを設定',
      '4. ユーザーからページへの初回メッセージ'
    ],
    testData: {
      recipientId: '61578211067618',
      message: 'Hello from PyMessenger Page!',
      pageAccessToken: 'YOUR_PAGE_ACCESS_TOKEN'
    },
    nextSteps: 'FACEBOOK_SETUP_GUIDE.mdを参照してください'
  })
}