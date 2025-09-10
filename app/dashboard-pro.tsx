'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  Cell
} from 'recharts'
import toast, { Toaster } from 'react-hot-toast'
// アイコンはlucide-reactを使用（package.jsonに含まれている）
import { 
  MessageCircle as ChatBubbleLeftIcon,
  Users as UsersIcon,
  BarChart as ChartBarIcon,
  Settings as CogIcon,
  Bell as BellIcon,
  AlertTriangle as ExclamationTriangleIcon
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

// リアルタイム統計データの型定義
interface Statistics {
  totalMessages: number
  dailyMessages: number
  successRate: number
  activeAccounts: number
  queuedTasks: number
  lastUpdateTime: string
}

interface MessageData {
  time: string
  sent: number
  delivered: number
  failed: number
  opened: number
}

interface AccountPerformance {
  name: string
  sent: number
  delivered: number
  successRate: number
  status: 'active' | 'warning' | 'error'
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8']

export default function EnterpriseMessengerDashboard() {
  const [stats, setStats] = useState<Statistics>({
    totalMessages: 0,
    dailyMessages: 0,
    successRate: 0,
    activeAccounts: 0,
    queuedTasks: 0,
    lastUpdateTime: new Date().toISOString()
  })
  
  const [messageData, setMessageData] = useState<MessageData[]>([])
  const [accountData, setAccountData] = useState<AccountPerformance[]>([])
  const [isRealTimeConnected, setIsRealTimeConnected] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  
  // supabaseは既にインポート済み
  const intervalRef = useRef<NodeJS.Timeout>()

  // リアルタイムデータフェッチ
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 統計データ取得
        const { data: statsData, error: statsError } = await supabase
          .from('message_statistics')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)

        if (statsData && statsData[0]) {
          setStats(statsData[0])
          setIsRealTimeConnected(true)
        }

        // メッセージトレンドデータ取得
        const { data: trendData } = await supabase
          .from('hourly_message_stats')
          .select('*')
          .order('hour', { ascending: true })
          .limit(24)

        if (trendData) {
          setMessageData(trendData)
        }

        // アカウントパフォーマンス取得
        const { data: accountPerf } = await supabase
          .from('account_performance')
          .select('*')
          .order('success_rate', { ascending: false })

        if (accountPerf) {
          setAccountData(accountPerf)
        }

      } catch (error) {
        console.error('データ取得エラー:', error)
        toast.error('データの更新に失敗しました')
        setIsRealTimeConnected(false)
      }
    }

    // 初回データ読込
    fetchData()
    
    // 30秒間隔でリアルタイム更新
    intervalRef.current = setInterval(fetchData, 30000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  // Supabaseリアルタイム購読
  useEffect(() => {
    const channels = supabase
      .channel('dashboard-updates')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'message_statistics' },
        (payload) => {
          console.log('リアルタイム更新:', payload)
          toast.success('統計が更新されました', { duration: 2000 })
          if (payload.new) {
            setStats(payload.new as Statistics)
          }
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'system_notifications' },
        (payload) => {
          if (payload.new) {
            const notification = payload.new as any
            toast(notification.message || 'New notification', {
              icon: notification.type === 'error' ? '❌' : 
                   notification.type === 'warning' ? '⚠️' : '✅',
              duration: 5000
            })
            setNotifications(prev => [notification, ...prev.slice(0, 9)])
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channels)
    }
  }, [supabase])

  // 成功率に基づく色分け
  const getSuccessRateColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600'
    if (rate >= 75) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getStatusBadgeColor = (status: AccountPerformance['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'warning': return 'bg-yellow-100 text-yellow-800'
      case 'error': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster 
        position="top-right"
        toastOptions={{
          className: 'bg-white shadow-lg',
          duration: 4000,
        }}
      />
      
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                PyMessenger Agent Pro
              </h1>
              <div className="flex items-center mt-1">
                <div className={`w-2 h-2 rounded-full mr-2 ${isRealTimeConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm text-gray-600">
                  {isRealTimeConnected ? 'リアルタイム接続中' : '接続エラー'}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                新規メッセージ送信
              </motion.button>
            </div>
          </div>
        </div>
      </header>

      {/* 統計カード */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <div className="flex items-center">
              <ChatBubbleLeftIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">総メッセージ数</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalMessages.toLocaleString()}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <div className="flex items-center">
              <ChartBarIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">本日送信</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.dailyMessages}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <div className="flex items-center">
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">成功率</p>
                <p className={`text-2xl font-bold ${getSuccessRateColor(stats.successRate)}`}>
                  {stats.successRate.toFixed(1)}%
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <div className="flex items-center">
              <UsersIcon className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">稼働アカウント</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.activeAccounts}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <div className="flex items-center">
              <CogIcon className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">キュー</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.queuedTasks}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* チャートセクション */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* メッセージトレンドチャート */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              24時間メッセージトレンド
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={messageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="sent"
                  stackId="1"
                  stroke="#8884d8"
                  fill="#8884d8"
                  name="送信"
                />
                <Area
                  type="monotone"
                  dataKey="delivered"
                  stackId="1"
                  stroke="#82ca9d"
                  fill="#82ca9d"
                  name="配信完了"
                />
                <Area
                  type="monotone"
                  dataKey="opened"
                  stackId="1"
                  stroke="#ffc658"
                  fill="#ffc658"
                  name="開封"
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* アカウントパフォーマンス */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-lg shadow p-6"
          >
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              アカウント別パフォーマンス
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={accountData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="sent" fill="#8884d8" name="送信数" />
                <Bar dataKey="delivered" fill="#82ca9d" name="配信数" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* アカウントステータステーブル */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              アカウント詳細ステータス
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    アカウント名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    送信数
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    配信数
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    成功率
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ステータス
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {accountData.map((account, index) => (
                  <motion.tr
                    key={account.name}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {account.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {account.sent.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {account.delivered.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={getSuccessRateColor(account.successRate)}>
                        {account.successRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(account.status)}`}>
                        {account.status === 'active' ? '稼働中' :
                         account.status === 'warning' ? '警告' : 'エラー'}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  )
}