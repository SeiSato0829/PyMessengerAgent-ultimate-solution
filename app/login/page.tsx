'use client'

import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()

  const handleSkipLogin = () => {
    // ログインをスキップしてダッシュボードへ
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-2xl font-bold">P</span>
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            PyMessenger Dashboard
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Facebook Messenger自動化システム
          </p>
        </div>
        
        <div className="mt-8 space-y-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4">システムアクセス</h3>
            <p className="text-sm text-gray-600 mb-4">
              現在、デモモードで動作しています。
              Supabase環境変数が設定されていないため、
              認証機能は無効化されています。
            </p>
            
            <button
              onClick={handleSkipLogin}
              className="w-full py-2 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              ダッシュボードへ進む（認証スキップ）
            </button>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-yellow-400">⚠️</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  デモモードについて
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>認証機能は利用できません</li>
                    <li>データは保存されません</li>
                    <li>本番環境では環境変数を設定してください</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}