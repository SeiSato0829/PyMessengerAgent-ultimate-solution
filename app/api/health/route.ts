// Simple health check API without external dependencies
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    // メモリ使用量チェック
    const memory = process.memoryUsage()
    const memoryUsageMB = Math.round(memory.heapUsed / 1024 / 1024)
    const memoryStatus = memoryUsageMB < 1500 ? 'healthy' : 'warning'

    // CPU使用率チェック
    const cpu = process.cpuUsage()

    // 稼働時間チェック
    const uptime = process.uptime()
    const uptimeHours = Math.floor(uptime / 3600)

    // 応答時間
    const responseTime = Date.now() - startTime

    const healthReport = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      checks: {
        memory: {
          status: memoryStatus,
          usage: `${memoryUsageMB}MB`,
          percentage: `${Math.round(memoryUsageMB / 1800 * 100)}%`
        },
        cpu: {
          status: 'healthy',
          user: cpu.user || 0,
          system: cpu.system || 0
        },
        uptime: {
          status: 'healthy',
          value: `${uptimeHours}h ${Math.floor((uptime % 3600) / 60)}m`,
          seconds: uptime
        }
      },
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        supabaseConfigured: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        facebookConfigured: !!process.env.FACEBOOK_APP_ID
      }
    }

    return NextResponse.json(healthReport, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/json'
      }
    })

  } catch (error) {
    console.error('Health check failed:', error)

    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime: `${Date.now() - startTime}ms`
    }, { status: 503 })
  }
}