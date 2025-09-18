/**
 * Conversations API を使用したメッセージ送信
 * メッセージリクエストとして送信を試みる
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

    // 受信者IDの処理
    let processedRecipientId = recipientId
    
    // FacebookプロフィールURLからIDを抽出
    if (recipientId.includes('facebook.com') || recipientId.includes('fb.com')) {
      const patterns = [
        /facebook\.com\/profile\.php\?id=(\d+)/,
        /facebook\.com\/([^/?\s]+)/,
        /fb\.com\/([^/?\s]+)/
      ]
      
      for (const pattern of patterns) {
        const match = recipientId.match(pattern)
        if (match && match[1]) {
          processedRecipientId = match[1]
          console.log('📝 URLからID抽出:', recipientId, '=>', processedRecipientId)
          break
        }
      }
    }

    // アクセストークンの取得
    const token = accessToken || process.env.FACEBOOK_USER_ACCESS_TOKEN

    if (!token) {
      return NextResponse.json({
        error: 'アクセストークンが必要です',
        details: 'Facebook認証を完了してください'
      }, { status: 401 })
    }

    console.log('📤 Conversations API送信開始:', {
      recipientId: processedRecipientId,
      messageLength: message.length
    })

    // 方法1: Thread API を使用（メッセージスレッド作成）
    const threadUrl = `https://graph.facebook.com/v19.0/me/threads`
    
    const threadPayload = {
      recipient: processedRecipientId,
      message: message
    }

    let response = await fetch(threadUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(threadPayload)
    })

    let responseData = await response.json()
    
    // Thread APIが失敗した場合、Direct Message APIを試す
    if (!response.ok) {
      console.log('🔄 方法2: Direct Message APIを試します')
      
      // Facebook Messenger Direct API
      const dmUrl = `https://graph.facebook.com/v19.0/me/messages`
      
      const dmPayload = {
        recipient: {
          id: processedRecipientId
        },
        message: {
          text: message,
          metadata: 'MESSAGE_REQUEST'  // メッセージリクエストとして明示
        },
        messaging_type: 'NON_PROMOTIONAL_SUBSCRIPTION'  // 非プロモーション購読
      }

      response = await fetch(dmUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(dmPayload)
      })

      responseData = await response.json()
    }

    // それでも失敗した場合、Webhook方式を試す
    if (!response.ok) {
      console.log('🔄 方法3: Webhook送信を試します')
      
      // Facebook Webhook API（メッセージリクエストとして）
      const webhookUrl = `https://graph.facebook.com/v19.0/${processedRecipientId}/messages`
      
      const webhookPayload = {
        message: message,
        access_token: token
      }

      response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams(webhookPayload)
      })

      responseData = await response.json()
    }

    if (!response.ok) {
      console.error('❌ 全ての送信方法が失敗:', responseData)
      
      // より詳細なエラーメッセージ
      let errorMessage = 'メッセージ送信に失敗しました'
      
      if (responseData.error?.message) {
        if (responseData.error.message.includes('permissions')) {
          errorMessage = 'メッセージ送信権限がありません。Facebook Webサイトから手動で送信する必要があります。'
        } else {
          errorMessage = responseData.error.message
        }
      }

      return NextResponse.json({
        error: errorMessage,
        details: responseData.error,
        alternativeMethod: {
          title: '代替方法',
          description: 'Facebook Webサイトでメッセージボタンをクリックすることで送信可能です',
          url: `https://www.facebook.com/messages/t/${processedRecipientId}`
        }
      }, { status: 400 })
    }

    // 成功
    return NextResponse.json({
      success: true,
      messageId: responseData.message_id || responseData.id,
      recipientId: processedRecipientId,
      timestamp: new Date().toISOString(),
      info: {
        status: 'メッセージリクエストとして送信されました',
        description: '相手のメッセージリクエストフォルダに届きます'
      }
    })

  } catch (error: any) {
    console.error('🔥 Conversations APIエラー:', error)
    
    return NextResponse.json({
      error: error.message || '送信に失敗しました',
      details: '予期しないエラーが発生しました'
    }, { status: 500 })
  }
}