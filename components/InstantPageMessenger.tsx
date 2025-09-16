'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'

interface Contact {
  id: string
  name: string
  facebookId: string
  message: string
  status: 'ready' | 'sending' | 'sent' | 'replied' | 'expired'
  sentAt?: string
  expiresAt?: string
  replies?: Array<{
    message: string
    timestamp: string
    isFromUser: boolean
  }>
}

const MESSAGE_TEMPLATES = {
  school: `こんにちは！{name}さんでしょうか？

{school}で一緒だった{yourName}と申します。
久しぶりにお顔を見かけて、懐かしくなってご連絡しました。

もし人違いでしたら申し訳ありません。
お時間のあるときにお返事いただければ嬉しいです。

{yourName}`,

  work: `お疲れ様です。{name}さんでしょうか？

{company}で一緒だった{yourName}と申します。
最近どうされているかなと思い、ご連絡させていただきました。

もし人違いでしたら失礼いたします。
お忙しいと思いますが、お時間のあるときにお返事いただければと思います。

{yourName}`,

  event: `こんにちは！{name}さんでしょうか？

{event}でお会いした{yourName}です。
その節はお話しできて楽しかったです。

もしよろしければ、改めてお話しできればと思いご連絡しました。
お時間のあるときにお返事いただければ嬉しいです。

{yourName}`,

  general: `はじめまして。{name}さんでしょうか？

{yourName}と申します。
どこかでお会いしたことがあるような気がして、ご連絡させていただきました。

もし心当たりがございませんでしたら、申し訳ありません。
お時間のあるときにお返事いただければと思います。

{yourName}`
}

export default function InstantPageMessenger() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [pageAccessToken, setPageAccessToken] = useState('')
  const [templateVars, setTemplateVars] = useState({
    yourName: '',
    school: '',
    company: '',
    event: ''
  })
  const [newContact, setNewContact] = useState({
    name: '',
    facebookId: '',
    template: 'general',
    customMessage: ''
  })
  const [results, setResults] = useState<{[key: string]: any}>({})

  // 24時間タイマー監視
  useEffect(() => {
    const interval = setInterval(() => {
      setContacts(prev => prev.map(contact => {
        if (contact.status === 'sent' && contact.expiresAt) {
          const now = new Date().getTime()
          const expiresAt = new Date(contact.expiresAt).getTime()
          if (now > expiresAt) {
            return { ...contact, status: 'expired' as const }
          }
        }
        return contact
      }))
    }, 60000) // 1分ごとにチェック

    return () => clearInterval(interval)
  }, [])

  const generateMessage = (template: string, name: string): string => {
    if (newContact.customMessage) return newContact.customMessage

    const messageTemplate = MESSAGE_TEMPLATES[template as keyof typeof MESSAGE_TEMPLATES] || MESSAGE_TEMPLATES.general
    
    return messageTemplate
      .replace(/\{name\}/g, name)
      .replace(/\{yourName\}/g, templateVars.yourName)
      .replace(/\{school\}/g, templateVars.school)
      .replace(/\{company\}/g, templateVars.company)
      .replace(/\{event\}/g, templateVars.event)
  }

  const addContact = () => {
    if (newContact.name && newContact.facebookId && templateVars.yourName) {
      const contact: Contact = {
        id: Date.now().toString(),
        name: newContact.name,
        facebookId: newContact.facebookId,
        message: generateMessage(newContact.template, newContact.name),
        status: 'ready',
        replies: []
      }
      setContacts([...contacts, contact])
      setNewContact({
        name: '',
        facebookId: '',
        template: 'general',
        customMessage: ''
      })
    }
  }

  const sendInstantMessage = async (contact: Contact) => {
    setContacts(prev => prev.map(c => 
      c.id === contact.id ? { ...c, status: 'sending' } : c
    ))

    try {
      const response = await fetch('/api/messages/send-instant-page', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipientId: contact.facebookId,
          message: contact.message,
          pageAccessToken: pageAccessToken,
          contactInfo: {
            name: contact.name,
            source: 'instant_contact',
            priority: 'high'
          }
        })
      })

      const result = await response.json()
      
      if (response.ok) {
        const now = new Date()
        const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24時間後

        setContacts(prev => prev.map(c => 
          c.id === contact.id ? {
            ...c,
            status: 'sent',
            sentAt: now.toISOString(),
            expiresAt: expiresAt.toISOString()
          } : c
        ))

        setResults(prev => ({
          ...prev,
          [contact.id]: {
            success: true,
            messageId: result.messageId,
            sentAt: now.toISOString(),
            expiresAt: expiresAt.toISOString()
          }
        }))
      } else {
        setContacts(prev => prev.map(c => 
          c.id === contact.id ? { ...c, status: 'ready' } : c
        ))

        setResults(prev => ({
          ...prev,
          [contact.id]: {
            success: false,
            error: result.error,
            suggestion: result.solution || result.alternatives
          }
        }))
      }
    } catch (error) {
      setContacts(prev => prev.map(c => 
        c.id === contact.id ? { ...c, status: 'ready' } : c
      ))

      setResults(prev => ({
        ...prev,
        [contact.id]: {
          success: false,
          error: '送信に失敗しました',
          details: error instanceof Error ? error.message : '不明なエラー'
        }
      }))
    }
  }

  const sendFollowUp = async (contact: Contact, followUpMessage: string) => {
    try {
      const response = await fetch('/api/messages/send-instant-page', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipientId: contact.facebookId,
          message: followUpMessage,
          pageAccessToken: pageAccessToken,
          contactInfo: {
            name: contact.name,
            source: 'follow_up',
            priority: 'normal'
          }
        })
      })

      const result = await response.json()
      
      if (response.ok) {
        setContacts(prev => prev.map(c => 
          c.id === contact.id ? {
            ...c,
            replies: [...(c.replies || []), {
              message: followUpMessage,
              timestamp: new Date().toISOString(),
              isFromUser: true
            }]
          } : c
        ))
      }
    } catch (error) {
      console.error('フォローアップ送信エラー:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-blue-500'
      case 'sending': return 'bg-yellow-500'
      case 'replied': return 'bg-green-500'
      case 'expired': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ready': return '送信準備完了'
      case 'sending': return '送信中...'
      case 'sent': return '送信完了・返信待ち'
      case 'replied': return '返信あり・継続可能'
      case 'expired': return '24時間経過'
      default: return status
    }
  }

  const getTimeRemaining = (expiresAt?: string): string => {
    if (!expiresAt) return ''
    
    const now = new Date().getTime()
    const expires = new Date(expiresAt).getTime()
    const diff = expires - now
    
    if (diff <= 0) return '期限切れ'
    
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    return `残り ${hours}時間${minutes}分`
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">⚡ 即座送信！Page経由メッセージシステム</CardTitle>
          <p className="text-gray-600">
            24時間制限なしで即座にメッセージを送信！理由も伝えられる最強の初回連絡システム
          </p>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertDescription>
              <strong>✅ 最大のメリット:</strong> 友達申請の承認を待たずに即座にメッセージを送信でき、
              相手に連絡理由をしっかり伝えることができます！
            </AlertDescription>
          </Alert>

          {/* Page Access Token設定 */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">🔑 Page Access Token設定</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Page Access Token</label>
                  <Input
                    type="password"
                    value={pageAccessToken}
                    onChange={(e) => setPageAccessToken(e.target.value)}
                    placeholder="Facebook PageのAccess Tokenを入力"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    取得方法: Facebook Developer Console → あなたのApp → Messenger → Settings → Page Access Tokens
                  </p>
                </div>
                {!pageAccessToken && (
                  <Alert className="border-yellow-200 bg-yellow-50">
                    <AlertDescription>
                      Page Access Tokenの設定が必要です。環境変数 PAGE_ACCESS_TOKEN が設定されている場合は空欄でも動作します。
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 基本情報設定 */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">👤 あなたの基本情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">あなたのお名前 *</label>
                  <Input
                    value={templateVars.yourName}
                    onChange={(e) => setTemplateVars(prev => ({ ...prev, yourName: e.target.value }))}
                    placeholder="田中太郎"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">学校名（該当する場合）</label>
                  <Input
                    value={templateVars.school}
                    onChange={(e) => setTemplateVars(prev => ({ ...prev, school: e.target.value }))}
                    placeholder="○○大学"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">会社名（該当する場合）</label>
                  <Input
                    value={templateVars.company}
                    onChange={(e) => setTemplateVars(prev => ({ ...prev, company: e.target.value }))}
                    placeholder="株式会社○○"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">イベント名（該当する場合）</label>
                  <Input
                    value={templateVars.event}
                    onChange={(e) => setTemplateVars(prev => ({ ...prev, event: e.target.value }))}
                    placeholder="○○セミナー"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 連絡先追加 */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">📝 新規連絡先を追加</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">相手のお名前</label>
                  <Input
                    value={newContact.name}
                    onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="佐藤花子"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Facebook ID</label>
                  <Input
                    value={newContact.facebookId}
                    onChange={(e) => setNewContact(prev => ({ ...prev, facebookId: e.target.value }))}
                    placeholder="61578211067618"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-2">メッセージテンプレート</label>
                  <select
                    value={newContact.template}
                    onChange={(e) => setNewContact(prev => ({ ...prev, template: e.target.value }))}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="school">学校関係</option>
                    <option value="work">職場関係</option>
                    <option value="event">イベント関係</option>
                    <option value="general">一般的な出会い</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">メッセージプレビュー</label>
                <div className="bg-gray-50 p-3 rounded-md border min-h-[100px]">
                  <pre className="text-sm whitespace-pre-wrap">
                    {generateMessage(newContact.template, newContact.name || '相手の方')}
                  </pre>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">カスタムメッセージ（任意）</label>
                <Textarea
                  value={newContact.customMessage}
                  onChange={(e) => setNewContact(prev => ({ ...prev, customMessage: e.target.value }))}
                  placeholder="独自のメッセージを入力する場合"
                  rows={4}
                />
              </div>
              
              <Button 
                onClick={addContact} 
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={!newContact.name || !newContact.facebookId || !templateVars.yourName}
              >
                ⚡ 連絡先を追加（即座送信準備）
              </Button>
            </CardContent>
          </Card>

          {/* 連絡先リスト */}
          {contacts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">📤 送信リスト・管理画面</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {contacts.map((contact) => (
                    <div key={contact.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{contact.name}</h3>
                          <p className="text-gray-600">ID: {contact.facebookId}</p>
                          <div className="flex gap-2 mt-2">
                            <Badge className={getStatusColor(contact.status)}>
                              {getStatusText(contact.status)}
                            </Badge>
                            {contact.status === 'sent' && contact.expiresAt && (
                              <Badge variant="outline" className="text-orange-600">
                                ⏰ {getTimeRemaining(contact.expiresAt)}
                              </Badge>
                            )}
                          </div>
                          {contact.sentAt && (
                            <p className="text-sm text-gray-500 mt-1">
                              送信時刻: {new Date(contact.sentAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {contact.status === 'ready' && (
                            <Button
                              onClick={() => sendInstantMessage(contact)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              ⚡ 即座送信
                            </Button>
                          )}
                          {contact.status === 'sent' && (
                            <Button
                              onClick={() => {
                                const followUp = prompt('フォローアップメッセージを入力:')
                                if (followUp) sendFollowUp(contact, followUp)
                              }}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              📝 追加送信
                            </Button>
                          )}
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 p-3 rounded-md mb-3">
                        <h4 className="font-medium mb-2">送信メッセージ:</h4>
                        <p className="text-sm whitespace-pre-wrap">{contact.message}</p>
                      </div>

                      {results[contact.id] && (
                        <div className={`p-3 rounded-md ${
                          results[contact.id].success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                        }`}>
                          <h4 className="font-medium mb-2">
                            {results[contact.id].success ? '✅ 送信成功！' : '❌ 送信失敗'}
                          </h4>
                          {results[contact.id].success ? (
                            <div className="text-sm">
                              <p className="text-green-700">
                                メッセージID: {results[contact.id].messageId}
                              </p>
                              <p className="text-green-700">
                                24時間以内に返信があれば継続的にやり取りできます！
                              </p>
                              <p className="font-medium text-green-800 mt-2">
                                期限: {results[contact.id].expiresAt ? 
                                  new Date(results[contact.id].expiresAt).toLocaleString() : ''}
                              </p>
                            </div>
                          ) : (
                            <div className="text-sm">
                              <p className="text-red-700">{results[contact.id].error}</p>
                              {results[contact.id].suggestion && (
                                <p className="text-red-600 mt-1">
                                  解決策: {JSON.stringify(results[contact.id].suggestion)}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {contact.replies && contact.replies.length > 0 && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-md border border-blue-200">
                          <h4 className="font-medium mb-2">💬 会話履歴</h4>
                          <div className="space-y-2">
                            {contact.replies.map((reply, idx) => (
                              <div key={idx} className={`text-sm p-2 rounded ${
                                reply.isFromUser ? 'bg-blue-100 ml-4' : 'bg-white mr-4'
                              }`}>
                                <p>{reply.message}</p>
                                <p className="text-xs text-gray-500">
                                  {new Date(reply.timestamp).toLocaleString()}
                                </p>
                              </div>
                            ))}
                          </div>
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