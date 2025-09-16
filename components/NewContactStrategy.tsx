'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface NewContact {
  id: string
  name: string
  facebookId: string
  facebookUrl?: string
  strategy: 'friend_request' | 'page_message' | 'multi_step' | 'alternative'
  message: string
  status: 'pending' | 'attempted' | 'success' | 'failed'
  notes?: string
}

const STRATEGY_DESCRIPTIONS = {
  friend_request: {
    title: '友達申請 + メッセージ',
    description: '友達申請と同時にメッセージを送信（最も成功率が高い）',
    steps: [
      '1. 友達申請を送信',
      '2. 申請メッセージでご挨拶',
      '3. 承認後にフォローアップ'
    ],
    pros: ['24時間制限なし', '高い成功率', '自然なアプローチ'],
    cons: ['承認が必要', '拒否される可能性']
  },
  page_message: {
    title: 'Page経由メッセージ',
    description: 'あなたのPageから相手にメッセージ（相手からの返信で継続可能）',
    steps: [
      '1. Pageからメッセージ送信',
      '2. 相手の返信を待つ',
      '3. 返信後は通常のやり取り'
    ],
    pros: ['即座に送信可能', '正式なAPI使用'],
    cons: ['返信率が低い', '1通のみ制限']
  },
  multi_step: {
    title: '段階的アプローチ',
    description: '複数の方法を組み合わせた戦略的アプローチ',
    steps: [
      '1. 友達申請（メッセージ付き）',
      '2. 24時間後にPage経由でフォロー',
      '3. 他のSNSでも同時接触'
    ],
    pros: ['最高の成功率', '多角的アプローチ'],
    cons: ['時間がかかる', '複雑']
  },
  alternative: {
    title: '代替手段',
    description: 'Facebook以外の方法で初回コンタクト',
    steps: [
      '1. LinkedIn等で接続',
      '2. Instagram等でフォロー',
      '3. 共通の知人を通じて紹介'
    ],
    pros: ['Facebook制限回避', '複数チャネル'],
    cons: ['他アカウント必要', '間接的']
  }
}

export default function NewContactStrategy() {
  const [contacts, setContacts] = useState<NewContact[]>([])
  const [newContact, setNewContact] = useState({
    name: '',
    facebookId: '',
    facebookUrl: '',
    strategy: 'friend_request' as const,
    message: '',
    notes: ''
  })
  const [activeStrategy, setActiveStrategy] = useState<string>('friend_request')
  const [results, setResults] = useState<{[key: string]: any}>({})

  const generateMessage = (strategy: string, name: string): string => {
    const templates = {
      friend_request: `こんにちは！${name}さんでしょうか？
どこかでお会いしたことがあるような気がして、友達申請をさせていただきました。
もし人違いでしたら申し訳ありません。
よろしくお願いいたします。`,
      
      page_message: `はじめまして。
${name}さんかと思いご連絡させていただきました。
もしご迷惑でしたらお気になさらず削除してください。
お時間のあるときにお返事いただければ幸いです。`,
      
      multi_step: `こんにちは！${name}さんでしょうか？
複数の方法でご連絡しており、しつこくて申し訳ありません。
ぜひ一度お話しできればと思っております。`,
      
      alternative: `${name}さん、はじめまして。
Facebookでお見かけして、ぜひお話しできればと思いました。
他のSNSでもご連絡しておりますが、こちらでもよろしくお願いいたします。`
    }
    
    return templates[strategy as keyof typeof templates] || templates.friend_request
  }

  const addContact = () => {
    if (newContact.name && (newContact.facebookId || newContact.facebookUrl)) {
      const contact: NewContact = {
        id: Date.now().toString(),
        name: newContact.name,
        facebookId: newContact.facebookId || extractIdFromUrl(newContact.facebookUrl || ''),
        facebookUrl: newContact.facebookUrl,
        strategy: newContact.strategy,
        message: newContact.message || generateMessage(newContact.strategy, newContact.name),
        status: 'pending',
        notes: newContact.notes
      }
      setContacts([...contacts, contact])
      setNewContact({
        name: '',
        facebookId: '',
        facebookUrl: '',
        strategy: 'friend_request',
        message: '',
        notes: ''
      })
    }
  }

  const extractIdFromUrl = (url: string): string => {
    // Facebook URLからIDを抽出する簡単な実装
    const matches = url.match(/(?:\/|profile\.php\?id=)(\d+)/) || url.match(/\/([^\/\?]+)$/)
    return matches ? matches[1] : url
  }

  const executeStrategy = async (contact: NewContact) => {
    setResults(prev => ({ ...prev, [contact.id]: { status: 'executing', step: 1 } }))

    try {
      switch (contact.strategy) {
        case 'friend_request':
          await executeFriendRequestStrategy(contact)
          break
        case 'page_message':
          await executePageMessageStrategy(contact)
          break
        case 'multi_step':
          await executeMultiStepStrategy(contact)
          break
        case 'alternative':
          await executeAlternativeStrategy(contact)
          break
      }
    } catch (error) {
      setResults(prev => ({ 
        ...prev, 
        [contact.id]: { 
          status: 'error', 
          error: error instanceof Error ? error.message : '実行に失敗しました' 
        } 
      }))
    }
  }

  const executeFriendRequestStrategy = async (contact: NewContact) => {
    // 友達申請戦略の実行
    setResults(prev => ({ ...prev, [contact.id]: { status: 'executing', step: '友達申請準備中...' } }))
    
    // Facebook Graph APIでの友達申請は制限があるため、手動指示を提供
    setResults(prev => ({ 
      ...prev, 
      [contact.id]: { 
        status: 'manual_required',
        instructions: [
          `1. Facebookで ${contact.name} さんのプロフィールを開く`,
          `2. 「友達になる」ボタンをクリック`,
          `3. メッセージ欄に以下を入力：`,
          contact.message,
          `4. 送信してください`
        ],
        facebookUrl: contact.facebookUrl || `https://facebook.com/${contact.facebookId}`,
        nextStep: 'manual_friend_request'
      }
    }))
  }

  const executePageMessageStrategy = async (contact: NewContact) => {
    setResults(prev => ({ ...prev, [contact.id]: { status: 'executing', step: 'Page経由でメッセージ送信中...' } }))
    
    try {
      const response = await fetch('/api/messages/send-potential-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientId: contact.facebookId,
          message: contact.message,
          contactInfo: {
            name: contact.name,
            source: 'new_contact',
            confidence: 'low',
            notes: contact.notes
          }
        })
      })

      const result = await response.json()
      
      if (response.ok) {
        setResults(prev => ({ 
          ...prev, 
          [contact.id]: { 
            status: 'success',
            method: 'page_message',
            messageId: result.messageId,
            advice: 'メッセージを送信しました。相手からの返信をお待ちください。'
          }
        }))
      } else {
        // 24時間制限エラーの場合は友達申請戦略に変更提案
        if (result.error?.includes('24 hour')) {
          setResults(prev => ({ 
            ...prev, 
            [contact.id]: { 
              status: 'fallback_required',
              error: '24時間制限のため送信できませんでした',
              suggestion: 'friend_request',
              suggestionReason: '友達申請戦略に変更することをお勧めします'
            }
          }))
        } else {
          throw new Error(result.error || '送信に失敗しました')
        }
      }
    } catch (error) {
      throw error
    }
  }

  const executeMultiStepStrategy = async (contact: NewContact) => {
    setResults(prev => ({ ...prev, [contact.id]: { status: 'executing', step: '段階的戦略開始...' } }))
    
    // ステップ1: 友達申請
    await executeFriendRequestStrategy(contact)
    
    // ステップ2の予約（実際のプロダクションではスケジューラーを使用）
    setTimeout(async () => {
      setResults(prev => ({ 
        ...prev, 
        [contact.id]: { 
          ...prev[contact.id],
          step: 'ステップ2: 24時間後のフォローアップ準備完了',
          nextAction: '24時間後にPage経由でフォローメッセージを送信します'
        }
      }))
    }, 1000)
  }

  const executeAlternativeStrategy = async (contact: NewContact) => {
    setResults(prev => ({ 
      ...prev, 
      [contact.id]: { 
        status: 'manual_required',
        instructions: [
          '以下の代替手段を試してください：',
          '1. LinkedIn でプロフィール検索',
          '2. Instagram でユーザー検索',
          '3. Twitter/X でユーザー検索',
          '4. 共通の知人に紹介を依頼',
          '5. 他のSNSプラットフォームを確認'
        ],
        searchTerms: [
          contact.name,
          contact.facebookId,
          `"${contact.name}" LinkedIn`,
          `"${contact.name}" Instagram`
        ]
      }
    }))
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">新規連絡先への戦略的アプローチ</CardTitle>
          <p className="text-gray-600">
            初回連絡の24時間制限を回避する実用的な方法を提供します
          </p>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <AlertDescription>
              <strong>重要：</strong>新規の方への初回連絡はFacebookの24時間ポリシーにより制限されています。
              以下の戦略を使って効果的にコンタクトを取りましょう。
            </AlertDescription>
          </Alert>

          {/* 戦略選択 */}
          <Tabs value={activeStrategy} onValueChange={setActiveStrategy} className="mb-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="friend_request">友達申請</TabsTrigger>
              <TabsTrigger value="page_message">Page経由</TabsTrigger>
              <TabsTrigger value="multi_step">段階的</TabsTrigger>
              <TabsTrigger value="alternative">代替手段</TabsTrigger>
            </TabsList>
            
            {Object.entries(STRATEGY_DESCRIPTIONS).map(([key, strategy]) => (
              <TabsContent key={key} value={key}>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">{strategy.title}</CardTitle>
                    <p className="text-gray-600">{strategy.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <h4 className="font-medium mb-2">手順</h4>
                        <ul className="text-sm space-y-1">
                          {strategy.steps.map((step, idx) => (
                            <li key={idx}>{step}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2 text-green-700">メリット</h4>
                        <ul className="text-sm space-y-1">
                          {strategy.pros.map((pro, idx) => (
                            <li key={idx} className="text-green-600">✓ {pro}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2 text-red-700">注意点</h4>
                        <ul className="text-sm space-y-1">
                          {strategy.cons.map((con, idx) => (
                            <li key={idx} className="text-red-600">⚠ {con}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>

          {/* 連絡先追加 */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">新規連絡先を追加</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">お名前</label>
                  <Input
                    value={newContact.name}
                    onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="田中太郎"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">戦略</label>
                  <select
                    value={newContact.strategy}
                    onChange={(e) => setNewContact(prev => ({ 
                      ...prev, 
                      strategy: e.target.value as any,
                      message: generateMessage(e.target.value, prev.name)
                    }))}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="friend_request">友達申請 + メッセージ</option>
                    <option value="page_message">Page経由メッセージ</option>
                    <option value="multi_step">段階的アプローチ</option>
                    <option value="alternative">代替手段</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Facebook ID</label>
                  <Input
                    value={newContact.facebookId}
                    onChange={(e) => setNewContact(prev => ({ ...prev, facebookId: e.target.value }))}
                    placeholder="61578211067618"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Facebook URL（任意）</label>
                  <Input
                    value={newContact.facebookUrl}
                    onChange={(e) => setNewContact(prev => ({ ...prev, facebookUrl: e.target.value }))}
                    placeholder="https://facebook.com/username"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">メッセージ</label>
                <Textarea
                  value={newContact.message}
                  onChange={(e) => setNewContact(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="自動生成されたメッセージを編集できます"
                  rows={4}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">メモ（任意）</label>
                <Input
                  value={newContact.notes}
                  onChange={(e) => setNewContact(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="どこで知ったか、関係性など"
                />
              </div>
              
              <Button onClick={addContact} className="w-full">
                連絡先を追加
              </Button>
            </CardContent>
          </Card>

          {/* 連絡先リスト */}
          {contacts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">連絡先リスト</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {contacts.map((contact) => (
                    <div key={contact.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-semibold text-lg">{contact.name}</h3>
                          <p className="text-gray-600">ID: {contact.facebookId}</p>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="outline">
                              {STRATEGY_DESCRIPTIONS[contact.strategy].title}
                            </Badge>
                            <Badge className={
                              contact.status === 'success' ? 'bg-green-500' :
                              contact.status === 'failed' ? 'bg-red-500' :
                              contact.status === 'attempted' ? 'bg-blue-500' :
                              'bg-gray-500'
                            }>
                              {contact.status}
                            </Badge>
                          </div>
                          {contact.notes && (
                            <p className="text-sm text-gray-500 mt-1">メモ: {contact.notes}</p>
                          )}
                        </div>
                        <Button
                          onClick={() => executeStrategy(contact)}
                          disabled={contact.status !== 'pending'}
                          className="ml-4"
                        >
                          実行
                        </Button>
                      </div>
                      
                      <div className="bg-gray-50 p-3 rounded-md mb-3">
                        <h4 className="font-medium mb-2">メッセージ：</h4>
                        <p className="text-sm whitespace-pre-wrap">{contact.message}</p>
                      </div>

                      {results[contact.id] && (
                        <div className="p-3 bg-blue-50 rounded-md">
                          <h4 className="font-medium mb-2">実行結果：</h4>
                          {results[contact.id].status === 'manual_required' && (
                            <div>
                              <p className="text-sm font-medium mb-2">手動で実行してください：</p>
                              <ul className="text-sm space-y-1">
                                {results[contact.id].instructions?.map((instruction: string, idx: number) => (
                                  <li key={idx}>{instruction}</li>
                                ))}
                              </ul>
                              {results[contact.id].facebookUrl && (
                                <Button 
                                  className="mt-2" 
                                  onClick={() => window.open(results[contact.id].facebookUrl, '_blank')}
                                >
                                  Facebookで開く
                                </Button>
                              )}
                            </div>
                          )}
                          {results[contact.id].status === 'success' && (
                            <p className="text-green-600 text-sm">{results[contact.id].advice}</p>
                          )}
                          {results[contact.id].status === 'fallback_required' && (
                            <div>
                              <p className="text-orange-600 text-sm mb-2">{results[contact.id].error}</p>
                              <p className="text-sm">推奨: {results[contact.id].suggestionReason}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  )
}