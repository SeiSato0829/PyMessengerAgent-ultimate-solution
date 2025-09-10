'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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

    try {
      // Simulate sending
      toast.promise(
        new Promise((resolve) => setTimeout(resolve, 2000)),
        {
          loading: `${selectedRecipients.length}件のメッセージを送信中...`,
          success: `${selectedRecipients.length}件のメッセージを送信しました！`,
          error: '送信に失敗しました'
        }
      )

      // Reset form
      setMessage('')
      setSelectedRecipients([])
    } catch (error) {
      console.error('Send error:', error)
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
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-white">インテリジェント メッセージ作成</h2>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsPreview(!isPreview)}
                className="px-3 py-1 bg-white/10 text-white/70 text-sm rounded-lg hover:bg-white/20 transition-all"
              >
                {isPreview ? '編集' : 'プレビュー'}
              </button>
              <button className="p-2 bg-white/10 text-white/70 rounded-lg hover:bg-white/20 transition-all">
                <Settings className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Recipients Section */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white/70 mb-3">
              宛先 ({selectedRecipients.length}件選択中)
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedRecipients.map((recipientId) => {
                const recipient = recipients.find(r => r.id === recipientId)
                return (
                  <motion.div
                    key={recipientId}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center space-x-2 bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-sm"
                  >
                    <User className="h-3 w-3" />
                    <span>{recipient?.name || recipientId}</span>
                    <button
                      onClick={() => removeRecipient(recipientId)}
                      className="hover:text-white transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </motion.div>
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
            <AnimatePresence>
              {showTemplates && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mt-3 bg-white/10 border border-white/20 rounded-xl p-4"
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
                </motion.div>
              )}
            </AnimatePresence>
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
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSend}
                disabled={!message.trim() || selectedRecipients.length === 0}
                className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
                <span>送信 ({selectedRecipients.length})</span>
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}