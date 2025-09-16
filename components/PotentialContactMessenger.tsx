'use client'

import React, { useState } from 'react'
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
  source: string // 'school', 'work', 'mutual', 'event', etc.
  confidence: 'high' | 'medium' | 'low'
  notes?: string
}

const POLITE_TEMPLATES = {
  school: `こんにちは！
{name}さんでしょうか？
{school}で一緒だった{yourName}です。
もし違っていたらすみません。
お元気でしたか？`,

  work: `お疲れ様です。
{name}さんかと思いご連絡しました。
{company}で一緒だった{yourName}です。
もし人違いでしたら失礼いたします。`,

  mutual: `はじめまして。
{mutualFriend}さんの紹介で{yourName}と申します。
{name}さんかと思いご連絡させていただきました。
もしご迷惑でしたらお気になさらず削除してください。`,

  event: `こんにちは！
{event}でお会いした{yourName}です。
{name}さんかと思いご連絡しました。
もし違っていたらすみません。`,

  general: `こんにちは。
どこかでお会いしたことがあるような気がして
ご連絡させていただきました。
もし人違いでしたら失礼いたします。
{yourName}と申します。`
}

export default function PotentialContactMessenger() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string>('general')
  const [customMessage, setCustomMessage] = useState<string>('')
  const [templateVars, setTemplateVars] = useState({
    yourName: '',
    name: '',
    school: '',
    company: '',
    mutualFriend: '',
    event: ''
  })
  const [newContact, setNewContact] = useState({
    name: '',
    facebookId: '',
    source: 'general',
    confidence: 'medium' as const,
    notes: ''
  })
  const [sendingStatus, setSendingStatus] = useState<{[key: string]: 'idle' | 'sending' | 'sent' | 'error'}>({})
  const [results, setResults] = useState<{[key: string]: any}>({})

  const addContact = () => {
    if (newContact.name && newContact.facebookId) {
      const contact: Contact = {
        id: Date.now().toString(),
        ...newContact
      }
      setContacts([...contacts, contact])
      setNewContact({
        name: '',
        facebookId: '',
        source: 'general',
        confidence: 'medium',
        notes: ''
      })
    }
  }

  const generateMessage = (contact: Contact): string => {
    if (customMessage) return customMessage

    const template = POLITE_TEMPLATES[contact.source as keyof typeof POLITE_TEMPLATES] || POLITE_TEMPLATES.general
    
    return template
      .replace(/\{name\}/g, contact.name)
      .replace(/\{yourName\}/g, templateVars.yourName)
      .replace(/\{school\}/g, templateVars.school)
      .replace(/\{company\}/g, templateVars.company)
      .replace(/\{mutualFriend\}/g, templateVars.mutualFriend)
      .replace(/\{event\}/g, templateVars.event)
  }

  const sendMessage = async (contact: Contact) => {
    setSendingStatus(prev => ({ ...prev, [contact.id]: 'sending' }))
    
    try {
      const message = generateMessage(contact)
      
      const response = await fetch('/api/messages/send-potential-contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipientId: contact.facebookId,
          message: message,
          contactInfo: {
            name: contact.name,
            source: contact.source,
            confidence: contact.confidence,
            notes: contact.notes
          }
        })
      })

      const result = await response.json()
      
      if (response.ok) {
        setSendingStatus(prev => ({ ...prev, [contact.id]: 'sent' }))
        setResults(prev => ({ ...prev, [contact.id]: result }))
      } else {
        setSendingStatus(prev => ({ ...prev, [contact.id]: 'error' }))
        setResults(prev => ({ ...prev, [contact.id]: result }))
      }
    } catch (error) {
      setSendingStatus(prev => ({ ...prev, [contact.id]: 'error' }))
      setResults(prev => ({ ...prev, [contact.id]: { error: '送信に失敗しました' } }))
    }
  }

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-500'
      case 'sending': return 'bg-blue-500'
      case 'error': return 'bg-red-500'
      default: return 'bg-gray-300'
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">知り合い候補への丁寧な連絡システム</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <AlertDescription>
              <strong>重要：</strong>この機能は「知り合いかもしれない」方への丁寧で適切な初回連絡専用です。
              相手の立場を尊重し、失礼のないようご利用ください。
            </AlertDescription>
          </Alert>

          {/* 基本情報設定 */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">基本情報</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">あなたのお名前</label>
                  <Input
                    value={templateVars.yourName}
                    onChange={(e) => setTemplateVars(prev => ({ ...prev, yourName: e.target.value }))}
                    placeholder="山田太郎"
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
                  <label className="block text-sm font-medium mb-2">共通の知人（該当する場合）</label>
                  <Input
                    value={templateVars.mutualFriend}
                    onChange={(e) => setTemplateVars(prev => ({ ...prev, mutualFriend: e.target.value }))}
                    placeholder="田中花子さん"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 連絡先追加 */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">連絡先を追加</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">お名前</label>
                  <Input
                    value={newContact.name}
                    onChange={(e) => setNewContact(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="田中花子"
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
                <div>
                  <label className="block text-sm font-medium mb-2">知り合った場面</label>
                  <select
                    value={newContact.source}
                    onChange={(e) => setNewContact(prev => ({ ...prev, source: e.target.value }))}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="school">学校</option>
                    <option value="work">職場</option>
                    <option value="mutual">共通の知人</option>
                    <option value="event">イベント</option>
                    <option value="general">一般的な出会い</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">確信度</label>
                  <select
                    value={newContact.confidence}
                    onChange={(e) => setNewContact(prev => ({ ...prev, confidence: e.target.value as 'high' | 'medium' | 'low' }))}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="high">高い（確実に知り合い）</option>
                    <option value="medium">中程度（多分知り合い）</option>
                    <option value="low">低い（知り合いかもしれない）</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">メモ（任意）</label>
                <Input
                  value={newContact.notes}
                  onChange={(e) => setNewContact(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="どこで会ったか、どんな話をしたかなど"
                />
              </div>
              <Button onClick={addContact} className="w-full">
                連絡先を追加
              </Button>
            </CardContent>
          </Card>

          {/* メッセージカスタマイズ */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">メッセージ設定</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">カスタムメッセージ（空欄の場合は自動生成）</label>
                  <Textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="独自のメッセージを入力（任意）"
                    rows={4}
                  />
                </div>
              </div>
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
                            <Badge variant="outline">{contact.source}</Badge>
                            <Badge className={getConfidenceColor(contact.confidence)}>
                              確信度: {contact.confidence}
                            </Badge>
                            {sendingStatus[contact.id] && (
                              <Badge className={getStatusColor(sendingStatus[contact.id])}>
                                {sendingStatus[contact.id] === 'sending' && '送信中...'}
                                {sendingStatus[contact.id] === 'sent' && '送信完了'}
                                {sendingStatus[contact.id] === 'error' && '送信失敗'}
                              </Badge>
                            )}
                          </div>
                          {contact.notes && (
                            <p className="text-sm text-gray-500 mt-1">メモ: {contact.notes}</p>
                          )}
                        </div>
                        <Button
                          onClick={() => sendMessage(contact)}
                          disabled={sendingStatus[contact.id] === 'sending' || sendingStatus[contact.id] === 'sent'}
                          className="ml-4"
                        >
                          {sendingStatus[contact.id] === 'sending' ? '送信中...' :
                           sendingStatus[contact.id] === 'sent' ? '送信済み' : '送信'}
                        </Button>
                      </div>
                      
                      <div className="bg-gray-50 p-3 rounded-md">
                        <h4 className="font-medium mb-2">送信予定メッセージ：</h4>
                        <p className="text-sm whitespace-pre-wrap">{generateMessage(contact)}</p>
                      </div>

                      {results[contact.id] && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-md">
                          <h4 className="font-medium mb-2">送信結果：</h4>
                          <pre className="text-xs overflow-x-auto">
                            {JSON.stringify(results[contact.id], null, 2)}
                          </pre>
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