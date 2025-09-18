'use client'

import React, { useState } from 'react'

export function MessengerLauncher() {
  const [recipientId, setRecipientId] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  // URLからIDを抽出
  const extractIdFromUrl = (input: string) => {
    const patterns = [
      /facebook\.com\/profile\.php\?id=(\d+)/,
      /facebook\.com\/([^/?\s]+)/,
      /fb\.com\/([^/?\s]+)/
    ]
    
    for (const pattern of patterns) {
      const match = input.match(pattern)
      if (match && match[1]) {
        return match[1]
      }
    }
    return input
  }

  // Messengerを新しいウィンドウで開く
  const openMessenger = () => {
    if (!recipientId) {
      alert('受信者IDまたはURLを入力してください')
      return
    }

    setLoading(true)
    
    const processedId = extractIdFromUrl(recipientId)
    
    // Messengerを開く複数の方法を試す
    const methods = [
      // 方法1: m.me URL（最も信頼性が高い）
      () => {
        const url = `https://m.me/${processedId}`
        const params = message ? `?text=${encodeURIComponent(message)}` : ''
        window.open(url + params, '_blank', 'width=600,height=700')
      },
      
      // 方法2: Facebook Messages URL
      () => {
        const url = `https://www.facebook.com/messages/t/${processedId}`
        window.open(url, '_blank', 'width=800,height=600')
      },
      
      // 方法3: Mobile Messenger URL
      () => {
        window.location.href = `fb-messenger://user/${processedId}`
      }
    ]

    // 最初の方法を実行
    methods[0]()
    
    setTimeout(() => {
      setLoading(false)
      // 成功メッセージ
      const successMsg = document.createElement('div')
      successMsg.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50'
      successMsg.innerHTML = '✅ Messengerウィンドウを開きました'
      document.body.appendChild(successMsg)
      
      setTimeout(() => {
        successMsg.remove()
      }, 3000)
    }, 1000)
  }

  return (
    <div className="w-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Messenger Direct Link</h2>
        <p className="text-blue-100">
          Facebook Webサイトと同じように、Messengerウィンドウを開いて送信
        </p>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2 text-blue-100">
            受信者ID または プロフィールURL
          </label>
          <input
            type="text"
            placeholder="例: https://facebook.com/profile.php?id=100012345678901"
            value={recipientId}
            onChange={(e) => setRecipientId(e.target.value)}
            className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-md text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2 text-blue-100">
            メッセージ（オプション）
          </label>
          <textarea
            placeholder="送信するメッセージを入力..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-md text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white"
          />
        </div>
        
        <button
          onClick={openMessenger}
          disabled={loading || !recipientId}
          className="w-full px-4 py-3 bg-white text-blue-600 rounded-md font-bold hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
        >
          {loading ? '開いています...' : '🚀 Messengerで開く'}
        </button>
      </div>
      
      <div className="mt-6 p-4 bg-white/10 rounded-lg">
        <h3 className="font-semibold mb-2">✨ 動作の仕組み</h3>
        <ul className="text-sm space-y-1 text-blue-100">
          <li>• Facebook Webサイトのメッセージボタンと同じ動作</li>
          <li>• 新しいウィンドウでMessengerが開きます</li>
          <li>• メッセージリクエストとして送信されます</li>
          <li>• 相手が承認すれば会話が始まります</li>
        </ul>
      </div>
    </div>
  )
}