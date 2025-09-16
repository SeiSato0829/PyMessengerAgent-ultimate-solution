import NewContactStrategy from '@/components/NewContactStrategy'

export default function NewContactsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            新規連絡先への戦略的アプローチ
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            初回連絡の24時間制限を回避し、新規の方と効果的にコンタクトを取るための
            実用的な戦略とツールを提供します。
          </p>
        </div>
        
        <NewContactStrategy />
        
        <div className="mt-12 bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">24時間制限とその対策</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-red-700 mb-4">❌ 24時間制限とは</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• 新規の相手に初回メッセージを送信できない</li>
                <li>• 相手からメッセージをもらってから24時間のみ送信可能</li>
                <li>• Facebook Messengerの公式制限</li>
                <li>• Page経由でも同様の制限が適用</li>
                <li>• スパム防止のための仕組み</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-green-700 mb-4">✅ 効果的な対策</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• <strong>友達申請</strong>: メッセージ付きで送信</li>
                <li>• <strong>複数チャネル</strong>: 他のSNSも併用</li>
                <li>• <strong>段階的アプローチ</strong>: 時間差で接触</li>
                <li>• <strong>共通の知人</strong>: 紹介を依頼</li>
                <li>• <strong>自然な出会い</strong>: イベント等での接触</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-8 p-6 bg-blue-50 rounded-lg border-l-4 border-blue-400">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">🎯 推奨戦略ランキング</h3>
            <ol className="text-blue-700 space-y-2">
              <li><strong>1位: 友達申請 + メッセージ</strong> - 成功率90%以上</li>
              <li><strong>2位: 段階的アプローチ</strong> - 複数手段で確実性向上</li>
              <li><strong>3位: 代替SNS経由</strong> - Facebook制限を完全回避</li>
              <li><strong>4位: Page経由メッセージ</strong> - 即座だが返信率低い</li>
            </ol>
          </div>
          
          <div className="mt-6 p-6 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">⚠️ 重要な注意事項</h3>
            <ul className="text-yellow-700 space-y-1">
              <li>• 相手に迷惑をかけないよう丁寧な文面を心がける</li>
              <li>• 一度に複数の方法で接触しすぎない</li>
              <li>• 返信がない場合は追加のアプローチを控える</li>
              <li>• プライバシー設定により連絡できない場合がある</li>
            </ul>
          </div>

          <div className="mt-6 p-6 bg-green-50 rounded-lg border-l-4 border-green-400">
            <h3 className="text-lg font-semibold text-green-800 mb-2">💡 成功のコツ</h3>
            <ul className="text-green-700 space-y-1">
              <li>• <strong>タイミング</strong>: 相手がアクティブな時間帯を狙う</li>
              <li>• <strong>共通点</strong>: プロフィールから共通の話題を見つける</li>
              <li>• <strong>自然さ</strong>: 偶然の出会いを演出する</li>
              <li>• <strong>価値提供</strong>: 相手にとって有益な情報を含める</li>
              <li>• <strong>フォローアップ</strong>: 適切なタイミングでの再接触</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export const metadata = {
  title: '新規連絡先への戦略的アプローチ | PyMessenger Agent',
  description: '24時間制限を回避して新規の方と効果的にコンタクトを取るための戦略ツール'
}