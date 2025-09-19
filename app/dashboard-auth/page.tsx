'use client'

import { useState, useEffect } from 'react'
import FacebookAuthPanel from '../../components/FacebookAuthPanel'
import DirectMessageSender from '../../components/DirectMessageSender'
import MessengerLauncher from '../../components/MessengerLauncher'
import AutoMessengerSender from '../../components/AutoMessengerSender'
import FacebookBypassSender from '../../components/FacebookBypassSender'
import UltimateFacebookSender from '../../components/UltimateFacebookSender'

export default function AuthenticatedDashboard() {
  const [authStatus, setAuthStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      // Facebook App IDとSecretが設定されています
      const appId = '1074848747815619' // 提供されたApp ID
      
      // LocalStorageから認証情報を取得
      const savedAuth = localStorage.getItem('facebook_auth')
      if (savedAuth) {
        const authData = JSON.parse(savedAuth)
        setAuthStatus(authData)
      }

      // 認証状態をチェック
      const response = await fetch('/api/auth/facebook/status')
      const data = await response.json()
      
      if (data.authenticated) {
        setAuthStatus(data)
        localStorage.setItem('facebook_auth', JSON.stringify(data))
      }
    } catch (error) {
      console.error('認証チェックエラー:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Facebook Messenger 送信システム</h1>
          {authStatus?.authenticated && (
            <span className="px-3 py-1 bg-green-600 text-white rounded-full text-sm font-semibold">
              ✅ 認証済み
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 認証パネル */}
          <div className="lg:col-span-1">
            <FacebookAuthPanel />
          </div>

          {/* メッセージ送信パネル */}
          <div className="lg:col-span-2 space-y-6">
            {/* 究極のFacebook送信システム (最優先) */}
            <UltimateFacebookSender />
            
            {/* Facebook制限回避送信 (緊急対応) */}
            <FacebookBypassSender />
            
            {/* 完全自動送信 (最新機能) */}
            <AutoMessengerSender />
            
            {/* Messenger Launcher (推奨) */}
            <MessengerLauncher />
            
            {/* API送信 (制限あり) */}
            {authStatus?.authenticated ? (
              <DirectMessageSender />
            ) : (
              <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 text-center">
                <h2 className="text-2xl font-bold mb-4">認証が必要です</h2>
                <p className="text-gray-300 mb-6">
                  メッセージを送信するには、まずFacebook認証を完了してください。
                </p>
                <div className="space-y-4 text-left max-w-md mx-auto">
                  <div className="flex items-start space-x-3">
                    <span className="text-blue-400 mt-1">1.</span>
                    <div>
                      <p className="font-semibold">左のパネルから認証開始</p>
                      <p className="text-sm text-gray-400">「Facebook認証を開始」ボタンをクリック</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="text-blue-400 mt-1">2.</span>
                    <div>
                      <p className="font-semibold">Facebookでログイン</p>
                      <p className="text-sm text-gray-400">ポップアップウィンドウでログイン</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="text-blue-400 mt-1">3.</span>
                    <div>
                      <p className="font-semibold">権限を許可</p>
                      <p className="text-sm text-gray-400">必要な権限を許可してください</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 重要な警告 */}
        <div className="mt-8 bg-red-500/20 border border-red-500/50 rounded-xl p-6 mb-4">
          <h3 className="text-lg font-semibold mb-4 text-red-400">⚠️ 重要：Facebook APIの制限事項</h3>
          <div className="space-y-2 text-sm">
            <p className="text-red-300 font-bold">
              Facebook APIの仕様により、友達じゃない人への直接メッセージ送信は不可能です
            </p>
            <p className="text-gray-300">
              これは技術的な問題ではなく、Facebookのスパム防止ポリシーによる制限です。
            </p>
            <div className="mt-4 p-3 bg-white/10 rounded">
              <p className="text-white font-semibold mb-2">代替案：</p>
              <ul className="space-y-1 text-gray-300">
                <li>✅ 友達へのメッセージ送信</li>
                <li>✅ Facebook Page経由の自動返信ボット</li>
                <li>✅ Messenger広告キャンペーン</li>
                <li>❌ 友達以外への直接送信（API制限）</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 設定情報 */}
        <div className="bg-white/5 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">システム設定</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">Facebook App ID</p>
              <p className="font-mono text-sm">1074848747815619</p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">認証状態</p>
              <p className="font-semibold">
                {loading ? '確認中...' : authStatus?.authenticated ? '認証済み' : '未認証'}
              </p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-1">アクセストークン</p>
              <p className="font-semibold">
                {authStatus?.accessToken ? '設定済み' : '未設定'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}