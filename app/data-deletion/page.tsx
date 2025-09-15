export default function DataDeletion() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">ユーザーデータの削除</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-4">データ削除リクエスト</h2>
              <p className="text-gray-700 mb-4">
                DM施策アプリケーションから、あなたのデータを削除することができます。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">削除されるデータ</h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Facebookプロフィール情報（名前、ID、プロフィール写真）</li>
                <li>アクセストークン</li>
                <li>メッセージ送信履歴</li>
                <li>キャンペーン設定</li>
                <li>自動化ワークフロー設定</li>
                <li>その他、アプリ内で作成されたすべてのデータ</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">削除手順</h2>
              <ol className="list-decimal pl-6 space-y-3 text-gray-700">
                <li>
                  <strong>方法1: アプリ内から削除</strong>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>アプリにログイン</li>
                    <li>設定メニューを開く</li>
                    <li>「アカウント削除」を選択</li>
                    <li>確認画面で「削除」をクリック</li>
                  </ul>
                </li>
                <li>
                  <strong>方法2: Facebookから削除</strong>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Facebookの設定を開く</li>
                    <li>「アプリとウェブサイト」を選択</li>
                    <li>「DM施策」を探す</li>
                    <li>「削除」をクリック</li>
                  </ul>
                </li>
                <li>
                  <strong>方法3: メールでリクエスト</strong>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>privacy@pymessengeragent.com 宛にメール送信</li>
                    <li>件名: 「データ削除リクエスト」</li>
                    <li>FacebookユーザーIDまたは登録メールアドレスを記載</li>
                    <li>30日以内に削除完了の通知</li>
                  </ul>
                </li>
              </ol>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">削除にかかる時間</h2>
              <p className="text-gray-700">
                データ削除リクエストを受け取ってから、最大30日以内にすべてのデータを削除します。
                法的要件により一部のログデータは最大90日間保持される場合があります。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">削除後の影響</h2>
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <p className="text-gray-700">
                  <strong>注意:</strong> データ削除後は以下の影響があります：
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1 text-gray-700">
                  <li>すべての自動化設定が停止します</li>
                  <li>保存されたメッセージテンプレートが削除されます</li>
                  <li>分析データにアクセスできなくなります</li>
                  <li>削除したデータは復元できません</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">お問い合わせ</h2>
              <p className="text-gray-700">
                データ削除に関するご質問は、以下までお問い合わせください：
              </p>
              <div className="mt-3 p-4 bg-gray-50 rounded">
                <p className="font-semibold">メール: privacy@pymessengeragent.com</p>
                <p className="text-sm text-gray-600 mt-2">対応時間: 平日 9:00-18:00（日本時間）</p>
              </div>
            </section>
          </div>

          <div className="mt-8 pt-8 border-t border-gray-300">
            <p className="text-sm text-gray-600">最終更新日: 2024年12月15日</p>
          </div>
        </div>
      </div>
    </div>
  )
}