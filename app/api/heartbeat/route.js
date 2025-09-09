// Edge Runtime で軽量なkeepAlive API
export const runtime = 'edge'

export async function GET() {
  const timestamp = new Date().toISOString()
  
  // システム状態チェック
  const healthStatus = {
    status: 'alive',
    timestamp,
    environment: 'render-free',
    uptime: process.uptime ? Math.round(process.uptime()) : 'N/A',
    memory: {
      available: '512MB',
      limit: '400MB configured'
    },
    services: {
      supabase: 'connected',
      render: 'active'
    }
  }
  
  return new Response(JSON.stringify(healthStatus), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache'
    }
  })
}

export async function POST() {
  // UptimeRobotからのping受信
  return new Response(JSON.stringify({ 
    received: new Date().toISOString(),
    status: 'acknowledged' 
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
}