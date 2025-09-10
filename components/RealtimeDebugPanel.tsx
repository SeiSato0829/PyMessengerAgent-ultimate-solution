'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Terminal, 
  Activity, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Info,
  Trash2,
  Download,
  Filter,
  Pause,
  Play,
  Eye,
  EyeOff,
  Zap
} from 'lucide-react'
import toast from 'react-hot-toast'

interface LogEntry {
  id: string
  timestamp: string
  level: 'info' | 'success' | 'warning' | 'error'
  category: string
  message: string
  details?: any
}

export default function RealtimeDebugPanel() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isVisible, setIsVisible] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [filter, setFilter] = useState<'all' | 'info' | 'success' | 'warning' | 'error'>('all')
  const [autoScroll, setAutoScroll] = useState(true)
  const logContainerRef = useRef<HTMLDivElement>(null)
  const maxLogs = 100

  // Console.log intercept for debugging
  useEffect(() => {
    const originalConsoleLog = console.log
    const originalConsoleWarn = console.warn
    const originalConsoleError = console.error

    console.log = (...args) => {
      originalConsoleLog(...args)
      if (!isPaused) {
        addLog('info', 'Console', args.join(' '), args.length > 1 ? args : undefined)
      }
    }

    console.warn = (...args) => {
      originalConsoleWarn(...args)
      if (!isPaused) {
        addLog('warning', 'Console', args.join(' '), args.length > 1 ? args : undefined)
      }
    }

    console.error = (...args) => {
      originalConsoleError(...args)
      if (!isPaused) {
        addLog('error', 'Console', args.join(' '), args.length > 1 ? args : undefined)
      }
    }

    return () => {
      console.log = originalConsoleLog
      console.warn = originalConsoleWarn
      console.error = originalConsoleError
    }
  }, [isPaused])

  // Auto-scroll when new logs are added
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
    }
  }, [logs, autoScroll])

  const addLog = (level: LogEntry['level'], category: string, message: string, details?: any) => {
    const newLog: LogEntry = {
      id: Date.now() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      details
    }

    setLogs(prevLogs => {
      const updatedLogs = [newLog, ...prevLogs].slice(0, maxLogs)
      return updatedLogs
    })
  }

  // Simulate Facebook API logs
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isPaused && Math.random() > 0.7) {
        const mockLogs = [
          { level: 'info' as const, category: 'API', message: 'Facebook Graph API準備完了' },
          { level: 'success' as const, category: 'Auth', message: 'アクセストークン検証成功' },
          { level: 'warning' as const, category: 'Rate Limit', message: 'レート制限: 2秒待機中' },
          { level: 'info' as const, category: 'Message', message: 'メッセージキューに追加' },
        ]
        const randomLog = mockLogs[Math.floor(Math.random() * mockLogs.length)]
        addLog(randomLog.level, randomLog.category, randomLog.message)
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [isPaused])

  const filteredLogs = logs.filter(log => filter === 'all' || log.level === filter)

  const getLevelIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'info': return <Info className="h-4 w-4 text-blue-400" />
      case 'success': return <CheckCircle className="h-4 w-4 text-green-400" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-400" />
      case 'error': return <XCircle className="h-4 w-4 text-red-400" />
    }
  }

  const getLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'info': return 'text-blue-300 border-blue-500/20'
      case 'success': return 'text-green-300 border-green-500/20'
      case 'warning': return 'text-yellow-300 border-yellow-500/20'
      case 'error': return 'text-red-300 border-red-500/20'
    }
  }

  const clearLogs = () => {
    setLogs([])
    toast.success('デバッグログをクリアしました')
  }

  const exportLogs = () => {
    const logData = JSON.stringify(filteredLogs, null, 2)
    const blob = new Blob([logData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `debug-logs-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('デバッグログをエクスポートしました')
  }

  if (!isVisible) {
    return (
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={() => setIsVisible(true)}
        className="fixed bottom-6 right-6 z-50 p-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all"
      >
        <Terminal className="h-5 w-5" />
      </motion.button>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-6 right-6 z-50 w-96 h-96 bg-black/90 backdrop-blur-xl border border-white/20 rounded-2xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <Terminal className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">リアルタイムデバッグ</h3>
            <p className="text-xs text-white/50">{filteredLogs.length}件のログ</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`p-1.5 rounded-lg transition-all ${
              isPaused ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            {isPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
          </button>
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`p-1.5 rounded-lg transition-all ${
              autoScroll ? 'bg-blue-500/20 text-blue-400' : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            {autoScroll ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="p-1.5 bg-white/10 text-white/70 rounded-lg hover:bg-white/20 transition-all"
          >
            <XCircle className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-2 p-3 border-b border-white/10">
        {(['all', 'info', 'success', 'warning', 'error'] as const).map(level => (
          <button
            key={level}
            onClick={() => setFilter(level)}
            className={`px-2 py-1 text-xs rounded-lg transition-all ${
              filter === level 
                ? 'bg-white/20 text-white' 
                : 'bg-white/5 text-white/50 hover:bg-white/10'
            }`}
          >
            {level === 'all' ? 'All' : level.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Log Container */}
      <div 
        ref={logContainerRef}
        className="flex-1 overflow-y-auto p-3 space-y-2 h-64"
      >
        <AnimatePresence>
          {filteredLogs.map((log, index) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.02 }}
              className={`flex items-start space-x-2 p-2 rounded-lg border-l-2 bg-white/5 ${getLevelColor(log.level)}`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {getLevelIcon(log.level)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-xs font-medium text-white/80">{log.category}</span>
                  <span className="text-xs text-white/50">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-xs text-white/90 break-words">{log.message}</p>
                {log.details && (
                  <details className="mt-1">
                    <summary className="text-xs text-white/60 cursor-pointer">詳細を表示</summary>
                    <pre className="text-xs text-white/70 mt-1 bg-black/30 p-2 rounded overflow-x-auto">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {filteredLogs.length === 0 && (
          <div className="text-center text-white/50 py-8">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">ログはまだありません</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-3 border-t border-white/10">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isPaused ? 'bg-red-400' : 'bg-green-400 animate-pulse'}`} />
          <span className="text-xs text-white/60">
            {isPaused ? 'ポーズ中' : 'アクティブ'}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={exportLogs}
            disabled={filteredLogs.length === 0}
            className="p-1.5 bg-white/10 text-white/70 rounded-lg hover:bg-white/20 transition-all disabled:opacity-50"
          >
            <Download className="h-3 w-3" />
          </button>
          <button
            onClick={clearLogs}
            disabled={logs.length === 0}
            className="p-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all disabled:opacity-50"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}