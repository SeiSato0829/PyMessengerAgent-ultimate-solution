'use client'

import { useState, useEffect } from 'react'
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
      
      // LocalStorageから認証データを取得
      const localAuthData = localStorage.getItem('facebook_auth')
      
      // 認証データをBase64エンコードしてヘッダーに含める（HTTPヘッダーは ASCII only）
      const headers: HeadersInit = {}
      if (localAuthData) {
        // Base64エンコードして日本語文字を回避
        const encodedData = btoa(encodeURIComponent(localAuthData))
        headers['x-auth-data'] = encodedData
      }
      
      const response = await fetch('/api/auth/facebook/status', { headers })
      const data = await response.json()
      setAuthStatus(data)

      if (data.isDemoMode) {
        // 無効な環境変数が設定されている場合の警告
        if (data.message?.includes('無効') || data.message?.includes('temp') || data.message?.includes('test')) {
          toast.error('🚨 無効な環境変数が設定されています！Render.comで削除してください', {
            duration: 8000,
          })
        } else {
          toast('📝 デモモードで動作中', {
            duration: 4000,
            icon: '⚠️',
          })
        }
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
    
    // LocalStorageのデータも再確認
    const localAuthData = localStorage.getItem('facebook_auth')
    if (localAuthData) {
      try {
        const authData = JSON.parse(localAuthData)
        console.log('LocalStorage認証データ:', authData)
      } catch (e) {
        console.error('LocalStorage読み取りエラー:', e)
      }
    }
    
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
    <div
      className={`bg-white/10 backdrop-blur-xl rounded-2xl border ${getStatusColor()}
                 spacing-responsive-sm
                 sm:spacing-responsive-md
                 md:spacing-responsive-lg
                 lg:spacing-responsive-lg
                 xl:spacing-responsive-xl
                 animate-fadeIn`}
    >
      {/* Header - 8段階レスポンシブ */}
      <div className="flex items-center justify-between mb-3
                    sm:mb-4
                    md:mb-5
                    lg:mb-6">
        <div className="flex items-center space-x-2
                      sm:space-x-3
                      lg:space-x-4
                      min-w-0 flex-1">
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0
                        w-8 h-8
                        sm:w-9 sm:h-9
                        md:w-10 md:h-10
                        lg:w-11 lg:h-11
                        xl:w-12 xl:h-12">
            <Shield className="text-white
                             h-4 w-4
                             sm:h-4.5 sm:w-4.5
                             md:h-5 md:w-5
                             lg:h-5.5 lg:w-5.5
                             xl:h-6 xl:w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-white font-semibold truncate
                         text-responsive-sm
                         sm:text-responsive-base
                         md:text-responsive-lg
                         lg:text-responsive-xl">
              <span className="hidden sm:inline">Facebook認証</span>
              <span className="sm:hidden">FB認証</span>
            </h3>
            <p className="text-white/70 hidden sm:block
                        text-responsive-xs
                        md:text-responsive-sm
                        truncate">
              <span className="hidden md:inline">メッセージ送信に必要</span>
              <span className="md:hidden">送信用</span>
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-1
                      sm:space-x-2
                      flex-shrink-0">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-white/10 text-white/70 rounded-lg hover:bg-white/20 transition-all disabled:opacity-50
                     p-1.5
                     sm:p-2
                     md:p-2.5"
          >
            <RefreshCw className={`${refreshing ? 'animate-spin' : ''}
                                  h-3.5 w-3.5
                                  sm:h-4 sm:w-4
                                  md:h-4.5 md:w-4.5`} />
          </button>
        </div>
      </div>

      {/* Status Display - 8段階レスポンシブ */}
      <div className="space-y-3
                    sm:space-y-4
                    md:space-y-5">
        {/* Main Status */}
        <div className="flex items-center space-x-2
                      sm:space-x-3
                      lg:space-x-4">
          {getStatusIcon()}
          <div className="flex-1 min-w-0">
            <div className="text-white font-medium
                          text-responsive-sm
                          sm:text-responsive-base
                          md:text-responsive-lg
                          truncate">
              {loading 
                ? (<span>
                    <span className="hidden sm:inline">認証状態を確認中...</span>
                    <span className="sm:hidden">確認中...</span>
                   </span>)
                : authStatus.authenticated 
                  ? (<span>
                      <span className="hidden sm:inline">認証済み ✓</span>
                      <span className="sm:hidden">認証済み</span>
                     </span>)
                  : '未認証'}
            </div>
            {authStatus.error && (
              <div className="text-red-400 mt-1
                            text-responsive-xs
                            sm:text-responsive-sm
                            truncate" 
                   title={authStatus.error}>
                {authStatus.error}
              </div>
            )}
          </div>
        </div>

        {/* Demo Mode Info */}
        {authStatus.isDemoMode && (
          <div className={`border rounded-lg p-4 space-y-3 ${
            authStatus.message?.includes('無効') || authStatus.message?.includes('temp') || authStatus.message?.includes('test')
              ? 'bg-red-500/10 border-red-500/30'
              : 'bg-yellow-500/10 border-yellow-500/20'
          }`}>
            <div className={`font-medium text-lg ${
              authStatus.message?.includes('無効') || authStatus.message?.includes('temp') || authStatus.message?.includes('test')
                ? 'text-red-400'
                : 'text-yellow-400'
            }`}>
              {authStatus.message?.includes('無効') || authStatus.message?.includes('temp') || authStatus.message?.includes('test')
                ? '🚨 無効な環境変数が設定されています'
                : '📝 デモモード'
              }
            </div>
            <div className="text-yellow-300/80 text-sm">{authStatus.message}</div>
            
            {/* 無効な環境変数が設定されている場合の緊急対応手順 */}
            {(authStatus.message?.includes('無効') || authStatus.message?.includes('temp') || authStatus.message?.includes('test')) && (
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3 space-y-2">
                <div className="text-red-400 font-bold text-sm">🔥 今すぐ実行すべき対応：</div>
                <ol className="text-red-300 text-xs space-y-1.5 list-decimal list-inside">
                  <li>
                    <a href="https://dashboard.render.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-red-200">
                      Render.com
                    </a>
                    にログイン
                  </li>
                  <li>あなたのサービスを選択</li>
                  <li>Environment タブを開く</li>
                  <li>
                    <span className="font-bold">FACEBOOK_APP_ID</span> と <span className="font-bold">FACEBOOK_APP_SECRET</span> を削除
                  </li>
                  <li>Save Changes をクリック</li>
                  <li>5分待ってから再アクセス</li>
                </ol>
              </div>
            )}
            
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
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center space-x-2 px-4 py-2 bg-green-500/20 text-green-300 rounded-lg hover:bg-green-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex-1"
              >
                <CheckCircle className="h-4 w-4" />
                <span>認証済み</span>
              </button>
              <button className="p-2 bg-white/10 text-white/70 rounded-lg hover:bg-white/20 transition-all">
                <Settings className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-medium shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {authStatus.message?.includes('無効') || authStatus.message?.includes('temp') || authStatus.message?.includes('test') ? (
                <>
                  <AlertCircle className="h-4 w-4" />
                  <span>環境変数を修正してください</span>
                </>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4" />
                  <span>Facebook認証を開始</span>
                </>
              )}
            </button>
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
    </div>
  )
}