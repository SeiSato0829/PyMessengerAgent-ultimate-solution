import { NextRequest, NextResponse } from 'next/server'

/**
 * Webhook経由でメッセージを送信
 * Facebook Webhookと連携してリアルタイム送信
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { recipientId, message } = body

    // Page Access Tokenを取得（環境変数から）
    const PAGE_ACCESS_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN
    const PAGE_ID = process.env.FACEBOOK_PAGE_ID

    if (!PAGE_ACCESS_TOKEN || !PAGE_ID) {
      // Page Access Tokenがない場合、ユーザートークンで試行
      return await sendWithUserToken(recipientId, message)
    }

    // recipientIdの処理
    let processedId = recipientId
    if (recipientId.includes('facebook.com')) {
      const match = recipientId.match(/(?:profile\.php\?id=|facebook\.com\/)([^/?&]+)/)
      if (match) {
        processedId = match[1]
      }
    }

    // Messenger Platform Send API を使用
    const url = `https://graph.facebook.com/v18.0/${PAGE_ID}/messages`

    const payload = {
      recipient: {
        id: processedId  // PSIDまたはユーザーID
      },
      messaging_type: 'MESSAGE_TAG',
      tag: 'CONFIRMED_EVENT_UPDATE', // 24時間外でも送信可能なタグ
      message: {
        text: message,
        metadata: JSON.stringify({
          source: 'pymessenger-agent',
          timestamp: new Date().toISOString()
        })
      }
    }

    console.log('Sending via Webhook/Page API:', { pageId: PAGE_ID, recipientId: processedId })

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PAGE_ACCESS_TOKEN}`
      },
      body: JSON.stringify(payload)
    })

    const data = await response.json()

    if (data.error) {
      console.error('Webhook API Error:', data.error)

      // エラー詳細に基づいて対処
      if (data.error.code === 10) {
        // Permission denied - ユーザーがメッセージをブロックしている
        return NextResponse.json({
          success: false,
          error: 'User has blocked messages or has not interacted with the page',
          suggestion: 'The user needs to initiate conversation first or unblock the page'
        })
      }

      if (data.error.code === 551) {
        // User not reachable
        return await tryHandshakeProtocol(processedId, message, PAGE_ACCESS_TOKEN)
      }

      return NextResponse.json({
        success: false,
        error: data.error.message,
        code: data.error.code
      })
    }

    // 成功
    return NextResponse.json({
      success: true,
      messageId: data.message_id,
      recipientId: data.recipient_id,
      method: 'Webhook/Page API'
    })

  } catch (error: any) {
    console.error('Webhook send error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to send via webhook'
    }, { status: 500 })
  }
}

/**
 * Handshake Protocol - メッセージリクエストとして送信
 */
async function tryHandshakeProtocol(recipientId: string, message: string, token: string) {
  try {
    // Handshake用の特別なエンドポイント
    const url = `https://graph.facebook.com/v18.0/me/message_requests`

    const payload = {
      recipient: {
        user_ref: recipientId  // user_refを使用
      },
      message: {
        text: message,
        quick_replies: [
          {
            content_type: 'text',
            title: '返信する',
            payload: 'REPLY_YES'
          }
        ]
      }
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })

    const data = await response.json()

    if (data.message_id) {
      return NextResponse.json({
        success: true,
        messageId: data.message_id,
        method: 'Handshake Protocol',
        status: 'Sent as message request'
      })
    }

    throw new Error(data.error?.message || 'Handshake failed')

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Handshake protocol failed',
      details: error.message
    })
  }
}

/**
 * ユーザートークンで送信を試行
 */
async function sendWithUserToken(recipientId: string, message: string) {
  try {
    // Instagram Direct APIを使用（Facebook Messengerの代替）
    const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN
    const INSTAGRAM_USER_ID = process.env.INSTAGRAM_USER_ID

    if (!INSTAGRAM_ACCESS_TOKEN) {
      return NextResponse.json({
        success: false,
        error: 'No Page or Instagram token available',
        suggestion: 'Please set up Facebook Page or Instagram Business account'
      })
    }

    // Instagram Direct Message API
    const url = `https://graph.instagram.com/v18.0/${INSTAGRAM_USER_ID}/messages`

    const payload = {
      recipient: {
        username: recipientId  // Instagramユーザー名
      },
      message: {
        text: message
      }
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${INSTAGRAM_ACCESS_TOKEN}`
      },
      body: JSON.stringify(payload)
    })

    const data = await response.json()

    if (data.id) {
      return NextResponse.json({
        success: true,
        messageId: data.id,
        method: 'Instagram Direct Message',
        platform: 'instagram'
      })
    }

    throw new Error(data.error?.message || 'Instagram DM failed')

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'All webhook methods failed',
      details: error.message,
      requirements: [
        'Facebook Page with messaging permissions',
        'Page Access Token with pages_messaging scope',
        'User must have interacted with the page',
        'Or use Instagram Business account for DMs'
      ]
    })
  }
}