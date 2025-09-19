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
  const openMessenger = async () => {
    if (!recipientId) {
      alert('受信者IDまたはURLを入力してください')
      return
    }

    setLoading(true)
    
    try {
      // 新しいAPIエンドポイントを使用
      const response = await fetch('/api/messages/direct-messenger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientId,
          message
        })
      })

      const data = await response.json()
      
      if (response.ok && data.success) {
        // メッセージをクリップボードにコピー
        if (message) {
          try {
            await navigator.clipboard.writeText(message)
            console.log('📋 メッセージをクリップボードにコピーしました:', message)
          } catch (err) {
            console.log('クリップボードコピー失敗:', err)
          }
        }

        // 複数のMessengerウィンドウを順次開く
        const urls = data.urls
        
        // Primary URL (Facebook Messages)
        const primaryWindow = window.open(
          urls.primary,
          'messenger_primary',
          'width=900,height=700,scrollbars=yes,resizable=yes,toolbar=no,menubar=no'
        )
        
        // 2秒後にSecondary URL (m.me)
        setTimeout(() => {
          const secondaryWindow = window.open(
            urls.secondary,
            'messenger_secondary',
            'width=600,height=700,scrollbars=yes,resizable=yes'
          )
        }, 2000)
        
        // モバイルの場合はアプリも起動
        if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
          setTimeout(() => {
            window.location.href = urls.mobile
          }, 4000)
        }

        // 成功メッセージ
        const successMsg = document.createElement('div')
        successMsg.className = 'fixed bottom-4 right-4 bg-green-600 text-white px-6 py-4 rounded-lg shadow-lg z-50 max-w-sm'
        successMsg.innerHTML = `
          <div class="font-bold mb-2">✅ Messenger起動成功！</div>
          <div class="text-sm">
            ${message ? `📋 "${message.substring(0, 30)}${message.length > 30 ? '...' : ''}"<br>クリップボードにコピーしました` : ''}
            <br>📱 受信者: ${data.originalInput}
            <br>🔗 複数のウィンドウを開きました
          </div>
        `
        document.body.appendChild(successMsg)
        
        setTimeout(() => {
          successMsg.remove()
        }, 8000)

      } else {
        throw new Error(data.error || 'Messenger起動に失敗しました')
      }
      
    } catch (error: any) {
      console.error('Messenger起動エラー:', error)
      
      // エラーの場合でも従来の方法で試す
      const processedId = extractIdFromUrl(recipientId)
      const fallbackUrl = `https://www.facebook.com/messages/t/${processedId}`
      
      window.open(
        fallbackUrl,
        'messenger_fallback',
        'width=800,height=700,scrollbars=yes,resizable=yes'
      )

      const errorMsg = document.createElement('div')
      errorMsg.className = 'fixed bottom-4 right-4 bg-orange-600 text-white px-6 py-4 rounded-lg shadow-lg z-50 max-w-sm'
      errorMsg.innerHTML = `
        <div class="font-bold mb-2">⚠️ フォールバック起動</div>
        <div class="text-sm">
          通常のMessengerウィンドウを開きました<br>
          手動でメッセージを送信してください
        </div>
      `
      document.body.appendChild(errorMsg)
      
      setTimeout(() => {
        errorMsg.remove()
      }, 6000)
    } finally {
      setLoading(false)
    }
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

export default MessengerLauncher