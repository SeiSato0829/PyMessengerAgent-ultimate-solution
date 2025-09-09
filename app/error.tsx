'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('アプリケーションエラー:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center">
        <div className="mb-4">
          <div className="text-6xl text-red-500 mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            エラーが発生しました
          </h1>
          <p className="text-gray-600 mb-6">
            申し訳ございません。システムでエラーが発生しました。
          </p>
        </div>
        <button
          onClick={reset}
          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          再試行
        </button>
      </div>
    </div>
  )
}