'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import toast from 'react-hot-toast'

interface FacebookAccountModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  userId: string
}

export default function FacebookAccountModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  userId 
}: FacebookAccountModalProps) {
  const [accountName, setAccountName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // パスワードを暗号化（実際の暗号化はサーバーサイドで行うべき）
      // ここでは仮実装
      const encryptedPassword = btoa(password) // 実際はもっと強力な暗号化が必要

      const { error } = await supabase
        .from('facebook_accounts')
        .insert({
          user_id: userId,
          account_name: accountName,
          email: email,
          encrypted_password: encryptedPassword,
          status: 'active'
        })

      if (error) throw error

      toast.success('Facebookアカウントを追加しました')
      onSuccess()
      onClose()
      
      // フォームをリセット
      setAccountName('')
      setEmail('')
      setPassword('')
    } catch (error: any) {
      console.error('Error adding account:', error)
      toast.error(error.message || 'アカウント追加に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Facebookアカウント追加</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              アカウント名（識別用）
            </label>
            <input
              type="text"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="例: 個人用アカウント"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Facebookメールアドレス
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="facebook@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Facebookパスワード
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="パスワード"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              ※ パスワードは暗号化して保存されます
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              ⚠️ Facebook規約違反のリスクがあります。自己責任でご利用ください。
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
              {isLoading ? '追加中...' : '追加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}