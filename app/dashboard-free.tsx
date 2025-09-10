'use client'

import { useState, useEffect } from 'react'
import { useSupabase } from '@/lib/supabase/client'

// 軽量統計データ型
interface Stats {
  totalMessages: number
  dailyMessages: number  
  successRate: number
  activeAccounts: number
  lastUpdate: string
}

interface SimpleMessage {
  id: string
  recipient: string
  message: string
  status: 'sent' | 'pending' | 'failed'
  timestamp: string
}

export default function FreeMessengerDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalMessages: 0,
    dailyMessages: 0,
    successRate: 0,
    activeAccounts: 0,
    lastUpdate: new Date().toLocaleString()
  })
  
  const [messages, setMessages] = useState<SimpleMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [recipient, setRecipient] = useState('')
  const [loading, setLoading] = useState(false)
  
  const supabase = useSupabase()

  // 軽量データフェッチ（5分間隔）
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 統計データ取得（最小限）
        const { data: statsData } = await supabase
          .from('message_stats_simple')
          .select('*')
          .single()

        if (statsData) {
          setStats({
            ...statsData,
            lastUpdate: new Date().toLocaleString()
          })
        }

        // 最新20件のメッセージ
        const { data: messagesData } = await supabase
          .from('messages')
          .select('id, recipient, message, status, created_at')
          .order('created_at', { ascending: false })
          .limit(20)

        if (messagesData) {
          setMessages(messagesData.map(msg => ({
            id: msg.id,
            recipient: msg.recipient,
            message: msg.message.substring(0, 50) + '...',
            status: msg.status,
            timestamp: new Date(msg.created_at).toLocaleString()
          })))
        }

      } catch (error) {
        console.error('データ取得エラー:', error)
        alert('データの更新に失敗しました') // react-hot-toast代替
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 300000) // 5分間隔
    return () => clearInterval(interval)
  }, [supabase])

  // メッセージ送信（基本版）
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !recipient.trim()) {
      alert('メッセージと宛先を入力してください')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          recipient: recipient.trim(),
          message: newMessage.trim(),
          status: 'pending',
          user_id: 'current-user' // 簡易実装
        })

      if (error) throw error

      alert('メッセージを送信キューに追加しました')
      setNewMessage('')
      setRecipient('')
      
      // データ再取得
      window.location.reload() // 軽量なリフレッシュ

    } catch (error) {
      console.error('送信エラー:', error)
      alert('送信に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'text-green-600'
      case 'pending': return 'text-yellow-600'
      case 'failed': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'sent': return '送信完了'
      case 'pending': return '送信待ち'
      case 'failed': return '送信失敗'
      default: return '不明'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* シンプルヘッダー */}
      <header className="bg-white rounded-lg shadow p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          PyMessenger Agent - Free Plan
        </h1>
        <p className="text-sm text-gray-600">
          最終更新: {stats.lastUpdate}
        </p>
      </header>

      {/* 基本統計（テーブル形式） */}
      <div className="bg-white rounded-lg shadow mb-6 overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h2 className="text-lg font-semibold text-gray-900">統計情報</h2>
        </div>
        <div className="p-6">
          <table className="w-full">
            <tbody>
              <tr className="border-b">
                <td className="py-2 font-medium text-gray-700">総メッセージ数</td>
                <td className="py-2 text-right font-bold text-blue-600">
                  {stats.totalMessages.toLocaleString()}
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-2 font-medium text-gray-700">本日送信</td>
                <td className="py-2 text-right font-bold text-green-600">
                  {stats.dailyMessages}
                </td>
              </tr>
              <tr className="border-b">
                <td className="py-2 font-medium text-gray-700">成功率</td>
                <td className="py-2 text-right font-bold text-purple-600">
                  {stats.successRate.toFixed(1)}%
                </td>
              </tr>
              <tr>
                <td className="py-2 font-medium text-gray-700">稼働アカウント</td>
                <td className="py-2 text-right font-bold text-orange-600">
                  {stats.activeAccounts}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* メッセージ送信フォーム */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h2 className="text-lg font-semibold text-gray-900">新規メッセージ送信</h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                送信先
              </label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="Facebook ユーザー名 または ID"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                メッセージ内容
              </label>
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="送信するメッセージを入力してください"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? '送信中...' : 'メッセージを送信'}
            </button>
          </div>
        </div>
      </div>

      {/* メッセージ履歴（シンプルテーブル） */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h2 className="text-lg font-semibold text-gray-900">メッセージ履歴</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  送信先
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  メッセージ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  ステータス
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  日時
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {messages.map((message) => (
                <tr key={message.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {message.recipient}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {message.message}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`font-medium ${getStatusColor(message.status)}`}>
                      {getStatusText(message.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {message.timestamp}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {messages.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">メッセージ履歴がありません</p>
            </div>
          )}
        </div>
      </div>

      {/* 注意書き */}
      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          ⚠️ Free Plan: 15分後にサービスが一時停止します。重要な送信は時間に余裕をもって実行してください。
        </p>
      </div>
    </div>
  )
}