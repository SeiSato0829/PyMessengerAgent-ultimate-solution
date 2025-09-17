'use client'

import { useState } from 'react'

export default function DashboardPage() {
  const [recipientId, setRecipientId] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const sendMessage = async () => {
    if (!recipientId || !message) {
      setError('受信者IDとメッセージは必須です')
      return
    }

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
          accessToken: '' // デモモードでは空
        })
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
        setMessage('') // メッセージをクリア
      } else {
        setError(data.error || '送信に失敗しました')
      }
    } catch (err: any) {
      setError('ネットワークエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Facebook Messenger 送信システム</h1>
        
        {/* メイン送信フォーム */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">メッセージ送信</h2>
            <p className="text-sm text-gray-600 mb-4">
              友達じゃない人にもメッセージを送信できます（メッセージリクエストとして送信）
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  受信者ID または FacebookプロフィールURL
                </label>
                <input
                  type="text"
                  value={recipientId}
                  onChange={(e) => setRecipientId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例: 100012345678901 または facebook.com/username"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  メッセージ内容
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="送信するメッセージを入力..."
                />
              </div>
              
              <button
                onClick={sendMessage}
                disabled={loading || !recipientId || !message}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '送信中...' : 'メッセージを送信'}
              </button>
            </div>

            {/* エラー表示 */}
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
                {error}
              </div>
            )}

            {/* 成功表示 */}
            {result && result.success && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded text-green-700">
                <p className="font-semibold">送信成功！</p>
                <p className="text-sm mt-1">{result.info?.status || 'メッセージが送信されました'}</p>
              </div>
            )}
          </div>

          {/* 説明セクション */}
          <div>
            <div className="bg-white p-6 rounded-lg shadow mb-6">
              <h3 className="text-lg font-semibold mb-3">使い方</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                <li>Facebook IDまたはプロフィールURLを入力</li>
                <li>送信したいメッセージを入力</li>
                <li>「メッセージを送信」ボタンをクリック</li>
                <li>メッセージリクエストとして送信されます</li>
                <li>相手が承認すると会話が開始できます</li>
              </ol>
            </div>

            <div className="bg-yellow-50 p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-3 text-yellow-800">注意事項</h3>
              <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700">
                <li>Facebook APIの制限により、実際の送信には認証が必要です</li>
                <li>デモモードでは動作確認のみ可能です</li>
                <li>本番利用にはFacebook App IDとSecretの設定が必要です</li>
                <li>スパム送信は厳禁です</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 機能一覧 */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-2">✅ 実装済み機能</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• 友達じゃない人への送信</li>
              <li>• メッセージリクエスト対応</li>
              <li>• Facebook ID自動抽出</li>
            </ul>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-2">🔧 設定が必要</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Facebook App ID</li>
              <li>• Facebook App Secret</li>
              <li>• User Access Token</li>
            </ul>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-2">📊 送信ステータス</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• 送信数: 0</li>
              <li>• 成功率: -</li>
              <li>• 最終送信: -</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export const metadata = {
  title: 'PyMessenger Agent - ダッシュボード',
  description: 'Facebook Messenger自動化システム'
}