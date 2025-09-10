'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  User, 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Clock,
  Settings,
  Zap,
  Loader
} from 'lucide-react'
import toast from 'react-hot-toast'

interface AuthStatus {
  authenticated: boolean
  accountId?: string
  accountName?: string
  pageName?: string
  dailyLimit?: number
  status?: string
  expiresAt?: string
  error?: string
  isDemoMode?: boolean
  message?: string
  requiredEnvVars?: string[]
  demoFeatures?: {
    messaging: string
    authentication: string
    database: string
  }
  action?: string
}

export default function FacebookAuthPanel() {
  const [authStatus, setAuthStatus] = useState<AuthStatus>({ authenticated: false })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/auth/facebook/status')
      const data = await response.json()
      setAuthStatus(data)

      if (data.isDemoMode) {
        toast('📝 デモモードで動作中', {
          duration: 4000,
          icon: '⚠️',
        })
      } else if (data.authenticated) {
        toast.success('Facebook認証確認済み ✓', { duration: 2000 })
      } else if (data.error) {
        toast.error(`認証エラー: ${data.error}`)
      }

    } catch (error: any) {
      console.error('認証状態確認エラー:', error)
      setAuthStatus({ 
        authenticated: false, 
        error: '認証状態の確認に失敗しました' 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await checkAuthStatus()
    setRefreshing(false)
  }

  const handleLogin = () => {
    toast.promise(
      new Promise<void>((resolve) => {
        const authWindow = window.open(
          '/api/auth/facebook?action=login',
          'facebook-auth',
          'width=600,height=700,scrollbars=yes,resizable=yes'
        )

        const checkClosed = setInterval(() => {
          if (authWindow?.closed) {
            clearInterval(checkClosed)
            setTimeout(() => {
              checkAuthStatus()
              resolve()
            }, 1000)
          }
        }, 1000)
      }),
      {
        loading: 'Facebook認証中...',
        success: '認証ウィンドウを確認してください',
        error: '認証ウィンドウの起動に失敗しました'
      }
    )
  }

  const getStatusIcon = () => {
    if (loading) return <Loader className="h-5 w-5 animate-spin text-blue-400" />
    if (authStatus.authenticated) return <CheckCircle className="h-5 w-5 text-green-400" />
    return <XCircle className="h-5 w-5 text-red-400" />
  }

  const getStatusColor = () => {
    if (loading) return 'border-blue-500/30 bg-blue-500/5'
    if (authStatus.authenticated) return 'border-green-500/30 bg-green-500/5'
    return 'border-red-500/30 bg-red-500/5'
  }

  const formatExpiryDate = (expiresAt?: string) => {
    if (!expiresAt) return '不明'
    const date = new Date(expiresAt)
    const now = new Date()
    const diffHours = Math.round((date.getTime() - now.getTime()) / (1000 * 60 * 60))
    
    if (diffHours < 24) {
      return `${diffHours}時間後`
    } else {
      const diffDays = Math.round(diffHours / 24)
      return `${diffDays}日後`
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white/10 backdrop-blur-xl rounded-2xl p-6 border ${getStatusColor()}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Facebook認証</h3>
            <p className="text-sm text-white/70">メッセージ送信に必要</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 bg-white/10 text-white/70 rounded-lg hover:bg-white/20 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Status Display */}
      <div className="space-y-4">
        {/* Main Status */}
        <div className="flex items-center space-x-3">
          {getStatusIcon()}
          <div className="flex-1">
            <div className="text-white font-medium">
              {loading 
                ? '認証状態を確認中...' 
                : authStatus.authenticated 
                  ? '認証済み ✓' 
                  : '未認証'}
            </div>
            {authStatus.error && (
              <div className="text-red-400 text-sm mt-1">{authStatus.error}</div>
            )}
          </div>
        </div>

        {/* Demo Mode Info */}
        {authStatus.isDemoMode && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 space-y-3">
            <div className="text-yellow-400 font-medium text-lg">📝 デモモード</div>
            <div className="text-yellow-300/80 text-sm">{authStatus.message}</div>
            
            {authStatus.demoFeatures && (
              <div className="bg-black/20 rounded-lg p-3 space-y-2">
                <div className="text-yellow-300/90 text-xs font-medium">デモ機能:</div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-yellow-300/60">メッセージ:</span>
                    <span className="text-yellow-400">{authStatus.demoFeatures.messaging}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-yellow-300/60">認証:</span>
                    <span className="text-yellow-400">{authStatus.demoFeatures.authentication}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-yellow-300/60">データベース:</span>
                    <span className="text-yellow-400">{authStatus.demoFeatures.database}</span>
                  </div>
                </div>
              </div>
            )}
            
            {authStatus.requiredEnvVars && (
              <div className="mt-2 text-xs text-yellow-300/60">
                <div className="font-medium mb-1">必要な環境変数:</div>
                <ul className="list-disc list-inside space-y-0.5">
                  {authStatus.requiredEnvVars.map(v => (
                    <li key={v} className="font-mono">{v}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Account Details */}
        {authStatus.authenticated && !authStatus.isDemoMode && (
          <div className="bg-white/5 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-white/70 text-sm">アカウント</span>
              <span className="text-white text-sm font-medium">
                {authStatus.accountName}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-white/70 text-sm">ページ</span>
              <span className="text-white text-sm font-medium">
                {authStatus.pageName}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-white/70 text-sm">日次制限</span>
              <span className="text-white text-sm font-medium">
                {authStatus.dailyLimit}件/日
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-white/70 text-sm flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>有効期限</span>
              </span>
              <span className="text-white text-sm font-medium">
                {formatExpiryDate(authStatus.expiresAt)}
              </span>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2">
          {authStatus.authenticated ? (
            <div className="flex space-x-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center space-x-2 px-4 py-2 bg-green-500/20 text-green-300 rounded-lg hover:bg-green-500/30 transition-all flex-1"
              >
                <CheckCircle className="h-4 w-4" />
                <span>認証済み</span>
              </motion.button>
              <button className="p-2 bg-white/10 text-white/70 rounded-lg hover:bg-white/20 transition-all">
                <Settings className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Facebook認証を開始</span>
            </motion.button>
          )}
        </div>

        {/* Tips */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-blue-300 text-xs">
              <div className="font-medium mb-1">認証のヒント</div>
              <ul className="space-y-1 text-blue-300/80">
                <li>• Facebookページの管理者権限が必要です</li>
                <li>• 認証は90日間有効です</li>
                <li>• メッセージ送信前に認証状態を確認してください</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}