export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">ダッシュボード</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2">メッセージ送信</h2>
            <p className="text-gray-600">友達じゃない人へも送信可能</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2">Facebook認証</h2>
            <p className="text-gray-600">OAuth 2.0で安全に認証</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2">分析機能</h2>
            <p className="text-gray-600">送信結果の詳細分析</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export const metadata = {
  title: 'PyMessenger Agent - ダッシュボード',
  description: 'Facebook Messenger自動化システム'
}