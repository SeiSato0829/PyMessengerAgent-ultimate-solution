/**
 * 直接Messengerを開くAPI
 * FacebookのWeb UIと同じ動作を再現
 */

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { recipientId, message } = body

    if (!recipientId) {
      return NextResponse.json({
        error: '受信者IDが必要です'
      }, { status: 400 })
    }

    // 受信者IDの処理
    let processedRecipientId = recipientId
    
    // FacebookプロフィールURLからIDを抽出
    if (recipientId.includes('facebook.com') || recipientId.includes('fb.com')) {
      const patterns = [
        /facebook\.com\/profile\.php\?id=(\d+)/,
        /facebook\.com\/([^/?&\s]+)/,
        /fb\.com\/([^/?&\s]+)/
      ]
      
      for (const pattern of patterns) {
        const match = recipientId.match(pattern)
        if (match && match[1]) {
          processedRecipientId = match[1]
          break
        }
      }
    }

    // 複数のMessenger URLを生成
    const urls = {
      // Primary: Facebook Messages (Web)
      primary: `https://www.facebook.com/messages/t/${processedRecipientId}`,
      
      // Secondary: m.me redirect
      secondary: `https://m.me/${processedRecipientId}`,
      
      // Tertiary: Facebook direct
      tertiary: `https://facebook.com/messages/t/${processedRecipientId}`,
      
      // Mobile app
      mobile: `fb-messenger://user/${processedRecipientId}`,
      
      // WhatsApp style
      whatsapp: `https://wa.me/${processedRecipientId}`
    }

    // メッセージ付きURLも生成
    if (message) {
      const encodedMessage = encodeURIComponent(message)
      urls.primaryWithMessage = `${urls.primary}?text=${encodedMessage}`
      urls.secondaryWithMessage = `${urls.secondary}?text=${encodedMessage}`
    }

    return NextResponse.json({
      success: true,
      recipientId: processedRecipientId,
      originalInput: recipientId,
      message,
      urls,
      instructions: {
        title: '✅ Messenger起動準備完了',
        method: 'ブラウザで新しいウィンドウが開きます',
        steps: [
          '1. 複数のMessengerウィンドウが開きます',
          '2. どれかでメッセージ送信画面が表示されます',
          '3. メッセージを入力して送信してください',
          '4. メッセージリクエストとして相手に届きます'
        ],
        tips: [
          '💡 メッセージが自動でクリップボードにコピーされます',
          '💡 複数のウィンドウから適切なものを選んでください',
          '💡 モバイルの場合はMessengerアプリも起動します'
        ]
      },
      info: {
        status: 'Messenger URLを生成しました',
        description: 'Web UIと同じ方法でメッセージを送信できます',
        compatibility: 'PC・モバイル両対応',
        reliability: '高い成功率を実現'
      }
    })

  } catch (error: any) {
    console.error('🔥 Direct Messenger API エラー:', error)
    
    return NextResponse.json({
      error: error.message || 'Messenger起動に失敗しました',
      details: '複数の起動方法を試してください'
    }, { status: 500 })
  }
}

// GET - API情報
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/messages/direct-messenger',
    method: 'POST',
    description: 'Facebook MessengerをWeb UIと同じ方法で起動',
    features: [
      '✅ 複数のMessenger起動方法',
      '✅ Facebook URL自動解析',
      '✅ メッセージ自動コピー',
      '✅ モバイル・PC両対応',
      '✅ 高い成功率'
    ],
    requiredParams: {
      recipientId: 'Facebook User IDまたはプロフィールURL'
    },
    optionalParams: {
      message: 'メッセージ内容（クリップボードにコピーされます）'
    },
    example: {
      request: {
        recipientId: 'https://facebook.com/profile.php?id=100012345678901',
        message: 'こんにちは！'
      },
      response: {
        success: true,
        urls: {
          primary: 'https://www.facebook.com/messages/t/100012345678901',
          secondary: 'https://m.me/100012345678901',
          mobile: 'fb-messenger://user/100012345678901'
        }
      }
    }
  })
}