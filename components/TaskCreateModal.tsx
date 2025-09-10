'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

interface TaskCreateModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  userId: string
  accounts: any[]
}

export default function TaskCreateModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  userId,
  accounts 
}: TaskCreateModalProps) {
  const [accountId, setAccountId] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [message, setMessage] = useState('')
  const [scheduledAt, setScheduledAt] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!accountId) {
      toast.error('アカウントを選択してください')
      return
    }

    setIsLoading(true)

    try {
      const taskData: any = {
        user_id: userId,
        account_id: accountId,
        task_type: 'send_message',
        recipient_name: recipientName,
        message: message,
        status: 'pending'
      }

      if (scheduledAt) {
        taskData.scheduled_at = new Date(scheduledAt).toISOString()
      }

      const { error } = await supabase
        .from('tasks')
        .insert(taskData)

      if (error) throw error

      toast.success('タスクを作成しました')
      onSuccess()
      onClose()
      
      // フォームをリセット
      setAccountId('')
      setRecipientName('')
      setMessage('')
      setScheduledAt('')
    } catch (error: any) {
      console.error('Error creating task:', error)
      toast.error((error as any).message || 'タスク作成に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">新規タスク作成</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              送信アカウント
            </label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              required
            >
              <option value="">選択してください</option>
              {accounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.account_name} ({account.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              送信先（友達の名前）
            </label>
            <input
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="例: 田中太郎"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              メッセージ
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              rows={4}
              placeholder="送信するメッセージを入力"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              最大500文字まで
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              予約送信（オプション）
            </label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              min={new Date().toISOString().slice(0, 16)}
            />
            <p className="text-xs text-gray-500 mt-1">
              指定しない場合は即座に実行されます
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              💡 ヒント: 1日の送信上限は50件、1時間の上限は10件です
            </p>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
              disabled={isLoading}
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? '作成中...' : 'タスク作成'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}