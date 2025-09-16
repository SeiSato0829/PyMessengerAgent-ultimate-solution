'use client'

import { useState } from 'react'
import toast, { Toaster } from 'react-hot-toast'

export default function TestMessagePage() {
  const [recipientId, setRecipientId] = useState('61578211067618')
  const [message, setMessage] = useState('テストメッセージ from PyMessenger')
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<any>(null)

  const handleSendMessage = async () => {
    // LocalStorageから認証情報を取得
    const authDataStr = localStorage.getItem('facebookAuth')
    if (!authDataStr) {
      toast.error('認証が必要です。Facebook認証を完了してください。')
      return
    }

    const authData = JSON.parse(authDataStr)
    if (!authData.accessToken) {
      toast.error('アクセストークンが見つかりません。')
      return
    }

    setLoading(true)
    setResponse(null)

    try {
      console.log('📤 送信開始:', {
        recipientId,
        messageLength: message.length,
        hasToken: !!authData.accessToken
      })

      const res = await fetch('/api/messages/send-direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipientId,
          message,
          accessToken: authData.accessToken,
          userId: authData.userId
        })
      })

      const result = await res.json()
      setResponse(result)
      console.log('📥 API応答:', result)

      if (res.ok && result.success) {
        toast.success('✅ メッセージ送信成功！')
      } else {
        if (result.requiresAppReview) {
          toast.error(`⚠️ App Review承認が必要です`)
        } else {
          toast.error(`❌ 送信失敗: ${result.error || 'Unknown error'}`)
        }
      }
    } catch (error: any) {
      console.error('🔥 エラー:', error)
      toast.error(`エラー: ${error.message}`)
      setResponse({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const checkAuthStatus = () => {
    const authDataStr = localStorage.getItem('facebookAuth')
    if (authDataStr) {
      const authData = JSON.parse(authDataStr)
      return {
        hasAuth: true,
        userId: authData.userId,
        userName: authData.userName,
        hasToken: !!authData.accessToken,
        expiresAt: authData.expiresAt
      }
    }
    return { hasAuth: false }
  }

  const authStatus = checkAuthStatus()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-blue-900 p-8">
      <Toaster position="top-right" />
      
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">
          🧪 メッセージ送信テスト
        </h1>

        {/* 認証状態 */}
        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">認証状態</h2>
          {authStatus.hasAuth ? (
            <div className="space-y-2">
              <p className="text-green-400">✅ 認証済み</p>
              <p className="text-white/80">ユーザーID: {authStatus.userId}</p>
              <p className="text-white/80">ユーザー名: {authStatus.userName}</p>
              <p className="text-white/80">トークン: {authStatus.hasToken ? '✅ あり' : '❌ なし'}</p>
            </div>
          ) : (
            <p className="text-red-400">❌ 未認証 - Facebook認証を完了してください</p>
          )}
        </div>

        {/* 送信フォーム */}
        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-white mb-4">メッセージ送信</h2>
          
          <div className="space-y-4">
            <div>
              <label className="text-white/80 block mb-2">受信者ID (Facebook User ID)</label>
              <input
                type="text"
                value={recipientId}
                onChange={(e) => setRecipientId(e.target.value)}
                className="w-full bg-white/20 text-white px-4 py-2 rounded-lg"
                placeholder="例: 61578211067618"
              />
            </div>

            <div>
              <label className="text-white/80 block mb-2">メッセージ</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-white/20 text-white px-4 py-2 rounded-lg h-32"
                placeholder="送信するメッセージを入力..."
              />
            </div>

            <button
              onClick={handleSendMessage}
              disabled={loading || !authStatus.hasAuth || !recipientId || !message}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? '送信中...' : '📤 メッセージを送信'}
            </button>
          </div>
        </div>

        {/* レスポンス表示 */}
        {response && (
          <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">API レスポンス</h2>
            <pre className="bg-black/30 text-white p-4 rounded-lg overflow-auto">
              {JSON.stringify(response, null, 2)}
            </pre>
          </div>
        )}

        {/* 注意事項 */}
        <div className="mt-6 bg-yellow-500/20 border border-yellow-400 rounded-xl p-6">
          <h3 className="text-yellow-300 font-bold mb-2">⚠️ 注意事項</h3>
          <ul className="text-yellow-200 space-y-1 text-sm">
            <li>• Facebook Messenger APIには「pages_messaging」権限が必要です（App Review承認必須）</li>
            <li>• 24時間ポリシー: ユーザーが先にページにメッセージを送信している必要があります</li>
            <li>• テストユーザー同士でのみメッセージ送信可能です</li>
            <li>• 受信者IDは相手のFacebook User IDである必要があります</li>
          </ul>
        </div>
      </div>
    </div>
  )
}