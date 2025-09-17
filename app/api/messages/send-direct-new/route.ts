/**
 * 友達じゃない人への直接メッセージ送信API
 * デモモード対応版
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

    // デモモード判定
    const isDemoMode = !token || token === ''

    if (isDemoMode) {
      console.log('📌 デモモード: メッセージ送信シミュレーション')
      
      // デモモードでの動作（シミュレーション）
      const demoResponse = {
        success: true,
        demoMode: true,
        messageId: `demo_${Date.now()}`,
        recipientId: recipientId,
        timestamp: new Date().toISOString(),
        info: {
          status: '【デモモード】メッセージが送信されました',
          description: 'これはデモ動作です。実際の送信には以下が必要です：',
          requirements: [
            '1. Facebook App ID と App Secret の設定',
            '2. Facebook User Access Token の取得',
            '3. 環境変数への設定'
          ],
          actualMessage: {
            to: recipientId,
            content: message,
            wouldBeSentAs: 'メッセージリクエスト'
          },
          howToSetup: {
            step1: 'developers.facebook.com でアプリを作成',
            step2: 'Messenger APIを有効化',
            step3: 'アクセストークンを取得',
            step4: 'Render.comの環境変数に設定'
          }
        }
      }
      
      // デモモードでも成功レスポンスを返す
      return NextResponse.json(demoResponse)
    }

    console.log('📤 実際のメッセージ送信開始:', {
      recipientId,
      messageLength: message.length,
      timestamp: new Date().toISOString()
    })

    // 実際のFacebook API呼び出し（本番モード）
    const apiVersion = 'v18.0'
    const sendUrl = `https://graph.facebook.com/${apiVersion}/me/messages`
    
    const payload = {
      recipient: {
        id: recipientId
      },
      message: {
        text: message
      },
      messaging_type: 'RESPONSE'
    }

    console.log('📡 Send API呼び出し:', {
      url: sendUrl,
      recipientId
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
      return NextResponse.json({
        error: 'メッセージ送信に失敗しました',
        details: responseData.error,
        suggestion: {
          title: 'エラーの解決方法',
          options: [
            'アクセストークンの有効期限を確認',
            '受信者IDが正しいか確認',
            'Facebook APIの権限を確認'
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
        description: '相手がメッセージリクエストを承認すると会話が開始されます'
      }
    })

  } catch (error: any) {
    console.error('🔥 直接送信APIエラー:', error)
    
    return NextResponse.json({
      error: error.message || '送信に失敗しました',
      demoMode: true,
      suggestion: {
        title: 'デモモードの制限',
        message: '現在デモモードで動作しています。実際のメッセージ送信には設定が必要です。',
        steps: [
          '1. Facebook開発者アカウントを作成',
          '2. Messengerアプリを設定',
          '3. アクセストークンを取得',
          '4. 環境変数に設定'
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
    status: 'デモモード動作中',
    
    demoMode: {
      active: true,
      reason: '環境変数 FACEBOOK_USER_ACCESS_TOKEN が未設定',
      behavior: 'メッセージ送信をシミュレートして成功レスポンスを返します'
    },
    
    requiredParams: {
      recipientId: 'Facebook User ID（必須）',
      message: 'メッセージ内容（必須）',
      accessToken: 'User Access Token（オプション）'
    },
    
    setupGuide: {
      title: '実際に使用するための設定方法',
      steps: [
        '1. https://developers.facebook.com にアクセス',
        '2. 新しいアプリを作成',
        '3. Messenger Product を追加',
        '4. テストユーザーを作成',
        '5. User Access Token を生成',
        '6. Render.comで環境変数を設定'
      ]
    },
    
    currentStatus: {
      mode: 'DEMO',
      canSendActualMessages: false,
      simulatesSuccess: true
    }
  })
}