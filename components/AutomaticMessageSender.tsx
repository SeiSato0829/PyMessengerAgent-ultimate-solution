'use client'

import React, { useState, useEffect } from 'react'
import { Send, CheckCircle, AlertCircle, Loader } from 'lucide-react'

interface SendResult {
  success: boolean
  message: string
  method?: string
}

export function AutomaticMessageSender() {
  const [recipientId, setRecipientId] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sendResults, setSendResults] = useState<SendResult[]>([])
  const [autoMode, setAutoMode] = useState(true)

  // 自動送信の実装
  const sendMessageAutomatically = async () => {
    if (!recipientId || !message) {
      alert('宛先IDとメッセージを入力してください')
      return
    }

    setLoading(true)
    setSendResults([])

    const methods = [
      // Method 1: Direct Messenger Link
      {
        name: 'Direct Link',
        action: async () => {
          const url = `https://m.me/${recipientId}?text=${encodeURIComponent(message)}`
          window.open(url, '_blank', 'width=600,height=700')
          return { success: true, message: 'Messenger window opened', method: 'Direct Link' }
        }
      },
      // Method 2: Facebook Message Dialog
      {
        name: 'FB Dialog',
        action: async () => {
          const fbUrl = `https://www.facebook.com/dialog/send?app_id=1074848747815619&link=${encodeURIComponent('https://pymessenger.vercel.app')}&redirect_uri=${encodeURIComponent('https://pymessenger.vercel.app/callback')}`
          window.open(fbUrl, '_blank', 'width=600,height=700')
          return { success: true, message: 'Facebook dialog opened', method: 'FB Dialog' }
        }
      },
      // Method 3: Graph API
      {
        name: 'Graph API',
        action: async () => {
          try {
            const response = await fetch('/api/messages/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                recipientId,
                message,
                method: 'graph_api'
              })
            })
            const data = await response.json()
            return {
              success: response.ok,
              message: data.message || 'API call completed',
              method: 'Graph API'
            }
          } catch (error) {
            return {
              success: false,
              message: `API error: ${error}`,
              method: 'Graph API'
            }
          }
        }
      },
      // Method 4: Webhook
      {
        name: 'Webhook',
        action: async () => {
          try {
            const response = await fetch('/api/messages/send-webhook', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                recipientId,
                message
              })
            })
            const data = await response.json()
            return {
              success: response.ok,
              message: data.message || 'Webhook sent',
              method: 'Webhook'
            }
          } catch (error) {
            return {
              success: false,
              message: `Webhook error: ${error}`,
              method: 'Webhook'
            }
          }
        }
      }
    ]

    // 自動モードの場合、すべてのメソッドを順番に試す
    if (autoMode) {
      for (const method of methods) {
        const result = await method.action()
        setSendResults(prev => [...prev, result])

        // 成功したら次のメソッドも試す（バックアップとして）
        if (result.success) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }
    } else {
      // 最初のメソッドのみ実行
      const result = await methods[0].action()
      setSendResults([result])
    }

    setLoading(false)
  }

  // Enterキーで送信
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessageAutomatically()
    }
  }

  return (
    <div className="bg-gradient-to-br from-blue-900 to-purple-900 rounded-xl p-8 shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">
          自動メッセージ送信システム
        </h2>
        <div className="flex items-center gap-2">
          <label className="flex items-center text-white">
            <input
              type="checkbox"
              checked={autoMode}
              onChange={(e) => setAutoMode(e.target.checked)}
              className="mr-2"
            />
            完全自動モード
          </label>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-200 mb-2">
            宛先ID（Facebook ID / ユーザー名）
          </label>
          <input
            type="text"
            value={recipientId}
            onChange={(e) => setRecipientId(e.target.value)}
            placeholder="例: 100000000000000 または username"
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 backdrop-blur-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-200 mb-2">
            メッセージ内容
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="送信するメッセージを入力..."
            rows={4}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400 backdrop-blur-sm"
          />
        </div>

        <button
          onClick={sendMessageAutomatically}
          disabled={loading || !recipientId || !message}
          className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader className="animate-spin" size={20} />
              送信中...
            </>
          ) : (
            <>
              <Send size={20} />
              メッセージを自動送信
            </>
          )}
        </button>

        {/* 送信結果 */}
        {sendResults.length > 0 && (
          <div className="mt-6 p-4 bg-black/30 rounded-lg backdrop-blur-sm">
            <h3 className="text-white font-semibold mb-3">送信結果:</h3>
            <div className="space-y-2">
              {sendResults.map((result, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  {result.success ? (
                    <CheckCircle className="text-green-400" size={16} />
                  ) : (
                    <AlertCircle className="text-red-400" size={16} />
                  )}
                  <span className="text-white">
                    {result.method}: {result.message}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 使用方法 */}
        <div className="mt-6 p-4 bg-white/5 rounded-lg backdrop-blur-sm">
          <h3 className="text-white font-semibold mb-2">自動送信の仕組み:</h3>
          <ul className="text-gray-300 text-sm space-y-1">
            <li>• 複数の送信方法を自動的に試します</li>
            <li>• Direct Link → FB Dialog → API → Webhook の順で実行</li>
            <li>• 成功した方法はすべて記録されます</li>
            <li>• Enterキーで即座に送信開始</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default AutomaticMessageSender