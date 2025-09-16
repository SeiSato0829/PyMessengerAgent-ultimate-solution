import PotentialContactMessenger from '@/components/PotentialContactMessenger'

export default function PotentialContactsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            知り合い候補への適切な連絡
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            「知り合いかもしれない」方への丁寧で失礼のない初回連絡を支援します。
            相手の立場を尊重し、適切なマナーでコンタクトを取りましょう。
          </p>
        </div>
        
        <PotentialContactMessenger />
        
        <div className="mt-12 bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">重要なガイドライン</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-green-700 mb-4">✅ 推奨される行動</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• 丁寧で敬語を使った挨拶</li>
                <li>• 人違いの可能性を認める</li>
                <li>• 相手への配慮を示す</li>
                <li>• 返信を強要しない姿勢</li>
                <li>• 具体的な出会いの場面を記載</li>
                <li>• 自分の身元を明確にする</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-red-700 mb-4">❌ 避けるべき行動</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• 一方的で馴れ馴れしい文面</li>
                <li>• 営業・宣伝的な内容</li>
                <li>• 返信を急かす表現</li>
                <li>• 曖昧な身元の伝え方</li>
                <li>• 過度な感嘆符や装飾</li>
                <li>• 連続でのメッセージ送信</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 p-6 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">⚠️ 重要な注意事項</h3>
            <p className="text-yellow-700">
              Facebook Messengerの24時間ポリシーにより、初回連絡では相手からの先制メッセージが必要な場合があります。
              送信が失敗した場合は、別の方法（友達申請、共通の知人を通じた紹介など）でのコンタクトをご検討ください。
            </p>
          </div>
          
          <div className="mt-6 p-6 bg-blue-50 rounded-lg border-l-4 border-blue-400">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">💡 成功のコツ</h3>
            <ul className="text-blue-700 space-y-1">
              <li>• 相手の記憶に残りそうな具体的なエピソードを含める</li>
              <li>• 共通の知人がいる場合は必ず言及する</li>
              <li>• 時間をかけて丁寧に文面を考える</li>
              <li>• 相手の都合を最優先に考える</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export const metadata = {
  title: '知り合い候補への適切な連絡 | PyMessenger Agent',
  description: '知り合いかもしれない方への丁寧で失礼のない初回連絡を支援するシステム'
}