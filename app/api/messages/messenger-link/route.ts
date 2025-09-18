/**
 * Messenger Linkを生成するAPI
 * Webサイトと同じ動作を再現
 */

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { recipientId, message } = body

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
          break
        }
      }
    }

    // Messenger URLを生成（Webサイトと同じ方式）
    const messengerUrl = `https://www.facebook.com/messages/t/${processedRecipientId}`
    const mobileUrl = `fb-messenger://user/${processedRecipientId}`
    
    // メッセージを含むURLを生成
    const messageParam = message ? `?text=${encodeURIComponent(message)}` : ''
    
    return NextResponse.json({
      success: true,
      messengerUrls: {
        web: `${messengerUrl}${messageParam}`,
        mobile: mobileUrl,
        direct: `https://m.me/${processedRecipientId}${messageParam}`
      },
      instructions: {
        title: 'メッセージ送信方法',
        steps: [
          '1. 上記のURLをクリック',
          '2. Messengerが開きます',
          '3. メッセージを送信',
          '4. メッセージリクエストとして相手に届きます'
        ]
      },
      info: {
        status: 'Messenger URLを生成しました',
        description: 'このリンクを使用して、Webサイトと同じようにメッセージを送信できます'
      }
    })

  } catch (error: any) {
    console.error('🔥 Messenger Link生成エラー:', error)
    
    return NextResponse.json({
      error: error.message || 'URL生成に失敗しました'
    }, { status: 500 })
  }
}

// GET - Messenger Link情報
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/messages/messenger-link',
    method: 'POST',
    description: 'Facebook MessengerのWebリンクを生成',
    requiredParams: {
      recipientId: 'Facebook User IDまたはプロフィールURL',
      message: 'メッセージ内容（オプション）'
    },
    example: {
      request: {
        recipientId: 'https://facebook.com/profile.php?id=100012345678901',
        message: 'こんにちは！'
      },
      response: {
        messengerUrls: {
          web: 'https://www.facebook.com/messages/t/100012345678901?text=こんにちは！',
          mobile: 'fb-messenger://user/100012345678901',
          direct: 'https://m.me/100012345678901?text=こんにちは！'
        }
      }
    }
  })
}