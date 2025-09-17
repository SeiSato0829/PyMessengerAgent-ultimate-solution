export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            PyMessenger Agent Ultimate Solution
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Facebook Messenger自動化システム
          </p>
          
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-semibold mb-4">システム状態</h2>
            <div className="space-y-3">
              <div className="flex items-center">
                <span className="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
                <span>システム稼働中</span>
              </div>
              <div className="flex items-center">
                <span className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></span>
                <span>環境変数設定待ち</span>
              </div>
            </div>
            
            <div className="mt-8 p-4 bg-blue-50 rounded">
              <h3 className="font-semibold mb-2">必要な設定</h3>
              <ul className="list-disc list-inside text-sm text-gray-600">
                <li>Facebook App ID</li>
                <li>Facebook App Secret</li>
                <li>Supabase URL（オプション）</li>
                <li>Supabase Anon Key（オプション）</li>
              </ul>
            </div>
            
            <div className="mt-6 flex gap-4">
              <a
                href="/dashboard"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                ダッシュボードへ
              </a>
              <a
                href="/login"
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                ログイン
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}