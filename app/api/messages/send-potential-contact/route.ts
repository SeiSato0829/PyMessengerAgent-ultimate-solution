/**
 * 知り合い候補への丁寧な初回連絡API
 * 適切で礼儀正しい連絡を行うための専用エンドポイント
 */

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { recipientId, message, contactInfo } = body

    // 入力検証
    if (!recipientId || !message) {
      return NextResponse.json({
        error: '必須パラメータが不足しています',
        details: {
          recipientId: !!recipientId,
          message: !!message
        }
      }, { status: 400 })
    }

    // メッセージ内容の適切性チェック
    const isPoliteMessage = checkMessagePoliteness(message)
    if (!isPoliteMessage.isPolite) {
      return NextResponse.json({
        error: 'メッセージ内容が適切ではありません',
        suggestions: isPoliteMessage.suggestions,
        originalMessage: message
      }, { status: 400 })
    }

    // Page Access Tokenの取得
    const pageAccessToken = process.env.PAGE_ACCESS_TOKEN

    if (!pageAccessToken) {
      return NextResponse.json({
        error: 'Page Access Tokenが設定されていません',
        setup: [
          '1. Facebook Pageを作成してください',
          '2. 開発者ダッシュボードでPage Access Tokenを取得',
          '3. PAGE_ACCESS_TOKEN環境変数を設定'
        ]
      }, { status: 400 })
    }

    console.log('🤝 知り合い候補への丁寧な連絡開始:', {
      recipientId,
      contactName: contactInfo?.name,
      source: contactInfo?.source,
      confidence: contactInfo?.confidence,
      messageLength: message.length
    })

    // 丁寧な初回連絡専用のペイロード
    const payload = {
      recipient: { 
        id: recipientId 
      },
      message: { 
        text: message 
      },
      messaging_type: 'MESSAGE_TAG', // 初回連絡の場合
      tag: 'HUMAN_AGENT' // 人間が送信していることを明示
    }

    // Facebook Graph API呼び出し
    const apiVersion = 'v18.0'
    const url = `https://graph.facebook.com/${apiVersion}/me/messages`

    console.log('📡 Facebook API呼び出し（丁寧な初回連絡）')
    console.log('📦 ペイロード:', JSON.stringify(payload, null, 2))

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${pageAccessToken}`
      },
      body: JSON.stringify(payload)
    })

    const responseData = await response.json()
    console.log('📥 API応答:', responseData)

    if (!response.ok) {
      console.error('❌ Facebook APIエラー:', responseData)
      
      const errorMessage = responseData.error?.message || 'メッセージ送信に失敗しました'
      const errorCode = responseData.error?.code
      
      // 24時間ポリシー対応
      if (errorCode === 10 && errorMessage.includes('24 hour')) {
        return NextResponse.json({
          error: '24時間ポリシー制限',
          solution: {
            title: '初回連絡の場合の解決方法',
            steps: [
              '1. 相手の方に「まずあなたのPageにメッセージを送ってもらう」',
              '2. 相手からメッセージが届いてから24時間以内に返信',
              '3. または別の方法（友達申請等）で最初のコンタクトを取る'
            ]
          },
          alternatives: [
            'Facebook友達申請を送る',
            'LinkedIn等他のプラットフォームでコンタクト',
            '共通の知人に紹介を依頼'
          ]
        }, { status: 403 })
      }

      // 権限不足
      if (errorCode === 200 && errorMessage.includes('permission')) {
        return NextResponse.json({
          error: '送信権限がありません',
          solution: {
            title: '権限設定の確認',
            steps: [
              '1. Facebook開発者ダッシュボードで権限を確認',
              '2. pages_messaging権限が有効か確認',
              '3. Page Access Tokenが正しいか確認'
            ]
          }
        }, { status: 403 })
      }

      return NextResponse.json({
        error: errorMessage,
        details: responseData.error,
        alternatives: [
          '別のコンタクト方法を検討してください',
          '相手からの先制メッセージを待つ',
          '共通の知人を通じて連絡を取る'
        ]
      }, { status: response.status })
    }

    // 送信成功
    console.log('✅ 丁寧な初回連絡送信成功:', {
      messageId: responseData.message_id,
      recipientId: responseData.recipient_id,
      contactInfo
    })

    // 送信記録を保存（ログ用）
    await logPotentialContactMessage({
      messageId: responseData.message_id,
      recipientId,
      message,
      contactInfo,
      timestamp: new Date().toISOString(),
      success: true
    })

    return NextResponse.json({
      success: true,
      messageId: responseData.message_id,
      recipientId: responseData.recipient_id,
      timestamp: new Date().toISOString(),
      contactInfo,
      advice: {
        title: '次のステップ',
        steps: [
          '相手からの返信を待ちましょう',
          '返信がない場合は追加のメッセージは避けてください',
          '相手の都合を尊重することが大切です'
        ]
      },
      debug: {
        apiVersion,
        messagingType: 'MESSAGE_TAG',
        tag: 'HUMAN_AGENT'
      }
    })

  } catch (error: any) {
    console.error('🔥 知り合い候補連絡APIエラー:', error)
    
    await logPotentialContactMessage({
      recipientId: request.url,
      message: 'ERROR',
      contactInfo: null,
      timestamp: new Date().toISOString(),
      success: false,
      error: error.message
    })

    return NextResponse.json({
      error: error.message || '送信に失敗しました',
      advice: '別の連絡方法を検討することをお勧めします',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}

/**
 * メッセージの丁寧さをチェック
 */
function checkMessagePoliteness(message: string): { isPolite: boolean; suggestions: string[] } {
  const suggestions: string[] = []
  let isPolite = true

  // 必須の礼儀要素チェック
  const politeElements = [
    { pattern: /(こんにちは|おはよう|こんばんは|はじめまして)/, name: '挨拶' },
    { pattern: /(すみません|失礼|恐縮|申し訳)/, name: '謝罪・配慮' },
    { pattern: /(でしょうか|かと思い|かもしれ)/, name: '謙遜表現' }
  ]

  politeElements.forEach(element => {
    if (!element.pattern.test(message)) {
      suggestions.push(`${element.name}を含めることを推奨します`)
    }
  })

  // 不適切な要素チェック
  const inappropriateElements = [
    { pattern: /(宣伝|広告|販売|営業|ビジネス)/, name: '営業的内容' },
    { pattern: /(絶対|必ず|今すぐ|急い)/, name: '強制的な表現' },
    { pattern: /[!！]{2,}/, name: '過度な感嘆符' }
  ]

  inappropriateElements.forEach(element => {
    if (element.pattern.test(message)) {
      isPolite = false
      suggestions.push(`${element.name}は避けてください`)
    }
  })

  return { isPolite, suggestions }
}

/**
 * 送信記録のログ保存
 */
async function logPotentialContactMessage(data: any) {
  try {
    // 実際のプロダクションではデータベースに保存
    console.log('📊 送信記録:', JSON.stringify(data, null, 2))
  } catch (error) {
    console.error('ログ保存エラー:', error)
  }
}

// デバッグ用GETエンドポイント
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/messages/send-potential-contact',
    method: 'POST',
    description: '知り合い候補への丁寧で適切な初回連絡専用API',
    features: [
      '自動的な丁寧さチェック',
      '適切な messaging_type 使用',
      '24時間ポリシー対応',
      '送信記録の自動ログ',
      '相手への配慮アドバイス'
    ],
    requiredParams: {
      recipientId: 'Facebook User ID',
      message: '丁寧で適切なメッセージ内容',
      contactInfo: {
        name: '相手の名前',
        source: '知り合った場面 (school/work/mutual/event/general)',
        confidence: '確信度 (high/medium/low)',
        notes: 'メモ（任意）'
      }
    },
    guidelines: [
      '相手の立場を尊重する',
      '一方的にならない',
      '返信を強要しない',
      '失礼のない丁寧な言葉遣い',
      '人違いの可能性も考慮'
    ],
    examples: {
      school: '学校で一緒だった可能性がある方への連絡',
      work: '元同僚の可能性がある方への連絡',
      mutual: '共通の知人がいる方への連絡',
      event: 'イベントで会った可能性がある方への連絡',
      general: '一般的な知り合いかもしれない方への連絡'
    }
  })
}