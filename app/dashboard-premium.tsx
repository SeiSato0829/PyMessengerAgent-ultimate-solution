'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar
} from 'recharts'
import toast, { Toaster } from 'react-hot-toast'
import { 
  MessageCircle,
  Users,
  BarChart3,
  Settings,
  Bell,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  Send,
  Eye,
  CheckCircle,
  XCircle,
  Zap,
  Target,
  Globe,
  Smartphone,
  Monitor,
  Filter,
  Download,
  RefreshCw,
  Play,
  Pause,
  MoreVertical,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  PieChart as PieChartIcon,
  Activity
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import InteractiveMessageComposer from '@/components/InteractiveMessageComposer'
import AdvancedAnalyticsDashboard from '@/components/AdvancedAnalyticsDashboard'
import FacebookAuthPanel from '@/components/FacebookAuthPanel'
import RealtimeDebugPanel from '@/components/RealtimeDebugPanel'

// Enhanced interfaces
interface EnhancedStatistics {
  totalMessages: number
  dailyMessages: number
  weeklyMessages: number
  monthlyMessages: number
  successRate: number
  deliveryRate: number
  openRate: number
  responseRate: number
  activeAccounts: number
  queuedTasks: number
  processingTasks: number
  avgResponseTime: number
  peakHour: string
  topPerformingAccount: string
  lastUpdateTime: string
}

interface DetailedMessageData {
  time: string
  hour: number
  sent: number
  delivered: number
  opened: number
  responded: number
  failed: number
  pending: number
}

interface AccountMetrics {
  id: string
  name: string
  avatar: string
  sent: number
  delivered: number
  opened: number
  responded: number
  successRate: number
  responseRate: number
  avgDeliveryTime: number
  status: 'active' | 'warning' | 'error' | 'maintenance'
  lastActive: string
  dailyQuota: number
  quotaUsed: number
}

interface RealtimeAlert {
  id: string
  type: 'success' | 'warning' | 'error' | 'info'
  title: string
  message: string
  timestamp: string
  read: boolean
}

const COLORS = {
  primary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#8B5CF6',
  chart: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']
}

export default function PremiumMessengerDashboard() {
  const [stats, setStats] = useState<EnhancedStatistics>({
    totalMessages: 0,
    dailyMessages: 0,
    weeklyMessages: 0,
    monthlyMessages: 0,
    successRate: 0,
    deliveryRate: 0,
    openRate: 0,
    responseRate: 0,
    activeAccounts: 0,
    queuedTasks: 0,
    processingTasks: 0,
    avgResponseTime: 0,
    peakHour: '',
    topPerformingAccount: '',
    lastUpdateTime: new Date().toISOString()
  })
  
  const [messageData, setMessageData] = useState<DetailedMessageData[]>([])
  const [accountMetrics, setAccountMetrics] = useState<AccountMetrics[]>([])
  const [alerts, setAlerts] = useState<RealtimeAlert[]>([])
  const [isRealTimeConnected, setIsRealTimeConnected] = useState(false)
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])
  
  const intervalRef = useRef<NodeJS.Timeout>()

  // Enhanced data fetching
  useEffect(() => {
    const fetchEnhancedData = async () => {
      try {
        // Fetch comprehensive statistics
        const { data: enhancedStats } = await supabase
          .rpc('get_enhanced_statistics', { 
            time_range: selectedTimeRange 
          })

        if (enhancedStats) {
          setStats(enhancedStats)
          setIsRealTimeConnected(true)
        }

        // Fetch detailed message trends
        const { data: trendData } = await supabase
          .from('hourly_detailed_stats')
          .select('*')
          .order('hour', { ascending: true })
          .limit(24)

        if (trendData) {
          setMessageData(trendData)
        }

        // Fetch account performance metrics
        const { data: accountData } = await supabase
          .from('account_detailed_metrics')
          .select('*')
          .order('success_rate', { ascending: false })

        if (accountData) {
          setAccountMetrics(accountData)
        }

        // Fetch recent alerts
        const { data: alertData } = await supabase
          .from('system_alerts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10)

        if (alertData) {
          setAlerts(alertData)
        }

      } catch (error) {
        console.error('Enhanced data fetch error:', error)
        toast.error('データの更新に失敗しました')
        setIsRealTimeConnected(false)
      }
    }

    fetchEnhancedData()
    
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchEnhancedData, 15000) // 15秒間隔
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [selectedTimeRange, autoRefresh])

  // Real-time subscription
  useEffect(() => {
    const channels = supabase
      .channel('premium-dashboard')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'realtime_stats' },
        (payload) => {
          toast.success('統計データが更新されました', { 
            icon: '📊',
            duration: 3000,
            style: {
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white'
            }
          })
        }
      )

    channels.subscribe()

    return () => {
      supabase.removeChannel(channels)
    }
  }, [])

  const getStatusColor = (status: AccountMetrics['status']) => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'warning': return 'bg-yellow-500'
      case 'error': return 'bg-red-500'
      case 'maintenance': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case 'sent': return <Send className="h-5 w-5" />
      case 'delivered': return <CheckCircle className="h-5 w-5" />
      case 'opened': return <Eye className="h-5 w-5" />
      case 'responded': return <MessageCircle className="h-5 w-5" />
      default: return <Activity className="h-5 w-5" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }
        }}
      />
      
      {/* Enhanced Header - 8段階レスポンシブ完全対応 */}
      <header className="bg-white/10 backdrop-blur-xl border-b border-white/20 sticky top-0 z-50">
        <div className="container-responsive">
          <div className="flex flex-col space-y-2 py-2 
                          sm:flex-row sm:justify-between sm:items-center sm:space-y-0 sm:py-3
                          md:py-4
                          lg:py-4
                          xl:py-5
                          2xl:py-6">
            {/* Logo & Status Section */}
            <div className="flex items-center justify-between
                          sm:justify-start sm:space-x-2
                          md:space-x-3
                          lg:space-x-4">
              <div className="flex items-center space-x-2
                            sm:space-x-2
                            md:space-x-3
                            lg:space-x-3">
                <div className="w-8 h-8 
                              sm:w-9 sm:h-9
                              md:w-10 md:h-10
                              lg:w-11 lg:h-11
                              xl:w-12 xl:h-12
                              bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <MessageCircle className="h-4 w-4
                                         sm:h-5 sm:w-5
                                         md:h-6 md:w-6
                                         lg:h-7 lg:w-7
                                         xl:h-8 xl:w-8
                                         text-white" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-responsive-lg font-bold text-white leading-tight">
                    <span className="hidden md:inline">PyMessenger Agent Premium</span>
                    <span className="md:hidden">PyMessenger</span>
                  </h1>
                  <div className="flex items-center space-x-1 mt-0.5
                                sm:space-x-1.5
                                md:space-x-2">
                    <div className={`w-1.5 h-1.5 
                                   sm:w-2 sm:h-2
                                   rounded-full ${isRealTimeConnected ? 'bg-green-400' : 'bg-red-400'} animate-pulse`} />
                    <span className="text-responsive-xs text-white/70">
                      <span className="hidden sm:inline">{isRealTimeConnected ? 'リアルタイム接続中' : '接続エラー'}</span>
                      <span className="sm:hidden">{isRealTimeConnected ? '接続中' : 'エラー'}</span>
                    </span>
                    <span className="text-responsive-xs text-white/50 hidden md:inline">
                      最終更新: {new Date(stats.lastUpdateTime).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Mobile Menu Button */}
              <button className="sm:hidden p-2 text-white/70 hover:text-white">
                <MoreVertical className="h-5 w-5" />
              </button>
            </div>
            
            {/* Controls Section */}
            <div className="flex items-center justify-between space-x-2
                          sm:justify-end sm:space-x-2
                          md:space-x-3
                          lg:space-x-4">
              {/* Time Range Selector */}
              <select 
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                className="bg-white/10 border border-white/20 text-white rounded-lg backdrop-blur-sm
                         text-xs px-2 py-1.5
                         sm:text-sm sm:px-3 sm:py-2
                         md:text-sm
                         lg:text-base lg:px-4"
              >
                <option value="1h" className="text-black">
                  <span className="hidden sm:inline">1時間</span>
                  <span className="sm:hidden">1h</span>
                </option>
                <option value="24h" className="text-black">
                  <span className="hidden sm:inline">24時間</span>
                  <span className="sm:hidden">24h</span>
                </option>
                <option value="7d" className="text-black">
                  <span className="hidden sm:inline">7日間</span>
                  <span className="sm:hidden">7d</span>
                </option>
                <option value="30d" className="text-black">
                  <span className="hidden sm:inline">30日間</span>
                  <span className="sm:hidden">30d</span>
                </option>
              </select>

              {/* Auto Refresh Toggle */}
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`rounded-lg font-medium transition-all
                          text-xs px-2 py-1.5
                          sm:text-sm sm:px-3 sm:py-2
                          md:px-4
                          lg:text-base
                          ${
                  autoRefresh 
                    ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                    : 'bg-white/10 text-white/70 border border-white/20'
                }`}
              >
                <RefreshCw className={`h-4 w-4 inline mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
                自動更新
              </button>

              {/* New Message Button */}
              <button
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all"
              >
                <Send className="h-4 w-4 inline mr-2" />
                新規メッセージ
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* メインセクション - 重複削除済み（下部で統合表示） */}

      <div className="container-responsive spacing-responsive-lg">
        {/* Enhanced KPI Cards - 8段階レスポンシブグリッド */}
        <div className="responsive-grid mb-6
                        sm:mb-7
                        md:mb-8
                        lg:mb-10
                        xl:mb-12">
          {/* KPIカードは responsive-grid で自動調整 */}
          {[
            { 
              label: '総メッセージ数', 
              value: stats.totalMessages.toLocaleString(), 
              icon: MessageCircle, 
              color: 'from-blue-500 to-blue-600',
              change: '+12.5%',
              changePositive: true
            },
            { 
              label: '本日送信', 
              value: stats.dailyMessages.toString(), 
              icon: Send, 
              color: 'from-green-500 to-green-600',
              change: '+8.2%',
              changePositive: true
            },
            { 
              label: '配信率', 
              value: `${stats.deliveryRate.toFixed(1)}%`, 
              icon: CheckCircle, 
              color: 'from-emerald-500 to-emerald-600',
              change: '+2.1%',
              changePositive: true
            },
            { 
              label: '開封率', 
              value: `${stats.openRate.toFixed(1)}%`, 
              icon: Eye, 
              color: 'from-purple-500 to-purple-600',
              change: '-0.8%',
              changePositive: false
            },
            { 
              label: '返信率', 
              value: `${stats.responseRate.toFixed(1)}%`, 
              icon: MessageCircle, 
              color: 'from-pink-500 to-pink-600',
              change: '+5.3%',
              changePositive: true
            },
            { 
              label: '稼働アカウント', 
              value: stats.activeAccounts.toString(), 
              icon: Users, 
              color: 'from-indigo-500 to-indigo-600',
              change: '+1',
              changePositive: true
            },
            { 
              label: 'キュー', 
              value: stats.queuedTasks.toString(), 
              icon: Clock, 
              color: 'from-orange-500 to-orange-600',
              change: '-3',
              changePositive: true
            },
            { 
              label: '平均応答時間', 
              value: `${stats.avgResponseTime}s`, 
              icon: Zap, 
              color: 'from-yellow-500 to-yellow-600',
              change: '-12ms',
              changePositive: true
            }
          ].map((metric, index) => (
            <div
              key={metric.label}
              className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 hover:bg-white/15 transition-all
                       spacing-responsive-sm
                       sm:spacing-responsive-md
                       lg:spacing-responsive-lg"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-white/70 font-medium mb-1
                              text-responsive-xs
                              sm:text-responsive-sm
                              md:mb-2">
                    <span className="hidden sm:inline">{metric.label}</span>
                    <span className="sm:hidden">
                      {metric.label.replace('総メッセージ数', '総数')
                                  .replace('本日送信', '本日')
                                  .replace('配信率', '配信')
                                  .replace('開封率', '開封')
                                  .replace('返信率', '返信')
                                  .replace('アクティブアカウント', 'アカウント')
                                  .replace('平均応答時間', '応答時間')}
                    </span>
                  </p>
                  <p className="text-white font-bold mb-1
                              text-responsive-lg
                              sm:text-responsive-xl
                              md:text-responsive-2xl
                              lg:text-responsive-3xl
                              truncate">
                    {metric.value}
                  </p>
                  <div className="flex items-center space-x-1 text-responsive-xs">
                    {metric.changePositive ? (
                      <ArrowUpRight className="h-2.5 w-2.5 
                                             sm:h-3 sm:w-3
                                             text-green-400 flex-shrink-0" />
                    ) : (
                      <ArrowDownRight className="h-2.5 w-2.5 
                                               sm:h-3 sm:w-3
                                               text-red-400 flex-shrink-0" />
                    )}
                    <span className={`font-medium ${
                      metric.changePositive ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {metric.change}
                    </span>
                  </div>
                </div>
                <div className={`rounded-xl bg-gradient-to-r ${metric.color} flex items-center justify-center flex-shrink-0
                               w-8 h-8
                               sm:w-10 sm:h-10
                               md:w-12 md:h-12
                               lg:w-14 lg:h-14`}>
                  <metric.icon className="text-white
                                       h-3.5 w-3.5
                                       sm:h-4 sm:w-4
                                       md:h-5 md:w-5
                                       lg:h-6 lg:w-6" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ⭐ メイン機能セクション - 統合コンポーネント（重複なし） */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl p-4 border border-white/20">
            <h2 className="text-white text-2xl font-bold flex items-center">
              <span className="mr-3">🎯</span>
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 text-transparent bg-clip-text">
                メッセージング＆認証システム
              </span>
            </h2>
            <p className="text-gray-300 mt-2">認証状態の確認、メッセージ送信、分析をワンストップで管理</p>
          </div>
        </div>

        {/* Interactive Components Section - 統合表示（1箇所のみ） */}
        <div className="grid gap-4 mb-6
                        sm:gap-5 sm:mb-7
                        md:gap-6 md:mb-8 md:grid-cols-2
                        lg:grid-cols-2 lg:gap-7 lg:mb-9
                        xl:grid-cols-3 xl:gap-8 xl:mb-10
                        2xl:gap-10 2xl:mb-12">
          {/* Facebook Authentication Panel */}
          <div className="md:col-span-1 xl:col-span-1">
            <div className="bg-blue-500/10 rounded-t-xl p-3 border-b border-blue-500/30">
              <h3 className="text-blue-300 font-semibold flex items-center">
                <span className="mr-2">🔐</span>認証管理
              </h3>
            </div>
            <FacebookAuthPanel />
          </div>
          
          {/* Message Composer */}
          <div className="md:col-span-1 xl:col-span-1">
            <div className="bg-yellow-500/10 rounded-t-xl p-3 border-b border-yellow-500/30">
              <h3 className="text-yellow-300 font-semibold flex items-center">
                <span className="mr-2">📤</span>メッセージ送信
              </h3>
            </div>
            <InteractiveMessageComposer />
          </div>
          
          {/* Analytics Dashboard */}
          <div className="md:col-span-2 xl:col-span-1">
            <div className="bg-green-500/10 rounded-t-xl p-3 border-b border-green-500/30">
              <h3 className="text-green-300 font-semibold flex items-center">
                <span className="mr-2">📊</span>分析ダッシュボード
              </h3>
            </div>
            <AdvancedAnalyticsDashboard />
          </div>
        </div>

        {/* Enhanced Charts Section - 8段階レスポンシブ */}
        <div className="grid gap-4 mb-6
                        sm:gap-5 sm:mb-7
                        md:gap-6 md:mb-8
                        lg:grid-cols-3 lg:gap-7 lg:mb-9
                        xl:gap-8 xl:mb-10
                        2xl:gap-10 2xl:mb-12">
          {/* Main Performance Chart */}
          <div
            className="lg:col-span-2 bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">
                メッセージパフォーマンス
              </h3>
              <div className="flex space-x-2">
                <button className="px-3 py-1 bg-white/10 text-white/70 text-xs rounded-lg">時間別</button>
                <button className="px-3 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-lg">日別</button>
                <button className="px-3 py-1 bg-white/10 text-white/70 text-xs rounded-lg">週別</button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={messageData}>
                <defs>
                  <linearGradient id="gradientSent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="gradientDelivered" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="time" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '12px',
                    color: 'white'
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="sent"
                  stroke="#3B82F6"
                  fillOpacity={1}
                  fill="url(#gradientSent)"
                  name="送信"
                />
                <Area
                  type="monotone"
                  dataKey="delivered"
                  stroke="#10B981"
                  fillOpacity={1}
                  fill="url(#gradientDelivered)"
                  name="配信"
                />
                <Area
                  type="monotone"
                  dataKey="opened"
                  stroke="#F59E0B"
                  fillOpacity={0.6}
                  fill="#F59E0B"
                  name="開封"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Success Rate Gauge */}
          <div
            className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/20"
          >
            <h3 className="text-lg font-semibold text-white mb-6">成功率</h3>
            <div className="relative">
              <ResponsiveContainer width="100%" height={250}>
                <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={[
                  { name: '成功率', value: stats.successRate, fill: '#10B981' }
                ]}>
                  <RadialBar dataKey="value" cornerRadius={10} fill="#10B981" />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">{stats.successRate.toFixed(1)}%</div>
                  <div className="text-sm text-white/70">総合成功率</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Account Management */}
        <div
          className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 overflow-hidden mb-8"
        >
          <div className="px-6 py-4 border-b border-white/10">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                アカウント詳細パフォーマンス
              </h3>
              <div className="flex space-x-2">
                <button className="p-2 bg-white/10 rounded-lg text-white/70 hover:bg-white/20 transition-all">
                  <Filter className="h-4 w-4" />
                </button>
                <button className="p-2 bg-white/10 rounded-lg text-white/70 hover:bg-white/20 transition-all">
                  <Download className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                    アカウント
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                    ステータス
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                    送信数
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                    成功率
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                    返信率
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                    クォータ
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                    最終アクティブ
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                    アクション
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {accountMetrics.map((account, index) => (
                  <tr
                    key={account.id}
                    className="hover:bg-white/5 transition-all"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-medium">
                              {account.name.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">{account.name}</div>
                          <div className="text-xs text-white/50">{account.id.slice(0, 8)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(account.status)} text-white`}>
                        {account.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {account.sent.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-white/10 rounded-full h-2 mr-3">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ width: `${account.successRate}%` }}
                          />
                        </div>
                        <span className="text-sm text-white">{account.successRate.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                      {account.responseRate.toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-16 bg-white/10 rounded-full h-2 mr-3">
                          <div 
                            className={`h-2 rounded-full ${
                              (account.quotaUsed / account.dailyQuota) > 0.8 ? 'bg-red-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${(account.quotaUsed / account.dailyQuota) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-white">
                          {account.quotaUsed}/{account.dailyQuota}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70">
                      {new Date(account.lastActive).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-white/70 hover:text-white">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Floating Debug Panel */}
      <RealtimeDebugPanel />
    </div>
  )
}