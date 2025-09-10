'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
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
  Treemap,
  FunnelChart,
  Funnel,
  LabelList
} from 'recharts'
import { 
  TrendingUp,
  TrendingDown, 
  Users,
  MessageCircle,
  Clock,
  Target,
  Zap,
  Globe,
  Smartphone,
  Monitor,
  Calendar,
  Filter,
  Download,
  Eye,
  MousePointer,
  Heart,
  Share2,
  ArrowRight,
  Activity,
  Layers
} from 'lucide-react'

interface AnalyticsData {
  engagement: {
    views: number
    clicks: number
    shares: number
    likes: number
    comments: number
  }
  demographics: {
    age: { range: string; count: number; percentage: number }[]
    gender: { type: string; count: number; percentage: number }[]
    location: { country: string; city: string; count: number }[]
  }
  deviceStats: {
    mobile: number
    desktop: number
    tablet: number
  }
  timeAnalysis: {
    hourly: { hour: number; engagement: number; sends: number }[]
    daily: { day: string; engagement: number; sends: number }[]
    weekly: { week: string; engagement: number; sends: number }[]
  }
  conversionFunnel: {
    stage: string
    value: number
    percentage: number
  }[]
  contentPerformance: {
    type: string
    engagement: number
    reach: number
    conversion: number
  }[]
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316', '#84CC16']

export default function AdvancedAnalyticsDashboard() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [selectedMetric, setSelectedMetric] = useState('engagement')
  const [timeRange, setTimeRange] = useState('7d')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate data loading
    setTimeout(() => {
      setAnalyticsData({
        engagement: {
          views: 15420,
          clicks: 2340,
          shares: 567,
          likes: 1890,
          comments: 234
        },
        demographics: {
          age: [
            { range: '18-24', count: 1250, percentage: 25 },
            { range: '25-34', count: 2100, percentage: 42 },
            { range: '35-44', count: 1050, percentage: 21 },
            { range: '45-54', count: 400, percentage: 8 },
            { range: '55+', count: 200, percentage: 4 }
          ],
          gender: [
            { type: '男性', count: 2800, percentage: 56 },
            { type: '女性', count: 2000, percentage: 40 },
            { type: 'その他', count: 200, percentage: 4 }
          ],
          location: [
            { country: 'Japan', city: 'Tokyo', count: 2100 },
            { country: 'Japan', city: 'Osaka', count: 1200 },
            { country: 'Japan', city: 'Nagoya', count: 700 }
          ]
        },
        deviceStats: {
          mobile: 72,
          desktop: 23,
          tablet: 5
        },
        timeAnalysis: {
          hourly: Array.from({ length: 24 }, (_, i) => ({
            hour: i,
            engagement: Math.floor(Math.random() * 100) + 20,
            sends: Math.floor(Math.random() * 50) + 10
          })),
          daily: ['月', '火', '水', '木', '金', '土', '日'].map(day => ({
            day,
            engagement: Math.floor(Math.random() * 100) + 30,
            sends: Math.floor(Math.random() * 80) + 20
          })),
          weekly: Array.from({ length: 12 }, (_, i) => ({
            week: `Week ${i + 1}`,
            engagement: Math.floor(Math.random() * 200) + 100,
            sends: Math.floor(Math.random() * 150) + 50
          }))
        },
        conversionFunnel: [
          { stage: 'リーチ', value: 10000, percentage: 100 },
          { stage: '表示', value: 8500, percentage: 85 },
          { stage: 'クリック', value: 2340, percentage: 23.4 },
          { stage: 'エンゲージメント', value: 1200, percentage: 12 },
          { stage: 'コンバージョン', value: 340, percentage: 3.4 }
        ],
        contentPerformance: [
          { type: 'テキスト', engagement: 85, reach: 5200, conversion: 3.2 },
          { type: '画像', engagement: 92, reach: 7800, conversion: 4.1 },
          { type: 'GIF', engagement: 78, reach: 3200, conversion: 2.8 },
          { type: 'リンク', engagement: 88, reach: 4100, conversion: 5.2 }
        ]
      })
      setLoading(false)
    }, 1000)
  }, [timeRange])

  if (loading || !analyticsData) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-white/70">分析データを読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Analytics Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">高度な分析</h2>
          <p className="text-white/70 mt-1">詳細なパフォーマンス分析とインサイト</p>
        </div>
        <div className="flex space-x-3">
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-white/10 border border-white/20 text-white text-sm rounded-lg px-3 py-2"
          >
            <option value="24h">24時間</option>
            <option value="7d">7日間</option>
            <option value="30d">30日間</option>
            <option value="90d">90日間</option>
          </select>
          <button className="flex items-center space-x-2 px-4 py-2 bg-white/10 text-white/70 rounded-lg hover:bg-white/20 transition-all">
            <Download className="h-4 w-4" />
            <span>エクスポート</span>
          </button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { 
            label: 'ビュー数', 
            value: analyticsData.engagement.views.toLocaleString(), 
            icon: Eye, 
            change: '+15.2%',
            color: 'from-blue-500 to-blue-600' 
          },
          { 
            label: 'クリック数', 
            value: analyticsData.engagement.clicks.toLocaleString(), 
            icon: MousePointer, 
            change: '+8.7%',
            color: 'from-green-500 to-green-600' 
          },
          { 
            label: 'シェア数', 
            value: analyticsData.engagement.shares.toLocaleString(), 
            icon: Share2, 
            change: '+12.3%',
            color: 'from-purple-500 to-purple-600' 
          },
          { 
            label: 'いいね数', 
            value: analyticsData.engagement.likes.toLocaleString(), 
            icon: Heart, 
            change: '+5.9%',
            color: 'from-pink-500 to-pink-600' 
          },
          { 
            label: 'コメント数', 
            value: analyticsData.engagement.comments.toLocaleString(), 
            icon: MessageCircle, 
            change: '+18.1%',
            color: 'from-indigo-500 to-indigo-600' 
          }
        ].map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white/70 text-xs font-medium mb-2">{metric.label}</p>
                <p className="text-white text-xl font-bold mb-1">{metric.value}</p>
                <div className="flex items-center space-x-1">
                  <TrendingUp className="h-3 w-3 text-green-400" />
                  <span className="text-xs text-green-400 font-medium">{metric.change}</span>
                </div>
              </div>
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${metric.color} flex items-center justify-center`}>
                <metric.icon className="h-4 w-4 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Engagement Timeline */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20"
        >
          <h3 className="text-lg font-semibold text-white mb-4">エンゲージメント推移</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analyticsData.timeAnalysis.daily}>
              <defs>
                <linearGradient id="engagementGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="day" stroke="rgba(255,255,255,0.5)" />
              <YAxis stroke="rgba(255,255,255,0.5)" />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: 'white'
                }}
              />
              <Area
                type="monotone"
                dataKey="engagement"
                stroke="#3B82F6"
                fillOpacity={1}
                fill="url(#engagementGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Device Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20"
        >
          <h3 className="text-lg font-semibold text-white mb-4">デバイス分布</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: 'モバイル', value: analyticsData.deviceStats.mobile, color: '#3B82F6' },
                  { name: 'デスクトップ', value: analyticsData.deviceStats.desktop, color: '#10B981' },
                  { name: 'タブレット', value: analyticsData.deviceStats.tablet, color: '#F59E0B' }
                ]}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}%`}
              >
                {[
                  { name: 'モバイル', value: analyticsData.deviceStats.mobile, color: '#3B82F6' },
                  { name: 'デスクトップ', value: analyticsData.deviceStats.desktop, color: '#10B981' },
                  { name: 'タブレット', value: analyticsData.deviceStats.tablet, color: '#F59E0B' }
                ].map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: 'white'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Demographics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20"
        >
          <h3 className="text-lg font-semibold text-white mb-4">年齢層分布</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData.demographics.age}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="range" stroke="rgba(255,255,255,0.5)" />
              <YAxis stroke="rgba(255,255,255,0.5)" />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(0, 0, 0, 0.8)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: 'white'
                }}
              />
              <Bar dataKey="count" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Conversion Funnel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20"
        >
          <h3 className="text-lg font-semibold text-white mb-4">コンバージョンファネル</h3>
          <div className="space-y-3">
            {analyticsData.conversionFunnel.map((stage, index) => (
              <div key={stage.stage} className="relative">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white text-sm font-medium">{stage.stage}</span>
                  <span className="text-white/70 text-sm">{stage.percentage}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-3">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${stage.percentage}%` }}
                    transition={{ delay: index * 0.2, duration: 0.8 }}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full"
                  />
                </div>
                <div className="text-xs text-white/50 mt-1">{stage.value.toLocaleString()}人</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Content Performance Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/10 backdrop-blur-xl rounded-xl border border-white/20 overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-white/10">
          <h3 className="text-lg font-semibold text-white">コンテンツタイプ別パフォーマンス</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                  コンテンツタイプ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                  エンゲージメント率
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                  リーチ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                  コンバージョン率
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                  パフォーマンス
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {analyticsData.contentPerformance.map((content, index) => (
                <tr key={content.type} className="hover:bg-white/5 transition-all">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                    {content.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-white/10 rounded-full h-2 mr-3">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${content.engagement}%` }}
                        />
                      </div>
                      <span className="text-sm text-white">{content.engagement}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {content.reach.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {content.conversion}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-1">
                      {content.engagement > 85 ? (
                        <TrendingUp className="h-4 w-4 text-green-400" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-400" />
                      )}
                      <span className={`text-sm ${content.engagement > 85 ? 'text-green-400' : 'text-red-400'}`}>
                        {content.engagement > 85 ? '高' : '低'}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}