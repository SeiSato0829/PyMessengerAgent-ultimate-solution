'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'

export function DirectMessageSender() {
  const [recipientId, setRecipientId] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [accessToken, setAccessToken] = useState('')

  const sendDirectMessage = async () => {
    if (!recipientId || !message) {
      setError('受信者IDとメッセージは必須です')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/messages/send-direct-new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientId,
          message,
          accessToken
        })
      })

      const data = await response.json()

      if (response.ok) {
        setResult(data)
        setMessage('')
      } else {
        setError(data.error || '送信に失敗しました')
      }
    } catch (err: any) {
      setError(err.message || 'ネットワークエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const getRecipientIdFromUrl = (url: string) => {
    try {
      const match = url.match(/(?:facebook\.com\/|fb\.com\/)([^/?]+)/)
      if (match) {
        return match[1]
      }
      return url
    } catch {
      return url
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Direct Message Sender</CardTitle>
        <CardDescription>
          友達じゃない人にも直接メッセージを送信
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">実装済み機能</h3>
          <ul className="text-sm space-y-1 text-blue-800">
            <li>✅ PC版Messengerと同じ仕様で実装</li>
            <li>✅ 友達じゃない人へのメッセージ送信対応</li>
            <li>✅ メッセージリクエストとして送信</li>
            <li>✅ 相手が承認すれば会話継続可能</li>
          </ul>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              受信者ID または プロフィールURL
            </label>
            <Input
              placeholder="例: 100012345678901 または https://facebook.com/username"
              value={recipientId}
              onChange={(e) => setRecipientId(getRecipientIdFromUrl(e.target.value))}
            />
            <p className="text-xs text-gray-500 mt-1">
              FacebookプロフィールURLから自動的にIDを抽出します
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              受信者の名前（オプション）
            </label>
            <Input
              placeholder="表示用の名前"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              メッセージ内容
            </label>
            <Textarea
              placeholder="送信するメッセージを入力..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              アクセストークン（オプション）
            </label>
            <Input
              type="password"
              placeholder="Facebook User Access Token"
              value={accessToken}
              onChange={(e) => setAccessToken(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">
              未入力の場合は環境変数のトークンを使用します
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={sendDirectMessage} 
            disabled={loading || !recipientId || !message}
            className="flex-1"
          >
            {loading ? '送信中...' : 'メッセージを送信'}
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertTitle>エラー</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {result && result.success && (
          <Alert>
            <AlertTitle>送信成功！</AlertTitle>
            <AlertDescription>
              <div className="space-y-2">
                <p>{result.info?.status || 'メッセージが送信されました'}</p>
                {result.info?.description && (
                  <p className="text-sm text-gray-600">{result.info.description}</p>
                )}
                <div className="flex gap-2 mt-2">
                  <Badge>Message ID: {result.messageId}</Badge>
                  <Badge variant="outline">To: {recipientName || result.recipientId}</Badge>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="border-t pt-4">
          <h4 className="font-semibold mb-2">仕組みの説明</h4>
          <div className="space-y-2 text-sm text-gray-600">
            <p>
              1. PC版Messengerと同じく、友達じゃない人にもメッセージを送信できます
            </p>
            <p>
              2. メッセージは「メッセージリクエスト」として送信されます
            </p>
            <p>
              3. 相手のメッセージリクエストフォルダに届きます
            </p>
            <p>
              4. 相手が承認すれば通常の会話が可能になります
            </p>
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg">
          <h4 className="font-semibold text-yellow-900 mb-2">注意事項</h4>
          <ul className="text-sm space-y-1 text-yellow-800">
            <li>• 最初のメッセージのみ送信可能</li>
            <li>• 相手が承認するまで追加メッセージは制限される</li>
            <li>• スパムフィルタにかかる可能性がある</li>
            <li>• 相手のプライバシー設定により届かない場合がある</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}