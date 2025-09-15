export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">プライバシーポリシー</h1>
        
        <div className="space-y-6 text-gray-700">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. 個人情報の取り扱いについて</h2>
            <p>DM施策（以下、「当社」）は、お客様の個人情報を適切に保護し、管理することを重要な責務と考えております。</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. 収集する情報</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Facebook公開プロフィール情報（名前、プロフィール写真）</li>
              <li>メールアドレス（提供された場合）</li>
              <li>Facebookユーザーに送信されたメッセージの履歴</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. 情報の利用目的</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>サービスの提供および運営</li>
              <li>お客様からのお問い合わせへの対応</li>
              <li>サービスの改善および新機能の開発</li>
              <li>利用統計データの作成（個人を特定できない形式）</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. 情報の第三者提供</h2>
            <p>当社は、以下の場合を除き、お客様の個人情報を第三者に提供することはありません：</p>
            <ul className="list-disc pl-6 space-y-2 mt-2">
              <li>お客様の同意がある場合</li>
              <li>法令に基づく場合</li>
              <li>人の生命、身体または財産の保護のために必要な場合</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. データの保護</h2>
            <p>当社は、お客様の個人情報を適切に管理し、不正アクセス、紛失、破損、改ざん、漏洩などを防ぐため、必要かつ適切な安全対策を実施します。</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Cookieの使用</h2>
            <p>当サービスでは、サービス向上のためCookieを使用することがあります。Cookieの使用を望まない場合は、ブラウザの設定により無効化できます。</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. お問い合わせ</h2>
            <p>個人情報の取り扱いに関するお問い合わせは、以下までご連絡ください：</p>
            <p className="mt-2">メール: privacy@pymessengeragent.com</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. プライバシーポリシーの変更</h2>
            <p>当社は、必要に応じて本プライバシーポリシーを変更することがあります。重要な変更がある場合は、サービス上でお知らせします。</p>
          </section>

          <div className="mt-8 pt-8 border-t border-gray-300">
            <p className="text-sm text-gray-600">最終更新日: 2024年12月15日</p>
            <p className="text-sm text-gray-600">制定日: 2024年12月15日</p>
          </div>
        </div>
      </div>
    </div>
  )
}