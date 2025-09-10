import dynamic from 'next/dynamic'

// Premium版、Pro版、Free版を動的に切り替え
const DashboardPremium = dynamic(() => import('./dashboard-premium'), { ssr: false })
const DashboardPro = dynamic(() => import('./dashboard-pro'), { ssr: false })
const DashboardFree = dynamic(() => import('./dashboard-free'), { ssr: false })

export default function HomePage() {
  // 環境変数でプラン判定（本番では認証ベースで判定）
  const planType = process.env.NODE_ENV === 'production' 
    ? process.env.RENDER_PLAN || 'premium'
    : 'premium' // 開発時はPremium版

  const renderDashboard = () => {
    switch (planType) {
      case 'premium':
        return <DashboardPremium />
      case 'pro':
        return <DashboardPro />
      case 'free':
      default:
        return <DashboardFree />
    }
  }

  return (
    <main>
      {renderDashboard()}
    </main>
  )
}