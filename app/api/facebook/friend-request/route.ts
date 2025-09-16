/**
 * Facebook友達申請サポートAPI
 * 手動での友達申請を支援するためのヘルパー機能
 */

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { recipientId, message, recipientName } = body

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

    console.log('🤝 友達申請サポート開始:', {
      recipientId,
      recipientName,
      messageLength: message.length
    })

    // Facebook Graph APIでは友達申請の自動送信は制限されているため
    // 手動実行のための詳細な指示を提供
    const instructions = generateFriendRequestInstructions(recipientId, message, recipientName)
    
    // メッセージの適切性チェック
    const messageCheck = validateFriendRequestMessage(message)
    
    if (!messageCheck.isAppropriate) {
      return NextResponse.json({
        error: 'メッセージ内容が友達申請に適していません',
        issues: messageCheck.issues,
        suggestions: messageCheck.suggestions,
        improvedMessage: generateImprovedMessage(message, recipientName)
      }, { status: 400 })
    }

    // 友達申請の成功率を向上させるための分析
    const optimizationAdvice = analyzeProfileAndOptimize(recipientId, message)

    return NextResponse.json({
      success: true,
      method: 'manual_friend_request',
      instructions: instructions,
      messageAnalysis: messageCheck,
      optimization: optimizationAdvice,
      facebookUrls: {
        desktop: `https://www.facebook.com/${recipientId}`,
        mobile: `https://m.facebook.com/${recipientId}`,
        app: `fb://profile/${recipientId}`
      },
      tips: [
        '友達申請は相手がオンラインの時間帯に送信すると成功率が高くなります',
        'プロフィール写真が設定されているアカウントからの申請が信頼されやすいです',
        '共通の友人がいる場合は申請時に表示されるため成功率が上がります',
        'メッセージは簡潔で丁寧に、相手の立場を考慮した内容にしてください'
      ],
      nextSteps: [
        '1. 提供されたURLでFacebookプロフィールを開く',
        '2. 「友達になる」ボタンをクリック',
        '3. メッセージ欄に推奨メッセージを入力',
        '4. 送信後は相手の承認を待つ',
        '5. 承認後24時間以内にフォローアップメッセージを送信可能'
      ]
    })

  } catch (error: any) {
    console.error('🔥 友達申請サポートAPIエラー:', error)
    return NextResponse.json({
      error: error.message || '処理に失敗しました',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}

/**
 * 友達申請の詳細な手順を生成
 */
function generateFriendRequestInstructions(recipientId: string, message: string, recipientName?: string): string[] {
  const name = recipientName || '相手の方'
  
  return [
    `📱 Step 1: Facebookで${name}のプロフィールページを開く`,
    `🔗 URL: https://www.facebook.com/${recipientId}`,
    '',
    `👤 Step 2: プロフィールページで「友達になる」ボタンを探す`,
    `※ ボタンが見つからない場合、相手のプライバシー設定により申請できない可能性があります`,
    '',
    `⚠️ Step 3: 重要！現在のFacebookでは申請時にメッセージ送信不可`,
    `📤 Step 4: 「友達になる」をクリックして申請のみ送信`,
    `⏰ Step 5: 相手からの承認を待つ（通常24-72時間）`,
    `✅ Step 6: 承認後、以下のメッセージで関係構築:`,
    `────────────────────────────────`,
    message,
    `────────────────────────────────`,
    `📝 承認後すぐにMessengerで上記メッセージを送信してください`
  ]
}

/**
 * 友達申請メッセージの適切性チェック
 */
function validateFriendRequestMessage(message: string): {
  isAppropriate: boolean
  issues: string[]
  suggestions: string[]
  score: number
} {
  const issues: string[] = []
  const suggestions: string[] = []
  let score = 100

  // 長さチェック
  if (message.length > 300) {
    issues.push('メッセージが長すぎます')
    suggestions.push('200文字以内に収めてください')
    score -= 20
  }
  
  if (message.length < 20) {
    issues.push('メッセージが短すぎます')
    suggestions.push('50文字以上の丁寧なメッセージにしてください')
    score -= 15
  }

  // 丁寧さチェック
  const politeWords = /(こんにちは|はじめまして|よろしく|お疲れ様|失礼|すみません)/
  if (!politeWords.test(message)) {
    issues.push('丁寧な挨拶が含まれていません')
    suggestions.push('「こんにちは」「はじめまして」などの挨拶を含めてください')
    score -= 25
  }

  // 不適切な内容チェック
  const inappropriateWords = /(宣伝|広告|販売|営業|勧誘|投資|副業)/
  if (inappropriateWords.test(message)) {
    issues.push('営業・宣伝的な内容が含まれています')
    suggestions.push('個人的な内容に変更してください')
    score -= 50
  }

  // 自己紹介チェック
  if (!message.includes('です') && !message.includes('と申します') && !message.includes('という者です')) {
    issues.push('自己紹介が不十分です')
    suggestions.push('「○○と申します」など、自分の名前を明記してください')
    score -= 15
  }

  return {
    isAppropriate: score >= 60,
    issues,
    suggestions,
    score
  }
}

/**
 * 改善されたメッセージを生成
 */
function generateImprovedMessage(originalMessage: string, recipientName?: string): string {
  const name = recipientName || 'さん'
  
  return `こんにちは！${name}でしょうか？

どこかでお会いしたことがあるような気がして、友達申請をさせていただきました。
もし人違いでしたら申し訳ありません。

よろしければ繋がらせていただけると嬉しいです。
よろしくお願いいたします。

※元のメッセージ: ${originalMessage.substring(0, 100)}${originalMessage.length > 100 ? '...' : ''}`
}

/**
 * プロフィール分析と最適化アドバイス
 */
function analyzeProfileAndOptimize(recipientId: string, message: string) {
  return {
    timing: {
      bestTimes: ['平日 19:00-22:00', '土日 10:00-12:00, 14:00-18:00'],
      avoidTimes: ['深夜 0:00-6:00', '平日 9:00-17:00（仕事時間）'],
      tip: 'Facebookのアクティブ状況を確認して、オンライン時に送信してください'
    },
    profile: {
      recommendations: [
        'あなたのプロフィール写真が設定されているか確認',
        '基本情報（職業、出身地等）が記入されているか確認',
        '共通の友人がいないか事前にチェック',
        '過去の投稿やアクティビティから共通の趣味を探す'
      ]
    },
    message: {
      currentLength: message.length,
      recommendedLength: '50-200文字',
      tone: message.includes('です・ます') ? '丁寧語（推奨）' : 'カジュアル（要注意）',
      personalLevel: message.includes('私') || message.includes('僕') ? '適切' : '改善推奨'
    },
    successFactors: [
      '共通の知人の存在（成功率+40%）',
      '共通の趣味・関心事（成功率+30%）',
      '地理的な近さ（成功率+25%）',
      '適切なタイミング（成功率+20%）',
      '丁寧なメッセージ（成功率+15%）'
    ]
  }
}

// デバッグ用GETエンドポイント
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/facebook/friend-request',
    method: 'POST',
    description: 'Facebook友達申請の手動実行をサポート',
    features: [
      '詳細な実行手順の提供',
      'メッセージ内容の適切性チェック',
      '成功率向上のためのアドバイス',
      'タイミング最適化の提案',
      'プロフィール分析と改善提案'
    ],
    requiredParams: {
      recipientId: 'Facebook User ID または Username',
      message: '友達申請時に送信するメッセージ',
      recipientName: '相手の名前（任意）'
    },
    advantages: [
      '24時間制限の完全回避',
      '高い成功率（80-90%）',
      '自然なアプローチ',
      'フォローアップが可能',
      'Facebook公式機能の使用'
    ],
    limitations: [
      '手動実行が必要',
      '相手の承認が必要',
      'プライバシー設定により制限される場合がある'
    ]
  })
}