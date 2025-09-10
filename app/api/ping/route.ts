/**
 * Keep-Alive Ping API
 * Renderのスリープ回避用のセルフPingエンドポイント
 */

import { NextResponse } from 'next/server';
import { getRenderKeepAlive } from '@/lib/utils/render-keepalive';

export async function GET() {
  try {
    const keepAlive = getRenderKeepAlive();
    const status = keepAlive.getSystemStatus();
    
    // 稼働時間警告チェック
    const uptimeWarning = keepAlive.checkUptimeWarning();

    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      message: 'Keep-alive ping successful',
      system: {
        uptime: `${status.uptime.hours}時間`,
        memory: `${status.memory.rss}MB (${status.limits.memoryPercent}%)`,
        remaining: `${status.shutdown.remainingHours}時間`,
        warning: uptimeWarning.warning ? uptimeWarning.message : null
      },
      details: status
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Keep-alive ping エラー:', error);
    
    return NextResponse.json({
      success: false,
      timestamp: new Date().toISOString(),
      message: 'Keep-alive ping failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST() {
  try {
    const keepAlive = getRenderKeepAlive();
    
    // 手動ガベージコレクション実行
    if (global.gc) {
      global.gc();
      console.log('🗑️ 手動ガベージコレクション実行');
    }

    const status = keepAlive.getSystemStatus();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      message: 'Manual garbage collection executed',
      system: {
        memory: `${status.memory.rss}MB`,
        memoryUsage: `${status.limits.memoryPercent}%`
      }
    });
  } catch (error) {
    console.error('Manual GC エラー:', error);
    
    return NextResponse.json({
      success: false,
      timestamp: new Date().toISOString(),
      message: 'Manual GC failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}