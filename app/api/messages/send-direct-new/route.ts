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

    // 受信者IDの検証とURL解析
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
    
    // 抽出後のID検証
    if (!processedRecipientId || processedRecipientId.length < 3) {
      return NextResponse.json({
        error: '有効なFacebook IDまたはプロフィールURLを入力してください',
        example: '例: 100012345678901 または https://facebook.com/profile.php?id=100012345678901',
        receivedValue: recipientId,
        processedValue: processedRecipientId
      }, { status: 400 })
    }

    // アクセストークンの取得（クライアントから送信されたトークンを優先）
    const token = accessToken || process.env.FACEBOOK_USER_ACCESS_TOKEN

    // デモモード判定を無効化（常に本番モード）
    const isDemoMode = false

    // アクセストークンがない場合のエラー
    if (!token || token === '') {
      console.log('❌ アクセストークンが設定されていません')
      
      return NextResponse.json({
        error: 'アクセストークンが設定されていません',
        details: 'Facebook認証を完了してアクセストークンを取得してください',
        steps: [
          '1. /dashboard-auth にアクセス',
          '2. 「Facebook認証を開始」ボタンをクリック',
          '3. Facebookにログインして権限を許可',
          '4. 認証完了後、再度メッセージ送信を試す'
        ]
      }, { status: 401 })
    }

    console.log('📤 実際のメッセージ送信開始:', {
      originalRecipientId: recipientId,
      processedRecipientId,
      messageLength: message.length,
      tokenLength: token?.length || 0,
      timestamp: new Date().toISOString()
    })

    // 実際のFacebook API呼び出し（本番モード）
    const apiVersion = 'v18.0'
    const sendUrl = `https://graph.facebook.com/${apiVersion}/me/messages`
    
    const payload = {
      recipient: {
        id: processedRecipientId  // URLから抽出したIDを使用
      },
      message: {
        text: message
      },
      messaging_type: 'RESPONSE'
    }

    console.log('📡 Send API呼び出し:', {
      url: sendUrl,
      recipientId: processedRecipientId,
      payload
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
      console.error('❌ Facebook APIエラー:', {
        status: response.status,
        statusText: response.statusText,
        error: responseData.error
      })

      // Facebook APIエラーの詳細解析
      let errorMessage = 'メッセージ送信に失敗しました'
      let errorDetails = responseData.error
      
      if (responseData.error?.message) {
        errorMessage = responseData.error.message
        
        // 一般的なFacebook APIエラーの対処
        if (errorMessage.includes('Invalid OAuth')) {
          errorMessage = 'アクセストークンが無効です。再認証してください'
        } else if (errorMessage.includes('permissions')) {
          errorMessage = '必要な権限がありません。Facebook認証を再度行ってください'
        } else if (errorMessage.includes('does not exist')) {
          errorMessage = '指定された受信者IDが存在しません'
        }
      }

      return NextResponse.json({
        error: errorMessage,
        details: errorDetails,
        recipientId: recipientId,
        suggestion: {
          title: '解決方法',
          options: [
            '正しいFacebook IDを入力 (例: 100012345678901)',
            '完全なプロフィールURLを入力',
            '/dashboard-authでFacebook認証を再実行',
            'アクセストークンの有効期限を確認'
          ]
        },
        debugInfo: {
          apiVersion: 'v18.0',
          tokenLength: token?.length || 0,
          recipientIdFormat: recipientId
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
    console.error('🔥 直接送信APIエラー:', {
      message: error.message,
      stack: error.stack,
      recipientId,
      messageLength: message?.length
    })
    
    return NextResponse.json({
      error: error.message || '送信に失敗しました',
      details: '予期しないエラーが発生しました',
      suggestion: {
        title: 'トラブルシューティング',
        steps: [
          '1. /dashboard-authでFacebook認証が完了しているか確認',
          '2. 受信者IDが正しい形式か確認',
          '3. ネットワーク接続を確認',
          '4. 再度メッセージ送信を試す'
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
    status: '本番モード動作中',
    
    authentication: {
      required: true,
      method: 'Facebook OAuth 2.0',
      tokenSource: 'クライアントから送信または環境変数'
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