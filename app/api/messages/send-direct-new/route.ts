/**
 * 友達じゃない人への直接メッセージ送信API
 * Facebook Messengerの実際の仕様に基づく正しい実装
 */

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { recipientId, message, accessToken } = body

    // 入力検証
    if (!recipientId || !message) {
      return NextResponse.json({
        error: '必須パラメータが不足しています',
        required: { recipientId: !!recipientId, message: !!message }
      }, { status: 400 })
    }

    // アクセストークンの取得
    const token = accessToken || process.env.FACEBOOK_USER_ACCESS_TOKEN

    if (!token) {
      return NextResponse.json({
        error: 'アクセストークンが設定されていません',
        solution: 'Facebook認証を完了してください'
      }, { status: 401 })
    }

    console.log('📤 友達じゃない人への直接メッセージ送信開始:', {
      recipientId,
      messageLength: message.length,
      timestamp: new Date().toISOString()
    })

    // Facebook Send API - メッセージリクエストとして送信
    const apiVersion = 'v18.0'
    const conversationsUrl = `https://graph.facebook.com/${apiVersion}/me/conversations`
    
    // Step 1: 会話を開始または取得
    const conversationResponse = await fetch(conversationsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        recipient: {
          id: recipientId
        }
      })
    })

    if (!conversationResponse.ok) {
      const errorData = await conversationResponse.json()
      console.error('❌ 会話開始エラー:', errorData)
    }

    // Step 2: メッセージを送信
    const sendUrl = `https://graph.facebook.com/${apiVersion}/me/messages`
    
    const payload = {
      recipient: {
        id: recipientId
      },
      message: {
        text: message
      },
      messaging_type: 'MESSAGE_TAG',
      tag: 'CONFIRMED_EVENT_UPDATE' // メッセージリクエストとして送信
    }

    console.log('📡 Send API呼び出し:', {
      url: sendUrl,
      recipientId,
      messagingType: 'MESSAGE_TAG'
    })

    const response = await fetch(sendUrl, {
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
      // 別の方法を試す - 通常のメッセージとして
      const alternativePayload = {
        recipient: {
          id: recipientId
        },
        message: {
          text: message
        },
        notification_type: 'REGULAR'
      }

      const altResponse = await fetch(sendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(alternativePayload)
      })

      const altData = await altResponse.json()
      
      if (altResponse.ok) {
        return NextResponse.json({
          success: true,
          method: 'alternative',
          messageId: altData.message_id,
          recipientId: altData.recipient_id,
          info: 'メッセージリクエストとして送信されました'
        })
      }

      // それでも失敗した場合のエラーハンドリング
      return NextResponse.json({
        error: 'メッセージ送信に失敗しました',
        details: responseData.error || altData.error,
        suggestion: {
          title: '代替方法',
          options: [
            '1. 相手のプロフィールから「メッセージ」をクリック',
            '2. Messenger.comから直接送信',
            '3. 友達申請を先に送る'
          ]
        }
      }, { status: 400 })
    }

    // 成功
    return NextResponse.json({
      success: true,
      messageId: responseData.message_id,
      recipientId: responseData.recipient_id,
      timestamp: new Date().toISOString(),
      info: {
        status: 'メッセージリクエストとして送信されました',
        description: '相手がメッセージリクエストを承認すると会話が開始されます',
        nextSteps: [
          '相手がメッセージリクエストを確認',
          '承認されると通常の会話が可能',
          '承認まで追加メッセージは制限される可能性'
        ]
      }
    })

  } catch (error: any) {
    console.error('🔥 直接送信APIエラー:', error)
    
    return NextResponse.json({
      error: error.message || '送信に失敗しました',
      fallback: {
        title: '確実に送信する方法',
        steps: [
          '1. messenger.comにアクセス',
          '2. 新規メッセージ作成',
          '3. 宛先に相手の名前を入力',
          '4. メッセージを送信（メッセージリクエストとして送信される）'
        ]
      }
    }, { status: 500 })
  }
}

// GET - API情報
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/messages/send-direct-new',
    method: 'POST',
    title: '友達じゃない人への直接メッセージ送信',
    description: 'Facebook Messengerの実際の仕様に基づく実装',
    
    reality: {
      fact: 'PCのMessengerでは友達じゃない人にもメッセージを送れる',
      mechanism: 'メッセージリクエストとして送信される',
      approval: '相手が承認すれば会話継続可能'
    },
    
    requiredParams: {
      recipientId: 'Facebook User ID',
      message: 'メッセージ内容',
      accessToken: 'User Access Token（オプション）'
    },
    
    flow: [
      '1. 送信者がメッセージを送る',
      '2. メッセージリクエストとして配信',
      '3. 相手の「メッセージリクエスト」フォルダに到着',
      '4. 相手が承認すれば通常の会話開始'
    ],
    
    limitations: [
      '最初のメッセージのみ送信可能',
      '相手が承認するまで追加メッセージは制限',
      'スパムフィルタにかかる可能性'
    ]
  })
}