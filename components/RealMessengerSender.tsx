'use client'

import React, { useState, useEffect } from 'react'

export function RealMessengerSender() {
  const [recipientId, setRecipientId] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [authStatus, setAuthStatus] = useState<any>(null)
  const [progress, setProgress] = useState(0)

  // Facebook認証状態を確認
  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/facebook/status')
      const data = await response.json()
      setAuthStatus(data)
    } catch (error) {
      setAuthStatus({ authenticated: false })
    }
  }

  // Facebook OAuth認証を開始
  const startAuth = () => {
    const width = 600
    const height = 700
    const left = (screen.width - width) / 2
    const top = (screen.height - height) / 2

    const authWindow = window.open(
      '/api/auth/facebook/login',
      'facebook_auth',
      `width=${width},height=${height},left=${left},top=${top}`
    )

    // 認証完了を監視
    const checkInterval = setInterval(() => {
      if (authWindow?.closed) {
        clearInterval(checkInterval)
        checkAuthStatus()
      }
    }, 1000)
  }

  // メッセージ送信（3つの方法を同時実行）
  const sendMessage = async () => {
    if (!recipientId || !message) {
      setStatus('❌ 受信者IDとメッセージを入力してください')
      return
    }

    setLoading(true)
    setStatus('🚀 送信処理を開始...')
    setProgress(0)

    try {
      // 方法1: Graph API経由での送信
      setStatus('📡 Graph APIで送信中...')
      setProgress(20)

      const graphResponse = await fetch('/api/messages/send-via-graph', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId, message })
      })

      const graphData = await graphResponse.json()

      if (graphData.success) {
        setStatus('✅ Graph API経由で送信成功！')
        setProgress(100)
        return
      }

      // 方法2: Puppeteer自動化
      setStatus('🤖 Puppeteerで自動送信中...')
      setProgress(40)

      const puppeteerResponse = await fetch('/api/messages/send-via-puppeteer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId, message })
      })

      const puppeteerData = await puppeteerResponse.json()

      if (puppeteerData.success) {
        setStatus('✅ Puppeteer経由で送信成功！')
        setProgress(100)
        return
      }

      // 方法3: Webhook経由
      setStatus('🔄 Webhook経由で送信中...')
      setProgress(60)

      const webhookResponse = await fetch('/api/messages/send-via-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId, message })
      })

      const webhookData = await webhookResponse.json()

      if (webhookData.success) {
        setStatus('✅ Webhook経由で送信成功！')
        setProgress(100)
        return
      }

      // すべて失敗した場合
      setStatus('❌ 送信失敗。認証を確認してください。')
      setProgress(0)

    } catch (error: any) {
      setStatus(`❌ エラー: ${error.message}`)
      setProgress(0)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gradient-to-r from-red-600 to-purple-600 rounded-lg p-6 text-white">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">
          🔥 本気のMessenger自動送信システム
        </h2>
        <p className="text-sm opacity-90">
          Graph API + Puppeteer + Webhookで確実に送信
        </p>
      </div>

      {/* 認証状態 */}
      {!authStatus?.authenticated ? (
        <div className="mb-6 p-4 bg-white/10 rounded-lg">
          <p className="mb-3">⚠️ Facebook認証が必要です</p>
          <button
            onClick={startAuth}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Facebookでログイン
          </button>
        </div>
      ) : (
        <div className="mb-4 p-3 bg-green-500/20 rounded">
          ✅ 認証済み: {authStatus.user?.name}
        </div>
      )}

      {/* 入力フォーム */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            受信者（ID/ユーザー名/URL）
          </label>
          <input
            type="text"
            value={recipientId}
            onChange={(e) => setRecipientId(e.target.value)}
            placeholder="例: 100012345678901"
            className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            メッセージ
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="送信するメッセージ"
            className="w-full p-3 h-32 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50"
            disabled={loading}
          />
        </div>

        {/* 進捗バー */}
        {loading && (
          <div className="w-full bg-white/20 rounded-full h-2">
            <div
              className="bg-white h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* ステータス */}
        {status && (
          <div className={`p-4 rounded-lg ${
            status.includes('✅') ? 'bg-green-500/20' :
            status.includes('❌') ? 'bg-red-500/20' :
            'bg-blue-500/20'
          }`}>
            <p>{status}</p>
          </div>
        )}

        {/* 送信ボタン */}
        <button
          onClick={sendMessage}
          disabled={loading || !authStatus?.authenticated}
          className={`w-full py-4 px-6 rounded-lg font-bold transition-all ${
            loading || !authStatus?.authenticated
              ? 'bg-gray-600 cursor-not-allowed opacity-50'
              : 'bg-white text-red-600 hover:bg-gray-100 transform hover:scale-105'
          }`}
        >
          {loading ? '送信中...' : '完全自動送信'}
        </button>
      </div>

      {/* 技術説明 */}
      <div className="mt-6 p-4 bg-white/5 rounded-lg text-xs">
        <div className="font-bold mb-2">🔧 使用技術:</div>
        <ul className="space-y-1 opacity-80">
          <li>• Graph API v18.0（公式API）</li>
          <li>• Puppeteer（ブラウザ自動化）</li>
          <li>• Webhook（リアルタイム送信）</li>
          <li>• OAuth 2.0（認証）</li>
        </ul>
      </div>
    </div>
  )
}