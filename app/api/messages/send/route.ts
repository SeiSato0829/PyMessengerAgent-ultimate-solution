import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { recipientId, message, method } = await request.json()

    if (!recipientId || !message) {
      return NextResponse.json(
        { error: 'Recipient ID and message are required' },
        { status: 400 }
      )
    }

    // Facebook Graph APIを使用したメッセージ送信
    if (method === 'graph_api') {
      const accessToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN

      if (!accessToken) {
        // アクセストークンがない場合でもエラーを返さず、代替方法を提案
        return NextResponse.json({
          success: false,
          message: 'Graph API token not configured. Please use Direct Link method.',
          alternative: `https://m.me/${recipientId}`
        })
      }

      try {
        const response = await fetch(
          `https://graph.facebook.com/v18.0/me/messages`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messaging_type: 'RESPONSE',
              recipient: { id: recipientId },
              message: { text: message },
              access_token: accessToken
            })
          }
        )

        const data = await response.json()

        if (response.ok) {
          return NextResponse.json({
            success: true,
            message: 'Message sent successfully via Graph API',
            data
          })
        } else {
          return NextResponse.json({
            success: false,
            message: 'Graph API error',
            error: data.error,
            alternative: `https://m.me/${recipientId}`
          })
        }
      } catch (error) {
        return NextResponse.json({
          success: false,
          message: `API call failed: ${error}`,
          alternative: `https://m.me/${recipientId}`
        })
      }
    }

    // デフォルト：Direct Link URLを返す
    return NextResponse.json({
      success: true,
      message: 'Direct link generated',
      url: `https://m.me/${recipientId}?text=${encodeURIComponent(message)}`,
      method: 'direct_link'
    })

  } catch (error) {
    console.error('Send message error:', error)
    return NextResponse.json(
      { error: 'Failed to process message request' },
      { status: 500 }
    )
  }
}