/**
 * 直接メッセージ送信API
 * LocalStorageの認証情報を使用してFacebook Graph APIを呼び出す
 */

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { recipientId, message, accessToken, userId } = body

    // 入力検証
    if (!recipientId || !message || !accessToken) {
      return NextResponse.json({
        error: '必須パラメータが不足しています',
        details: {
          recipientId: !!recipientId,
          message: !!message,
          accessToken: !!accessToken
        }
      }, { status: 400 })
    }

    console.log('📤 メッセージ送信開始:', {
      recipientId,
      messageLength: message.length,
      userId
    })

    // Facebook Graph API エンドポイント
    // 注意: 個人間メッセージには特別な権限が必要
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
      messaging_type: 'RESPONSE' // または UPDATE
    }

    console.log('📡 Graph API呼び出し:', url)
    console.log('📦 ペイロード:', payload)

    // API呼び出し
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
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
      
      // 権限エラーの場合の特別な処理
      if (errorCode === 230 || errorType === 'OAuthException') {
        return NextResponse.json({
          error: '権限が不足しています',
          details: {
            message: 'pages_messaging権限が必要です（App Review承認が必要）',
            errorCode,
            errorType,
            originalError: errorMessage
          },
          requiresAppReview: true
        }, { status: 403 })
      }
      
      // 24時間ポリシー違反
      if (errorCode === 10 && errorMessage.includes('24 hour')) {
        return NextResponse.json({
          error: '24時間ポリシー違反',
          details: {
            message: 'ユーザーが最後にページにメッセージを送信してから24時間以上経過しています',
            solution: 'ユーザーから先にメッセージを送信してもらう必要があります'
          }
        }, { status: 403 })
      }
      
      return NextResponse.json({
        error: errorMessage,
        details: responseData.error,
        errorCode,
        errorType
      }, { status: response.status })
    }

    // 成功
    console.log('✅ メッセージ送信成功:', {
      messageId: responseData.message_id,
      recipientId: responseData.recipient_id
    })

    return NextResponse.json({
      success: true,
      messageId: responseData.message_id,
      recipientId: responseData.recipient_id,
      timestamp: new Date().toISOString(),
      debug: {
        apiVersion,
        endpoint: url,
        recipientId: recipientId
      }
    })

  } catch (error: any) {
    console.error('🔥 送信APIエラー:', error)
    return NextResponse.json({
      error: error.message || '送信に失敗しました',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}

// デバッグ用GETエンドポイント
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/messages/send-direct',
    method: 'POST',
    description: '直接Facebook Graph APIを呼び出してメッセージを送信',
    requiredParams: {
      recipientId: 'Facebook User ID (例: 61578211067618)',
      message: 'メッセージ本文',
      accessToken: 'Facebook Access Token',
      userId: 'ユーザーID（オプション）'
    },
    notes: [
      'pages_messaging権限が必要（App Review承認必須）',
      '24時間ポリシー: ユーザーが先にページにメッセージを送信している必要がある',
      '個人間メッセージはテストユーザー同士でのみ可能'
    ],
    testData: {
      recipientId: '61578211067618',
      message: 'テストメッセージ',
      accessToken: 'YOUR_ACCESS_TOKEN',
      userId: 'YOUR_USER_ID'
    }
  })
}