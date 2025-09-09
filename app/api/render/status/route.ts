/**
 * Render Worker Status API
 * Renderデータベースの状況をWeb UIに提供
 */

import { getRenderSyncManager } from '@/lib/render/sync-manager';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const syncManager = getRenderSyncManager();
    
    // システム統計を並行取得
    const [systemStats, workerMetrics, healthCheck] = await Promise.all([
      syncManager.getSystemStats(),
      syncManager.getWorkerMetrics(),
      syncManager.healthCheck()
    ]);

    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      health: healthCheck,
      stats: {
        tasks: {
          pending: systemStats.tasks.pending_count || 0,
          processing: systemStats.tasks.processing_count || 0,
          completed: systemStats.tasks.completed_count || 0,
          failed: systemStats.tasks.failed_count || 0,
          today: systemStats.tasks.today_count || 0,
          success_rate: systemStats.tasks.success_rate || 0
        },
        workers: {
          total: systemStats.workers.total_workers || 0,
          online: systemStats.workers.online_workers || 0,
          offline: (systemStats.workers.total_workers || 0) - (systemStats.workers.online_workers || 0)
        },
        performance: {
          avg_execution_time: Math.round(systemStats.performance.avg_execution_time || 0),
          completed_24h: systemStats.performance.completed_count || 0,
          failed_24h: systemStats.performance.failed_count || 0
        }
      },
      workers: workerMetrics.map(worker => ({
        worker_id: worker.worker_id,
        worker_name: worker.worker_name,
        status: worker.status,
        last_heartbeat: worker.last_heartbeat,
        active_tasks: worker.active_tasks,
        completed_today: worker.completed_today,
        failed_today: worker.failed_today,
        is_online: new Date(worker.last_heartbeat) > new Date(Date.now() - 120000) // 2分以内
      }))
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Render Status API エラー:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      health: { render: false, supabase: false, sync: false },
      stats: {
        tasks: { pending: 0, processing: 0, completed: 0, failed: 0, today: 0, success_rate: 0 },
        workers: { total: 0, online: 0, offline: 0 },
        performance: { avg_execution_time: 0, completed_24h: 0, failed_24h: 0 }
      },
      workers: []
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();
    const syncManager = getRenderSyncManager();

    switch (action) {
      case 'force_sync':
        const syncResult = await syncManager.forceSyncAll();
        return NextResponse.json({
          success: true,
          message: 'Manual sync completed',
          result: syncResult
        });

      case 'health_check':
        const health = await syncManager.healthCheck();
        return NextResponse.json({
          success: true,
          health
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Render Status API POST エラー:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}