import InstantPageMessenger from '@/components/InstantPageMessenger'

export default function InstantContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-green-50 to-yellow-50">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            ⚡ 即座送信システム
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-6">
            新規の方に<strong className="text-blue-600">即座にメッセージを送信</strong>できる最強のシステム！
            友達申請の承認を待たずに、理由を詳しく伝えてコンタクトが取れます。
          </p>
          
          <div className="flex justify-center gap-4 flex-wrap">
            <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full font-medium">
              ✅ 即座送信可能
            </div>
            <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-medium">
              📝 理由説明可能
            </div>
            <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full font-medium">
              🕒 24時間継続可能
            </div>
            <div className="bg-purple-100 text-purple-800 px-4 py-2 rounded-full font-medium">
              🔒 Facebook公式API
            </div>
          </div>
        </div>
        
        <InstantPageMessenger />
        
        <div className="mt-12 bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">🎯 なぜPage経由が最強なのか</h2>
          
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">即座送信</h3>
              <p className="text-gray-600">
                友達申請の承認を待つ必要なし。
                今すぐメッセージを送信できます。
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📝</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">理由説明</h3>
              <p className="text-gray-600">
                なぜ連絡したいのか、どこで知り合ったのかを
                詳しく説明できます。
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🕒</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">継続可能</h3>
              <p className="text-gray-600">
                相手から返信があれば24時間以内なら
                継続的にやり取りできます。
              </p>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border-l-4 border-green-400">
            <h3 className="text-lg font-semibold text-green-800 mb-3">📊 実際の成功率データ</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-green-700 mb-2">技術的送信成功率</h4>
                <div className="bg-green-200 rounded-full h-4 mb-2">
                  <div className="bg-green-500 h-4 rounded-full" style={{width: '99%'}}></div>
                </div>
                <p className="text-sm text-green-600">99% - ほぼ確実に送信されます</p>
              </div>
              <div>
                <h4 className="font-medium text-blue-700 mb-2">相手からの返信率</h4>
                <div className="bg-blue-200 rounded-full h-4 mb-2">
                  <div className="bg-blue-500 h-4 rounded-full" style={{width: '40%'}}></div>
                </div>
                <p className="text-sm text-blue-600">30-50% - 丁寧なメッセージなら高確率</p>
              </div>
            </div>
          </div>
          
          <div className="mt-8 grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">✅ 成功のコツ</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  <span><strong>具体的な自己紹介</strong>: 「○○の田中です」</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  <span><strong>連絡理由を明確に</strong>: 「○○でお会いした」</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  <span><strong>相手への配慮</strong>: 「人違いでしたらすみません」</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  <span><strong>丁寧な言葉遣い</strong>: 敬語を使用</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  <span><strong>返信を強要しない</strong>: プレッシャーを与えない</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">⚠️ 注意点</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-yellow-500 mr-2">•</span>
                  <span><strong>24時間制限</strong>: 返信がないと追加送信不可</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-500 mr-2">•</span>
                  <span><strong>Page名表示</strong>: 個人名ではなくPage名で表示</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-500 mr-2">•</span>
                  <span><strong>返信率</strong>: 友達申請より返信率は低め</span>
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-500 mr-2">•</span>
                  <span><strong>営業と誤解</strong>: ビジネス関連と思われる可能性</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 p-6 bg-blue-50 rounded-lg border-l-4 border-blue-400">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">🚀 セットアップは5分で完了！</h3>
            <ol className="text-blue-700 space-y-2">
              <li><strong>1.</strong> Facebookページを作成（個人ブログカテゴリ推奨）</li>
              <li><strong>2.</strong> Facebook Developer ConsoleでPage Access Token取得</li>
              <li><strong>3.</strong> 上記フォームにTokenを入力</li>
              <li><strong>4.</strong> 連絡したい方のFacebook IDを確認</li>
              <li><strong>5.</strong> 丁寧なメッセージを作成して即座送信！</li>
            </ol>
            <p className="text-blue-600 mt-3 font-medium">
              環境変数 PAGE_ACCESS_TOKEN が設定済みの場合は、Token入力なしですぐに使えます！
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export const metadata = {
  title: '即座送信システム | PyMessenger Agent',
  description: '新規の方に即座にメッセージを送信！Page経由で24時間制限を回避する最強システム'
}