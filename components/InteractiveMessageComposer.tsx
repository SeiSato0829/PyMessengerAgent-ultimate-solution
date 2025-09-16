'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  Send, 
  Paperclip, 
  Smile, 
  Image, 
  Video, 
  Mic, 
  MoreHorizontal,
  X,
  Upload,
  FileText,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Edit3,
  Save,
  AlertCircle,
  CheckCircle,
  Clock,
  Users,
  Hash,
  Settings,
  Zap,
  Camera,
  MapPin,
  Calendar,
  Star,
  Heart,
  ThumbsUp,
  MessageSquare,
  Share,
  Download,
  Trash2,
  RotateCcw,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Globe,
  Shield,
  Layers,
  Target,
  Filter,
  Search,
  Bell,
  BookOpen,
  Code,
  Database,
  Cloud,
  Smartphone,
  Monitor,
  Tablet,
  Watch,
  Headphones,
  Wifi,
  Battery,
  Signal,
  Bluetooth,
  Usb,
  HardDrive,
  Cpu,
  Memory,
  Network,
  Server,
  Router,
  Firewall,
  Key,
  Fingerprint,
  QrCode,
  Scan,
  Link,
  ExternalLink,
  Home,
  Building,
  Car,
  Plane,
  Train,
  Ship,
  Truck,
  Bike,
  Walk,
  Run,
  Swim,
  Game,
  Music,
  Movie,
  Book,
  Newspaper,
  Magazine,
  Radio,
  Tv,
  Camera as CameraIcon,
  Camcorder,
  Speaker,
  Microphone,
  Keyboard,
  Mouse,
  Printer,
  Scanner,
  Projector,
  Screen,
  Remote,
  Gamepad,
  Joystick,
  Dice,
  Puzzle,
  Trophy,
  Medal,
  Award,
  Flag,
  Crown,
  Diamond,
  Gem,
  Ring,
  Necklace,
  Watch as WatchIcon,
  Glasses,
  Hat,
  Shirt,
  Pants,
  Shoes,
  Bag,
  Umbrella,
  Coat,
  Scarf,
  Gloves,
  Socks
} from 'lucide-react'
import toast from 'react-hot-toast'

interface MessageData {
  id: string
  content: string
  type: 'text' | 'image' | 'video' | 'audio' | 'file'
  timestamp: Date
  status: 'draft' | 'sending' | 'sent' | 'delivered' | 'read' | 'failed'
  recipients: string[]
  attachments?: File[]
  metadata?: {
    size?: number
    duration?: number
    dimensions?: { width: number; height: number }
  }
}

interface ComposerState {
  message: string
  selectedRecipients: string[]
  attachments: File[]
  isRecording: boolean
  recordingDuration: number
  showEmojiPicker: boolean
  showRecipientSelector: boolean
  messageType: 'text' | 'broadcast' | 'template'
  scheduledTime?: Date
  priority: 'low' | 'normal' | 'high'
  template?: string
  aiSuggestions: string[]
  wordCount: number
  characterCount: number
  estimatedCost: number
  deliveryTime: string
}

const EMOJI_LIST = ['😀', '😂', '😍', '🤔', '👍', '❤️', '🎉', '🔥', '💯', '⭐', '🎯', '💪', '🚀', '🌟', '✨', '💎']
const TEMPLATES = [
  'Product announcement template',
  'Event invitation template', 
  'Newsletter template',
  'Promotional offer template',
  'Customer survey template',
  'Thank you message template'
]

export default function InteractiveMessageComposer() {
  const [state, setState] = useState<ComposerState>({
    message: '',
    selectedRecipients: ['test_user'], // デフォルトでテストユーザーを選択
    attachments: [],
    isRecording: false,
    recordingDuration: 0,
    showEmojiPicker: false,
    showRecipientSelector: false,
    messageType: 'text',
    priority: 'normal',
    aiSuggestions: [],
    wordCount: 0,
    characterCount: 0,
    estimatedCost: 0,
    deliveryTime: 'immediate'
  })

  const [messages, setMessages] = useState<MessageData[]>([])
  const [isExpanded, setIsExpanded] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const recordingIntervalRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    const words = state.message.trim().split(/\s+/).filter(word => word.length > 0)
    const wordCount = words.length
    const characterCount = state.message.length
    const estimatedCost = Math.ceil(characterCount / 160) * 0.05 * state.selectedRecipients.length

    setState(prev => ({
      ...prev,
      wordCount,
      characterCount,
      estimatedCost
    }))

    if (wordCount > 0 && wordCount % 5 === 0) {
      generateAISuggestions(state.message)
    }
  }, [state.message, state.selectedRecipients.length])

  const generateAISuggestions = async (text: string) => {
    const suggestions = [
      `Add a call-to-action to "${text.slice(0, 20)}..."`,
      `Include emojis for "${text.slice(0, 20)}..."`,
      `Make it more engaging: "${text.slice(0, 20)}..."`,
      `Shorten this message for better impact`
    ]
    
    setState(prev => ({
      ...prev,
      aiSuggestions: suggestions.slice(0, 3)
    }))
  }

  const handleSendMessage = async () => {
    if (!state.message.trim() && state.attachments.length === 0) {
      toast.error('Please enter a message or attach a file')
      return
    }

    if (state.selectedRecipients.length === 0) {
      toast.error('Please select at least one recipient')
      return
    }

    const newMessage: MessageData = {
      id: Date.now().toString(),
      content: state.message,
      type: state.attachments.length > 0 ? 'file' : 'text',
      timestamp: new Date(),
      status: 'sending',
      recipients: state.selectedRecipients,
      attachments: state.attachments,
      metadata: state.attachments.length > 0 ? {
        size: state.attachments.reduce((sum, file) => sum + file.size, 0)
      } : undefined
    }

    setMessages(prev => [newMessage, ...prev])
    
    toast.promise(
      new Promise<void>((resolve, reject) => {
        setTimeout(() => {
          if (Math.random() > 0.1) {
            setMessages(prev => 
              prev.map(msg => 
                msg.id === newMessage.id 
                  ? { ...msg, status: 'delivered' }
                  : msg
              )
            )
            resolve()
          } else {
            setMessages(prev => 
              prev.map(msg => 
                msg.id === newMessage.id 
                  ? { ...msg, status: 'failed' }
                  : msg
              )
            )
            reject(new Error('Delivery failed'))
          }
        }, 2000)
      }),
      {
        loading: 'Sending message...',
        success: `Message sent to ${state.selectedRecipients.length} recipients`,
        error: 'Failed to send message'
      }
    )

    setState(prev => ({
      ...prev,
      message: '',
      attachments: [],
      aiSuggestions: [],
      wordCount: 0,
      characterCount: 0,
      estimatedCost: 0
    }))
  }

  const handleFileUpload = (files: FileList | File[]) => {
    const fileArray = Array.from(files)
    const validFiles = fileArray.filter(file => file.size <= 25 * 1024 * 1024)
    
    if (validFiles.length !== fileArray.length) {
      toast.error('Some files were too large (max 25MB)')
    }

    setState(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...validFiles].slice(0, 10)
    }))

    if (validFiles.length > 0) {
      toast.success(`${validFiles.length} file(s) added`)
    }
  }

  const removeAttachment = (index: number) => {
    setState(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }))
  }

  const startRecording = () => {
    setState(prev => ({ ...prev, isRecording: true, recordingDuration: 0 }))
    recordingIntervalRef.current = setInterval(() => {
      setState(prev => ({ ...prev, recordingDuration: prev.recordingDuration + 1 }))
    }, 1000)
    toast.success('Recording started')
  }

  const stopRecording = () => {
    setState(prev => ({ ...prev, isRecording: false }))
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current)
    }
    
    const audioBlob = new Blob(['mock audio data'], { type: 'audio/wav' })
    const audioFile = new File([audioBlob], `recording-${Date.now()}.wav`, { type: 'audio/wav' })
    
    setState(prev => ({
      ...prev,
      attachments: [...prev.attachments, audioFile]
    }))
    
    toast.success(`Recording saved (${state.recordingDuration}s)`)
  }

  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newMessage = state.message.slice(0, start) + emoji + state.message.slice(end)
      
      setState(prev => ({ ...prev, message: newMessage }))
      
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + emoji.length, start + emoji.length)
      }, 0)
    }
  }

  const applySuggestion = (suggestion: string) => {
    setState(prev => ({ ...prev, message: prev.message + ' ' + suggestion }))
    toast.success('Suggestion applied')
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getStatusIcon = (status: MessageData['status']) => {
    switch (status) {
      case 'draft': return <Edit3 className="h-4 w-4 text-gray-400" />
      case 'sending': return <Clock className="h-4 w-4 text-blue-400 animate-spin" />
      case 'sent': return <Send className="h-4 w-4 text-blue-400" />
      case 'delivered': return <CheckCircle className="h-4 w-4 text-green-400" />
      case 'read': return <Eye className="h-4 w-4 text-green-400" />
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-400" />
      default: return null
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    if (e.dataTransfer.files) {
      handleFileUpload(e.dataTransfer.files)
    }
  }

  return (
    <div
      className="w-full bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden transition-all duration-300 transform hover:scale-[1.01]"
    >
      <div className="border-b border-white/10
                    spacing-responsive-xs
                    sm:spacing-responsive-sm
                    md:spacing-responsive-md
                    lg:spacing-responsive-lg
                    xl:spacing-responsive-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2
                        sm:space-x-3
                        lg:space-x-4
                        min-w-0 flex-1">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0
                          w-8 h-8
                          sm:w-9 sm:h-9
                          md:w-10 md:h-10
                          lg:w-11 lg:h-11
                          xl:w-12 xl:h-12">
              <MessageSquare className="text-white
                           h-4 w-4
                           sm:h-4.5 sm:w-4.5
                           md:h-5 md:w-5
                           lg:h-5.5 lg:w-5.5
                           xl:h-6 xl:w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-white font-semibold truncate
                           text-responsive-sm
                           sm:text-responsive-base
                           md:text-responsive-lg
                           lg:text-responsive-xl">
                <span className="hidden sm:inline">Interactive Message Composer</span>
                <span className="sm:hidden">Composer</span>
              </h3>
              <p className="text-white/70 hidden sm:block
                          text-responsive-xs
                          md:text-responsive-sm
                          truncate">
                <span className="hidden md:inline">Create and send engaging messages</span>
                <span className="md:hidden">Create messages</span>
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1
                        sm:space-x-2
                        flex-shrink-0">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="bg-white/10 text-white/70 rounded-lg hover:bg-white/20 transition-all
                       p-1.5
                       sm:p-2
                       md:p-2.5"
            >
              {isExpanded ? (
                <EyeOff className="h-3.5 w-3.5
                                sm:h-4 sm:w-4
                                md:h-4.5 md:w-4.5" />
              ) : (
                <Eye className="h-3.5 w-3.5
                              sm:h-4 sm:w-4
                              md:h-4.5 md:w-4.5" />
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="spacing-responsive-sm
                    sm:spacing-responsive-md
                    md:spacing-responsive-lg
                    lg:spacing-responsive-lg
                    xl:spacing-responsive-xl">
        
        <div className="space-y-4
                      sm:space-y-5
                      md:space-y-6">
          
          <div className="space-y-3
                        sm:space-y-4">
            
            {/* 受信者選択セクション - 強調表示 */}
            <div className="space-y-2 border-2 border-yellow-400 bg-yellow-400/10 rounded-xl p-4 animate-pulse">
              <label className="text-yellow-300 font-bold flex items-center gap-2 text-lg">
                <Users className="h-5 w-5" />
                ⚠️ 受信者を選択してください
              </label>
              <div className="bg-black/30 rounded-lg p-3 space-y-2 border border-yellow-400/50">
                <div className="bg-red-500/20 border border-red-400 rounded-lg p-2 mb-2">
                  <p className="text-red-300 text-sm font-bold">
                    🔴 重要: 受信者が設定されていません！下記から選択するか、入力してください。
                  </p>
                </div>
                <input
                  type="text"
                  placeholder="受信者のFacebook IDまたは名前を入力してEnterキー..."
                  className="w-full bg-white/20 text-white placeholder-yellow-300 rounded-lg px-4 py-3 border-2 border-yellow-400 focus:border-green-400 focus:outline-none text-lg font-medium"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                      const newRecipient = e.currentTarget.value.trim()
                      setState(prev => ({
                        ...prev,
                        selectedRecipients: [...prev.selectedRecipients, newRecipient]
                      }))
                      e.currentTarget.value = ''
                      toast.success(`受信者 "${newRecipient}" を追加しました`)
                    }
                  }}
                />
                
                {/* 選択済み受信者リスト */}
                {state.selectedRecipients.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {state.selectedRecipients.map((recipient, index) => (
                      <span
                        key={index}
                        className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                      >
                        {recipient}
                        <button
                          onClick={() => {
                            setState(prev => ({
                              ...prev,
                              selectedRecipients: prev.selectedRecipients.filter((_, i) => i !== index)
                            }))
                            toast.success(`受信者 "${recipient}" を削除しました`)
                          }}
                          className="hover:text-red-400 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                
                {/* クイック選択ボタン */}
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => {
                      setState(prev => ({
                        ...prev,
                        selectedRecipients: ['all_followers']
                      }))
                      toast.success('全フォロワーを選択しました')
                    }}
                    className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-lg text-sm hover:bg-purple-500/30 transition-all"
                  >
                    全フォロワー
                  </button>
                  <button
                    onClick={() => {
                      setState(prev => ({
                        ...prev,
                        selectedRecipients: ['test_group']
                      }))
                      toast.success('テストグループを選択しました')
                    }}
                    className="bg-green-500/20 text-green-300 px-3 py-1 rounded-lg text-sm hover:bg-green-500/30 transition-all"
                  >
                    テストグループ
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <label className="text-white/80 font-medium
                               text-responsive-xs
                               sm:text-responsive-sm
                               md:text-responsive-base">
                  Message Type
                </label>
              </div>
              <div className="flex items-center space-x-2">
                {(['text', 'broadcast', 'template'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setState(prev => ({ ...prev, messageType: type }))}
                    className={`px-3 py-1.5 rounded-lg transition-all
                             text-responsive-xs
                             sm:text-responsive-sm
                             ${state.messageType === type
                               ? 'bg-blue-500/30 text-blue-300 border border-blue-500/50'
                               : 'bg-white/5 text-white/60 hover:bg-white/10'
                             }`}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <div
                className={`relative rounded-xl border transition-all duration-300 ${
                  dragOver
                    ? 'border-blue-400/50 bg-blue-500/10'
                    : 'border-white/20 bg-white/5'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <textarea
                  ref={textareaRef}
                  value={state.message}
                  onChange={(e) => setState(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Type your message here..."
                  className="w-full bg-transparent text-white placeholder-white/50 border-0 focus:ring-0 resize-none
                           text-responsive-sm
                           sm:text-responsive-base
                           md:text-responsive-lg
                           p-3
                           sm:p-4
                           md:p-5
                           min-h-[80px]
                           sm:min-h-[100px]
                           md:min-h-[120px]"
                  rows={isExpanded ? 6 : 3}
                />
                
                <div className="absolute bottom-3 right-3 flex items-center space-x-2">
                  <div className="flex items-center space-x-1 text-white/50
                                text-responsive-xs
                                sm:text-responsive-sm">
                    <span>{state.characterCount}/1600</span>
                    <span>•</span>
                    <span>{state.wordCount} words</span>
                  </div>
                </div>
              </div>

              {dragOver && (
                <div className="absolute inset-0 flex items-center justify-center bg-blue-500/20 backdrop-blur-sm rounded-xl">
                  <div className="text-center">
                    <Upload className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                    <p className="text-blue-300 font-medium">Drop files here to attach</p>
                  </div>
                </div>
              )}
            </div>

            {state.attachments.length > 0 && (
              <div className="bg-white/5 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-white/80 text-sm font-medium">
                    Attachments ({state.attachments.length})
                  </span>
                  <span className="text-white/60 text-xs">
                    {(state.attachments.reduce((sum, file) => sum + file.size, 0) / 1024 / 1024).toFixed(1)} MB
                  </span>
                </div>
                <div className="space-y-2">
                  {state.attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-white/5 rounded-lg p-2">
                      <div className="flex items-center space-x-2 flex-1 min-w-0">
                        <FileText className="h-4 w-4 text-blue-400 flex-shrink-0" />
                        <span className="text-white/90 text-sm truncate">{file.name}</span>
                        <span className="text-white/50 text-xs">
                          {(file.size / 1024).toFixed(1)} KB
                        </span>
                      </div>
                      <button
                        onClick={() => removeAttachment(index)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {state.aiSuggestions.length > 0 && (
              <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-2">
                  <Zap className="h-4 w-4 text-purple-400" />
                  <span className="text-purple-300 font-medium text-sm">AI Suggestions</span>
                </div>
                <div className="space-y-2">
                  {state.aiSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => applySuggestion(suggestion)}
                      className="w-full text-left p-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all text-white/80 text-sm"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {state.showEmojiPicker && (
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg p-3">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white font-medium text-sm">Emoji Picker</span>
                  <button
                    onClick={() => setState(prev => ({ ...prev, showEmojiPicker: false }))}
                    className="text-white/60 hover:text-white/80"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-8 gap-2">
                  {EMOJI_LIST.map((emoji, index) => (
                    <button
                      key={index}
                      onClick={() => insertEmoji(emoji)}
                      className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded-lg transition-all text-lg"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 bg-white/10 text-white/70 rounded-lg hover:bg-white/20 transition-all"
                  title="Attach File"
                >
                  <Paperclip className="h-4 w-4" />
                </button>
                
                <button
                  onClick={() => setState(prev => ({ ...prev, showEmojiPicker: !prev.showEmojiPicker }))}
                  className="p-2 bg-white/10 text-white/70 rounded-lg hover:bg-white/20 transition-all"
                  title="Add Emoji"
                >
                  <Smile className="h-4 w-4" />
                </button>

                <button
                  onClick={state.isRecording ? stopRecording : startRecording}
                  className={`p-2 rounded-lg transition-all ${
                    state.isRecording
                      ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                  title={state.isRecording ? 'Stop Recording' : 'Start Recording'}
                >
                  <Mic className="h-4 w-4" />
                </button>

                {state.isRecording && (
                  <div className="flex items-center space-x-2 px-3 py-1 bg-red-500/20 rounded-lg">
                    <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                    <span className="text-red-300 text-sm font-mono">
                      {formatTime(state.recordingDuration)}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-white/60 text-xs">
                    Estimated cost: ${state.estimatedCost.toFixed(2)}
                  </div>
                  <div className="text-white/60 text-xs">
                    Recipients: {state.selectedRecipients.length}
                  </div>
                </div>
                
                <button
                  onClick={handleSendMessage}
                  disabled={!state.message.trim() && state.attachments.length === 0}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <Send className="h-4 w-4" />
                  <span className="hidden sm:inline">Send Message</span>
                  <span className="sm:hidden">Send</span>
                </button>
              </div>
            </div>
          </div>

          {messages.length > 0 && (
            <div className="border-t border-white/10 pt-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-white font-medium text-sm">Recent Messages</span>
                <span className="text-white/60 text-xs">{messages.length} sent</span>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {messages.slice(0, 5).map((message) => (
                  <div key={message.id} className="bg-white/5 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(message.status)}
                        <span className="text-white/80 text-sm font-medium">
                          To {message.recipients.length} recipients
                        </span>
                      </div>
                      <span className="text-white/50 text-xs">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-white/70 text-sm line-clamp-2">
                      {message.content}
                    </p>
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="flex items-center space-x-1 mt-2">
                        <Paperclip className="h-3 w-3 text-blue-400" />
                        <span className="text-blue-300 text-xs">
                          {message.attachments.length} attachment(s)
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
          multiple
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
          className="hidden"
        />
      </div>
    </div>
  )
}