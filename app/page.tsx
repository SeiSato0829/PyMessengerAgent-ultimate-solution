'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // 認証版ダッシュボードに直接リダイレクト
    router.push('/dashboard-auth')
  }, [router])

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-900 to-black flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-4">
          Facebook Messenger 送信システム
        </h1>
        <p className="text-gray-300">リダイレクト中...</p>
      </div>
    </main>
  )
}