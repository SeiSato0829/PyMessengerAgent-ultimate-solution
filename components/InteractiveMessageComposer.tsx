'use client'

import { useState, useRef, useEffect } from 'react'
// framer-motion removed for build compatibility
import { 
  Send, 
  User, 
  Image, 
  Paperclip, 
  Smile, 
  Calendar, 
  Target,
  Zap,
  Clock,
  Users,
  X,
  Plus,
  CheckCircle,
  AlertCircle,
  Settings,
  Sparkles
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Recipient {
  id: string
  name: string
  avatar?: string
  lastActive?: string
  responseRate?: number
}

interface MessageTemplate {
  id: string
  name: string
  content: string
  category: string
  variables: string[]
}

interface ScheduleOption {
  type: 'immediate' | 'scheduled' | 'optimal'
  datetime?: string
  timezone?: string
}

export default function InteractiveMessageComposer() {
  const [message, setMessage] = useState('')
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([])
  const [scheduleOption, setScheduleOption] = useState<ScheduleOption>({ type: 'immediate' })
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [showTemplates, setShowTemplates] = useState(false)
  const [showScheduler, setShowScheduler] = useState(false)
  const [isPreview, setIsPreview] = useState(false)
  const [messageStats, setMessageStats] = useState({
    charCount: 0,
    estimatedDeliveryTime: 0,
    estimatedCost: 0,
    riskScore: 'low' as 'low' | 'medium' | 'high'
  })

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [message])

  // Update message stats
  useEffect(() => {
    setMessageStats({
      charCount: message.length,
      estimatedDeliveryTime: selectedRecipients.length * 2, // 2 seconds per message
      estimatedCost: selectedRecipients.length * 0.01,
      riskScore: message.toLowerCase().includes('緊急') || message.toLowerCase().includes('今すぐ') ? 'high' : 'low'
    })
  }, [message, selectedRecipients])

  const handleSend = async () => {
    if (!message.trim() || selectedRecipients.length === 0) {
      toast.error('メッセージと宛先を選択してください')
      return
    }

    // Facebook認証確認
    const authStatus = await checkFacebookAuth()
    if (!authStatus.authenticated) {
      toast.error('Facebook認証が必要です')
      // 認証ウィンドウを自動的に開く
      setTimeout(() => {
        window.open('/api/auth/facebook?action=login', 'facebook-auth', 'width=600,height=700')
      }, 1500)
      return
    }

    try {
      const sendPromises = selectedRecipients.map(async (recipientId, index) => {
        // 2秒間隔で送信（レート制限対応）
        await new Promise(resolve => setTimeout(resolve, index * 2000))
        
        const response = await fetch('/api/messages/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipientId,
            message: message.trim(),
            accountId: authStatus.accountId,
            scheduleTime: scheduleOption.type === 'scheduled' ? scheduleOption.datetime : null
          })
        })

        const result = await response.json()
        
        if (!response.ok) {
          throw new Error(result.error || `送信失敗: ${recipientId}`)
        }

        return {
          recipientId,
          success: result.success,
          messageId: result.messageId,
          error: result.error
        }
      })

      // プログレス付きトースト
      const results = await toast.promise(
        Promise.allSettled(sendPromises),
        {
          loading: `${selectedRecipients.length}件のメッセージを送信中...`,
          success: (results) => {
            const successful = results.filter(r => r.status === 'fulfilled').length
            const failed = results.length - successful
            
            if (failed === 0) {
              return `✅ ${successful}件すべて送信完了！`
            } else {
              return `⚠️ ${successful}件送信、${failed}件失敗`
            }
          },
          error: '送信処理でエラーが発生しました'
        },
        {
          style: {
            minWidth: '300px',
          },
          success: {
            duration: 5000,
            icon: '🚀'
          }
        }
      )

      // 結果の詳細分析
      const detailedResults = results.map(result => 
        result.status === 'fulfilled' ? result.value : { error: result.reason.message }
      )

      // 詳細結果をコンソールに出力（デバッグ用）
      console.log('📊 送信結果詳細:', {
        total: selectedRecipients.length,
        successful: detailedResults.filter(r => r.success).length,
        failed: detailedResults.filter(r => r.error).length,
        details: detailedResults
      })

      // 失敗した送信の詳細表示
      const failures = detailedResults.filter(r => r.error)
      if (failures.length > 0) {
        console.warn('❌ 送信失敗詳細:', failures)
        toast.error(`${failures.length}件の送信に失敗しました。詳細はコンソールを確認してください。`)
      }

      // 成功時はフォームリセット
      const successCount = detailedResults.filter(r => r.success).length
      if (successCount > 0) {
        setMessage('')
        setSelectedRecipients([])
        
        // 成功統計を更新
        updateSendStatistics(successCount, failures.length)
      }

    } catch (error: any) {
      console.error('🔥 Send error:', error)
      toast.error(`送信エラー: ${error.message}`)
    }
  }

  // Facebook認証状態確認
  const checkFacebookAuth = async (): Promise<{authenticated: boolean, accountId?: string, error?: string}> => {
    try {
      const response = await fetch('/api/auth/facebook/status')
      const data = await response.json()
      return data
    } catch (error) {
      return { 
        authenticated: false, 
        error: '認証状態の確認に失敗しました' 
      }
    }
  }

  // 送信統計更新
  const updateSendStatistics = async (successCount: number, failureCount: number) => {
    try {
      await fetch('/api/statistics/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sent: successCount,
          failed: failureCount,
          timestamp: new Date().toISOString()
        })
      })
    } catch (error) {
      console.warn('統計更新失敗:', error)
    }
  }

  const applyTemplate = (template: MessageTemplate) => {
    setMessage(template.content)
    setShowTemplates(false)
    toast.success(`テンプレート「${template.name}」を適用しました`)
  }

  const addRecipient = (recipientId: string) => {
    if (!selectedRecipients.includes(recipientId)) {
      setSelectedRecipients([...selectedRecipients, recipientId])
    }
  }

  const removeRecipient = (recipientId: string) => {
    setSelectedRecipients(selectedRecipients.filter(id => id !== recipientId))
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-400'
      case 'medium': return 'text-yellow-400'
      case 'high': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  return (
    <div
      className="w-full bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden transition-all duration-300 transform hover:scale-[1.01]"
    >
      {/* Header - 8段階レスポンシブ完全対応 */}
      <div className="border-b border-white/10
                    spacing-responsive-xs
                    sm:spacing-responsive-sm
                    md:spacing-responsive-md
                    lg:spacing-responsive-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center min-w-0 flex-1
                        space-x-2
                        sm:space-x-3
                        lg:space-x-4">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0
                          w-6 h-6
                          sm:w-7 sm:h-7
                          md:w-8 md:h-8
                          lg:w-9 lg:h-9
                          xl:w-10 xl:h-10">
              <Sparkles className="text-white
                                h-3 w-3
                                sm:h-3.5 sm:w-3.5
                                md:h-4 md:w-4
                                lg:h-4.5 lg:w-4.5
                                xl:h-5 xl:w-5" />
            </div>
            <h2 className="text-white font-semibold truncate
                         text-responsive-sm
                         sm:text-responsive-base
                         md:text-responsive-lg
                         lg:text-responsive-xl">
              <span className="hidden md:inline">インテリジェント メッセージ作成</span>
              <span className="hidden sm:inline md:hidden">メッセージ作成</span>
              <span className="sm:hidden">作成</span>
            </h2>
          </div>
          <div className="flex items-center space-x-1
                        sm:space-x-2
                        flex-shrink-0">
            <button
              onClick={() => setIsPreview(!isPreview)}
              className="bg-white/10 text-white/70 rounded-lg hover:bg-white/20 transition-all
                       text-xs px-2 py-1
                       sm:text-sm sm:px-3 sm:py-1.5
                       md:px-4"
            >
              <span className="hidden sm:inline">{isPreview ? '編集' : 'プレビュー'}</span>
              <span className="sm:hidden">{isPreview ? '編' : '予'}</span>
            </button>
            <button className="bg-white/10 text-white/70 rounded-lg hover:bg-white/20 transition-all
                             p-1.5
                             sm:p-2
                             md:p-2.5">
              <Settings className="h-3 w-3
                                sm:h-3.5 sm:w-3.5
                                md:h-4 md:w-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="spacing-responsive-sm
                    sm:spacing-responsive-md
                    md:spacing-responsive-lg
                    lg:spacing-responsive-lg">
        {/* Content Body - 8段階レスポンシブ */}
          {/* Recipients Section */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white/70 mb-3">
              宛先 ({selectedRecipients.length}件選択中)
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedRecipients.map((recipientId) => {
                const recipient = recipients.find(r => r.id === recipientId)
                return (
                  <div
                    key={recipientId}
                    className="flex items-center space-x-2 bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-sm animate-fadeIn"
                  >
                    <User className="h-3 w-3" />
                    <span>{recipient?.name || recipientId}</span>
                    <button
                      onClick={() => removeRecipient(recipientId)}
                      className="hover:text-white transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )
              })}
              <button
                onClick={() => {/* Open recipient selector */}}
                className="flex items-center space-x-1 bg-white/10 text-white/70 px-3 py-1 rounded-full text-sm hover:bg-white/20 transition-all"
              >
                <Plus className="h-3 w-3" />
                <span>受信者を追加</span>
              </button>
            </div>
          </div>

          {/* Message Composer */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-white/70">
                メッセージ内容
              </label>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowTemplates(!showTemplates)}
                  className="flex items-center space-x-1 text-xs text-white/70 hover:text-white transition-colors"
                >
                  <Target className="h-3 w-3" />
                  <span>テンプレート</span>
                </button>
                <button className="flex items-center space-x-1 text-xs text-white/70 hover:text-white transition-colors">
                  <Smile className="h-3 w-3" />
                  <span>絵文字</span>
                </button>
              </div>
            </div>

            {isPreview ? (
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 min-h-[120px]">
                <div className="text-white whitespace-pre-wrap">{message || 'メッセージをプレビュー...'}</div>
              </div>
            ) : (
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="メッセージを入力してください..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 resize-none min-h-[120px]"
                  maxLength={1000}
                />
                <div className="absolute bottom-3 right-3 flex items-center space-x-2">
                  <span className={`text-xs ${messageStats.charCount > 800 ? 'text-red-400' : 'text-white/50'}`}>
                    {messageStats.charCount}/1000
                  </span>
                </div>
              </div>
            )}

            {/* Templates Dropdown */}
            {showTemplates && (
              <div
                className="mt-3 bg-white/10 border border-white/20 rounded-xl p-4 animate-slideDown"
              >
                  <h4 className="text-sm font-medium text-white mb-3">テンプレート選択</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {templates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => applyTemplate(template)}
                        className="text-left p-3 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all"
                      >
                        <div className="text-sm font-medium text-white">{template.name}</div>
                        <div className="text-xs text-white/70 mt-1 truncate">{template.content}</div>
                      </button>
                    ))}
                  </div>
              </div>
            )}
          </div>

          {/* Message Statistics */}
          <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/5 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-1">
                <Clock className="h-4 w-4 text-blue-400" />
                <span className="text-xs text-white/70">推定配信時間</span>
              </div>
              <div className="text-sm font-medium text-white">{messageStats.estimatedDeliveryTime}秒</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-1">
                <Users className="h-4 w-4 text-green-400" />
                <span className="text-xs text-white/70">受信者数</span>
              </div>
              <div className="text-sm font-medium text-white">{selectedRecipients.length}件</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-1">
                <Zap className="h-4 w-4 text-yellow-400" />
                <span className="text-xs text-white/70">推定コスト</span>
              </div>
              <div className="text-sm font-medium text-white">¥{messageStats.estimatedCost.toFixed(2)}</div>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-1">
                <AlertCircle className={`h-4 w-4 ${getRiskColor(messageStats.riskScore)}`} />
                <span className="text-xs text-white/70">リスクレベル</span>
              </div>
              <div className={`text-sm font-medium ${getRiskColor(messageStats.riskScore)}`}>
                {messageStats.riskScore.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Schedule Options */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white/70 mb-3">送信タイミング</label>
            <div className="flex space-x-3">
              <button
                onClick={() => setScheduleOption({ type: 'immediate' })}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  scheduleOption.type === 'immediate'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                <Zap className="h-4 w-4" />
                <span>即座に送信</span>
              </button>
              <button
                onClick={() => setShowScheduler(!showScheduler)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  scheduleOption.type === 'scheduled'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                <Calendar className="h-4 w-4" />
                <span>スケジュール送信</span>
              </button>
              <button
                onClick={() => setScheduleOption({ type: 'optimal' })}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  scheduleOption.type === 'optimal'
                    ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                <Target className="h-4 w-4" />
                <span>最適な時間</span>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <div className="flex space-x-2">
              <button className="p-2 bg-white/5 text-white/70 rounded-lg hover:bg-white/10 transition-all">
                <Image className="h-4 w-4" />
              </button>
              <button className="p-2 bg-white/5 text-white/70 rounded-lg hover:bg-white/10 transition-all">
                <Paperclip className="h-4 w-4" />
              </button>
            </div>
            
            <div className="flex space-x-3">
              <button className="px-6 py-2 bg-white/10 text-white/70 rounded-lg hover:bg-white/20 transition-all">
                下書き保存
              </button>
              <button
                onClick={handleSend}
                disabled={!message.trim() || selectedRecipients.length === 0}
                className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
                <span>送信 ({selectedRecipients.length})</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}