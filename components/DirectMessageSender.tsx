'use client'

import React, { useState } from 'react'

export function DirectMessageSender() {
  const [recipientId, setRecipientId] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [accessToken, setAccessToken] = useState('')
  
  // LocalStorageから認証トークンを取得
  React.useEffect(() => {
    const savedAuth = localStorage.getItem('facebook_auth')
    if (savedAuth) {
      try {
        const authData = JSON.parse(savedAuth)
        if (authData.accessToken) {
          setAccessToken(authData.accessToken)
        }
      } catch (e) {
        console.error('Failed to parse auth data:', e)
      }
    }
  }, [])

  const sendDirectMessage = async () => {
    if (!recipientId || !message) {
      setError('受信者IDとメッセージは必須です')
      return
    }

    // デバッグ：トークンの状態を確認
    console.log('📤 送信開始:', {
      recipientId,
      message,
      hasToken: !!accessToken,
      tokenLength: accessToken?.length || 0
    })

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/messages/send-direct-new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientId,
          message,
          accessToken
        })
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
        setMessage('')
      } else {
        setError(data.error || '送信に失敗しました')
      }
    } catch (err: any) {
      setError(err.message || 'ネットワークエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const getRecipientIdFromUrl = (url: string) => {
    try {
      const match = url.match(/(?:facebook\.com\/|fb\.com\/)([^/?]+)/)
      if (match) {
        return match[1]
      }
      return url
    } catch {
      return url
    }
  }

  return (
    <div className="w-full bg-white/10 backdrop-blur-xl rounded-2xl p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Direct Message Sender</h2>
        <p className="text-gray-300">
          友達じゃない人にも直接メッセージを送信
        </p>
      </div>
      <div className="space-y-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">実装済み機能</h3>
          <ul className="text-sm space-y-1 text-blue-800">
            <li>✅ PC版Messengerと同じ仕様で実装</li>
            <li>✅ 友達じゃない人へのメッセージ送信対応</li>
            <li>✅ メッセージリクエストとして送信</li>
            <li>✅ 相手が承認すれば会話継続可能</li>
          </ul>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              受信者ID または プロフィールURL
            </label>
            <input
              type="text"
              placeholder="例: 100012345678901 または https://facebook.com/username"
              value={recipientId}
              onChange={(e) => setRecipientId(getRecipientIdFromUrl(e.target.value))}
              className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              FacebookプロフィールURLから自動的にIDを抽出します
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              受信者の名前（オプション）
            </label>
            <input
              type="text"
              placeholder="表示用の名前"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              メッセージ内容
            </label>
            <textarea
              placeholder="送信するメッセージを入力..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* アクセストークンは自動的にLocalStorageから取得される */}
          {accessToken && (
            <div className="text-xs text-green-600">
              ✅ 認証済み（アクセストークンを使用）
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={sendDirectMessage} 
            disabled={loading || !recipientId || !message}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '送信中...' : 'メッセージを送信'}
          </button>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
            <h3 className="font-semibold text-red-200 mb-1">エラー</h3>
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {result && result.success && (
          <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4">
            <h3 className="font-semibold text-green-200 mb-1">送信成功！</h3>
            <div className="space-y-2">
              <p className="text-green-300">{result.info?.status || 'メッセージが送信されました'}</p>
              {result.info?.description && (
                <p className="text-sm text-gray-400">{result.info.description}</p>
              )}
              <div className="flex gap-2 mt-2">
                <span className="px-2 py-1 bg-blue-600/30 rounded text-xs">Message ID: {result.messageId}</span>
                <span className="px-2 py-1 bg-white/20 rounded text-xs">To: {recipientName || result.recipientId}</span>
              </div>
            </div>
          </div>
        )}

        <div className="border-t pt-4">
          <h4 className="font-semibold mb-2">仕組みの説明</h4>
          <div className="space-y-2 text-sm text-gray-600">
            <p>
              1. PC版Messengerと同じく、友達じゃない人にもメッセージを送信できます
            </p>
            <p>
              2. メッセージは「メッセージリクエスト」として送信されます
            </p>
            <p>
              3. 相手のメッセージリクエストフォルダに届きます
            </p>
            <p>
              4. 相手が承認すれば通常の会話が可能になります
            </p>
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg">
          <h4 className="font-semibold text-yellow-900 mb-2">注意事項</h4>
          <ul className="text-sm space-y-1 text-yellow-800">
            <li>• 最初のメッセージのみ送信可能</li>
            <li>• 相手が承認するまで追加メッセージは制限される</li>
            <li>• スパムフィルタにかかる可能性がある</li>
            <li>• 相手のプライバシー設定により届かない場合がある</li>
          </ul>
        </div>
      </div>
    </div>
  )
}