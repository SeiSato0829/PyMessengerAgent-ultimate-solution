// Enterprise-grade health check API
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // システムの詳細ヘルスチェック
    const healthChecks = await Promise.allSettled([
      // データベース接続テスト
      supabase.from('system_status').select('*').limit(1),
      
      // メモリ使用量チェック
      Promise.resolve(process.memoryUsage()),
      
      // CPU使用率チェック
      Promise.resolve(process.cpuUsage()),
      
      // 稼働時間チェック
      Promise.resolve(process.uptime())
    ])

    const [dbCheck, memoryCheck, cpuCheck, uptimeCheck] = healthChecks

    // データベース接続状態
    const dbStatus = dbCheck.status === 'fulfilled' ? 'healthy' : 'unhealthy'
    const dbError = dbCheck.status === 'rejected' ? dbCheck.reason?.message : null

    // メモリ情報
    const memory = memoryCheck.status === 'fulfilled' ? memoryCheck.value : null
    const memoryUsageMB = memory ? Math.round(memory.heapUsed / 1024 / 1024) : null
    const memoryStatus = memoryUsageMB && memoryUsageMB < 1500 ? 'healthy' : 'warning'

    // CPU情報
    const cpu = cpuCheck.status === 'fulfilled' ? cpuCheck.value : null
    
    // 稼働時間
    const uptime = uptimeCheck.status === 'fulfilled' ? uptimeCheck.value : null
    const uptimeHours = uptime ? Math.floor(uptime / 3600) : null

    // 応答時間
    const responseTime = Date.now() - startTime

    // 全体ステータス判定
    const overallStatus = dbStatus === 'healthy' && memoryStatus === 'healthy' 
      ? 'healthy' 
      : dbStatus === 'unhealthy' ? 'critical' : 'warning'

    const healthReport = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      checks: {
        database: {
          status: dbStatus,
          error: dbError,
          responseTime: `${responseTime}ms`
        },
        memory: {
          status: memoryStatus,
          usage: `${memoryUsageMB}MB`,
          limit: '1800MB (Pro Plan)',
          percentage: memoryUsageMB ? `${Math.round(memoryUsageMB / 1800 * 100)}%` : null
        },
        cpu: {
          status: 'healthy',
          user: cpu?.user || 0,
          system: cpu?.system || 0
        },
        uptime: {
          status: 'healthy',
          value: uptime ? `${uptimeHours}h ${Math.floor((uptime % 3600) / 60)}m` : null,
          seconds: uptime
        }
      },
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        renderPlan: 'Pro Starter ($7/month)',
        region: process.env.RENDER_SERVICE_REGION || 'oregon'
      },
      features: {
        realTimeEnabled: process.env.ENABLE_REAL_TIME === 'true',
        analyticsEnabled: process.env.ENABLE_ANALYTICS === 'true',
        logLevel: process.env.LOG_LEVEL || 'info'
      }
    }

    // ステータスコードの決定
    const statusCode = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'warning' ? 200 : 503

    return NextResponse.json(healthReport, { 
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json'
      }
    })

  } catch (error) {
    console.error('Health check failed:', error)
    
    return NextResponse.json({
      status: 'critical',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: `${Date.now() - startTime}ms`
    }, { status: 503 })
  }
}