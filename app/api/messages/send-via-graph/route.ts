import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

/**
 * Facebook Graph API経由でメッセージを送信
 * Messenger Platform APIを使用
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { recipientId, message } = body

    // クッキーからアクセストークンを取得
    const cookieStore = cookies()
    const accessToken = cookieStore.get('fb_access_token')?.value

    if (!accessToken) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated. Please login with Facebook first.'
      }, { status: 401 })
    }

    // recipientIdの処理（URLから抽出）
    let processedId = recipientId
    if (recipientId.includes('facebook.com')) {
      const match = recipientId.match(/(?:profile\.php\?id=|facebook\.com\/)([^/?&]+)/)
      if (match) {
        processedId = match[1]
      }
    }

    // 方法1: Send APIを使用（Page Access Tokenが必要）
    const sendApiUrl = `https://graph.facebook.com/v18.0/me/messages`

    const messageData = {
      recipient: {
        id: processedId
      },
      message: {
        text: message
      },
      messaging_type: 'UPDATE' // または 'RESPONSE', 'MESSAGE_TAG'
    }

    console.log('Sending message via Graph API:', { recipientId: processedId })

    const response = await fetch(sendApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...messageData,
        access_token: accessToken
      })
    })

    const data = await response.json()

    if (data.error) {
      console.error('Graph API Error:', data.error)

      // エラーに応じた詳細な対応
      if (data.error.code === 190) {
        return NextResponse.json({
          success: false,
          error: 'Invalid access token. Please re-authenticate.',
          details: data.error
        })
      }

      if (data.error.code === 200) {
        // 権限不足の場合、別の方法を試す
        return await tryAlternativeMethod(processedId, message, accessToken)
      }

      return NextResponse.json({
        success: false,
        error: data.error.message,
        details: data.error
      })
    }

    return NextResponse.json({
      success: true,
      messageId: data.message_id,
      recipientId: data.recipient_id,
      method: 'Graph API Send'
    })

  } catch (error: any) {
    console.error('Send via Graph API error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to send message via Graph API'
    }, { status: 500 })
  }
}

/**
 * 代替方法：Conversation APIを使用
 */
async function tryAlternativeMethod(recipientId: string, message: string, accessToken: string) {
  try {
    // まずユーザーとの会話IDを取得
    const conversationsUrl = `https://graph.facebook.com/v18.0/me/conversations?access_token=${accessToken}`
    const convResponse = await fetch(conversationsUrl)
    const convData = await convResponse.json()

    if (convData.error) {
      throw new Error(convData.error.message)
    }

    // 既存の会話を探す
    const conversation = convData.data?.find((conv: any) =>
      conv.participants?.data?.some((p: any) => p.id === recipientId)
    )

    if (conversation) {
      // 既存の会話にメッセージを送信
      const sendUrl = `https://graph.facebook.com/v18.0/${conversation.id}/messages`
      const sendResponse = await fetch(sendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          access_token: accessToken
        })
      })

      const sendData = await sendResponse.json()

      if (sendData.id) {
        return NextResponse.json({
          success: true,
          messageId: sendData.id,
          method: 'Conversation API'
        })
      }
    }

    // 新しい会話を開始
    const threadUrl = `https://graph.facebook.com/v18.0/me/threads`
    const threadResponse = await fetch(threadUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipient: recipientId,
        message: message,
        access_token: accessToken
      })
    })

    const threadData = await threadResponse.json()

    if (threadData.thread_id) {
      return NextResponse.json({
        success: true,
        threadId: threadData.thread_id,
        method: 'Thread API'
      })
    }

    throw new Error('All Graph API methods failed')

  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Alternative method failed',
      suggestion: 'Graph API requires Page Access Token with messaging permissions. Consider using Puppeteer method.'
    })
  }
}