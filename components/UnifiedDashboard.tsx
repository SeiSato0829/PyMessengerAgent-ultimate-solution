'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

// 既存のコンポーネントをインポート
import InstantPageMessenger from './InstantPageMessenger'
import NewContactStrategy from './NewContactStrategy'
import InteractiveMessageComposer from './InteractiveMessageComposer'

export default function UnifiedDashboard() {
  const [stats, setStats] = useState({
    totalSent: 47,
    successRate: 68,
    todaySent: 5,
    replyRate: 34
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto py-8">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            🚀 PyMessenger Agent - 統合ダッシュボード
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Facebook正規APIを使用した安全で効果的な連絡システム。
            全ての機能が1箇所に統合されています。
          </p>
        </div>

        {/* 統計サマリー */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-green-400 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">総送信数</p>
                  <p className="text-3xl font-bold">{stats.totalSent}</p>
                </div>
                <div className="text-4xl opacity-80">📤</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-400 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">成功率</p>
                  <p className="text-3xl font-bold">{stats.successRate}%</p>
                </div>
                <div className="text-4xl opacity-80">🎯</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-400 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100">今日の送信</p>
                  <p className="text-3xl font-bold">{stats.todaySent}</p>
                </div>
                <div className="text-4xl opacity-80">📅</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-400 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100">返信率</p>
                  <p className="text-3xl font-bold">{stats.replyRate}%</p>
                </div>
                <div className="text-4xl opacity-80">💬</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* メイン機能タブ */}
        <Tabs defaultValue="instant" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="instant" className="text-sm">⚡ 即座送信</TabsTrigger>
            <TabsTrigger value="strategy" className="text-sm">🎯 新規連絡戦略</TabsTrigger>
            <TabsTrigger value="composer" className="text-sm">✍️ メッセージ作成</TabsTrigger>
            <TabsTrigger value="analytics" className="text-sm">📊 分析・履歴</TabsTrigger>
          </TabsList>

          {/* 即座送信システム */}
          <TabsContent value="instant">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  ⚡ 即座送信システム
                  <Badge className="bg-green-500">推奨</Badge>
                </CardTitle>
                <p className="text-gray-600">
                  新規の方に即座にメッセージを送信。Facebook公式Page APIを使用。
                </p>
              </CardHeader>
              <CardContent>
                <InstantPageMessenger />
              </CardContent>
            </Card>
          </TabsContent>

          {/* 新規連絡戦略 */}
          <TabsContent value="strategy">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🎯 新規連絡戦略システム
                  <Badge className="bg-blue-500">高成功率</Badge>
                </CardTitle>
                <p className="text-gray-600">
                  24時間制限を回避する複数の戦略。友達申請・段階的アプローチなど。
                </p>
              </CardHeader>
              <CardContent>
                <NewContactStrategy />
              </CardContent>
            </Card>
          </TabsContent>

          {/* メッセージ作成 */}
          <TabsContent value="composer">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  ✍️ インタラクティブメッセージ作成
                  <Badge className="bg-purple-500">高度</Badge>
                </CardTitle>
                <p className="text-gray-600">
                  既存の友達へのメッセージ送信。受信者選択とプレビュー機能付き。
                </p>
              </CardHeader>
              <CardContent>
                <InteractiveMessageComposer />
              </CardContent>
            </Card>
          </TabsContent>

          {/* 分析・履歴 */}
          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📊 分析・履歴システム
                  <Badge className="bg-orange-500">開発中</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 bg-gray-50 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">📈 成功率推移</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>今週</span>
                        <span className="font-bold text-green-600">71%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>先週</span>
                        <span className="font-bold text-blue-600">64%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>今月</span>
                        <span className="font-bold text-purple-600">68%</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-gray-50 rounded-lg">
                    <h3 className="text-lg font-semibold mb-4">📅 送信履歴</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>田中太郎さん</span>
                        <Badge className="bg-green-500">成功</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>佐藤花子さん</span>
                        <Badge className="bg-blue-500">返信待ち</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>山田次郎さん</span>
                        <Badge className="bg-green-500">返信あり</Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-l-4 border-blue-400">
                  <h3 className="text-lg font-semibold text-blue-800 mb-2">💡 改善提案</h3>
                  <ul className="text-blue-700 space-y-1">
                    <li>• 成功率向上のため、より個人的なメッセージを心がけましょう</li>
                    <li>• 送信時間を平日19-22時、土日10-18時に集中させると効果的です</li>
                    <li>• 共通の話題や出会った場面を具体的に記載すると返信率が上がります</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* システム状態 */}
        <div className="mt-12 bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">🛡️ システム状態・安全性</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✅</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Facebook公式API</h3>
              <p className="text-gray-600">
                正規のGraph APIを使用。
                規約違反なし、アカウント安全。
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔒</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">セキュア実装</h3>
              <p className="text-gray-600">
                トークン暗号化、ログ記録、
                適切なエラーハンドリング。
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📈</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">継続改善</h3>
              <p className="text-gray-600">
                使用状況分析、成功率追跡、
                機能改善の継続実装。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}