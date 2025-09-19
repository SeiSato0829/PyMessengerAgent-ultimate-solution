import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { recipientId, message } = await request.json()

    if (!recipientId || !message) {
      return NextResponse.json(
        { error: 'Recipient ID and message are required' },
        { status: 400 }
      )
    }

    // Webhook URLが設定されている場合
    const webhookUrl = process.env.FACEBOOK_WEBHOOK_URL

    if (webhookUrl) {
      try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Hub-Signature': 'sha1=' + generateSignature(JSON.stringify({ recipientId, message }))
          },
          body: JSON.stringify({
            object: 'page',
            entry: [{
              messaging: [{
                sender: { id: 'system' },
                recipient: { id: recipientId },
                message: { text: message },
                timestamp: Date.now()
              }]
            }]
          })
        })

        if (response.ok) {
          return NextResponse.json({
            success: true,
            message: 'Webhook sent successfully'
          })
        }
      } catch (error) {
        console.error('Webhook error:', error)
      }
    }

    // Webhook失敗時は代替方法を提案
    return NextResponse.json({
      success: false,
      message: 'Webhook not configured or failed',
      alternative: `https://m.me/${recipientId}?text=${encodeURIComponent(message)}`
    })

  } catch (error) {
    console.error('Send webhook error:', error)
    return NextResponse.json(
      { error: 'Failed to send webhook' },
      { status: 500 }
    )
  }
}

function generateSignature(payload: string): string {
  const crypto = require('crypto')
  const secret = process.env.FACEBOOK_APP_SECRET || 'ae554f1df345416e5d6d08c22d07685d'
  return crypto.createHmac('sha1', secret).update(payload).digest('hex')
}