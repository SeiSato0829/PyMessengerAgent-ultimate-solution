/**
 * Render PostgreSQL <-> Supabase データ同期マネージャー
 * ハイブリッド構成の核となるシステム
 */

import { Pool } from 'pg';
import { supabase } from '@/lib/supabase/client';

interface SyncResult {
  success: boolean;
  processed: number;
  errors: number;
  details?: any;
  error?: string;
}

interface TaskSyncData {
  id: string;
  user_id: string;
  account_id: string;
  recipient_name: string;
  message: string;
  status: string;
  scheduled_at?: string;
  created_at: string;
}

interface WorkerMetrics {
  worker_id: string;
  active_tasks: number;
  completed_today: number;
  failed_today: number;
  last_heartbeat: string;
}

export class RenderSyncManager {
  private renderPool: Pool;
  private syncInterval: number;
  private isRunning: boolean = false;

  constructor() {
    this.renderPool = new Pool({
      connectionString: process.env.RENDER_DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    this.syncInterval = parseInt(process.env.SYNC_INTERVAL || '30000', 10);
    
    // 接続テスト
    this.testConnection();
  }

  /**
   * データベース接続テスト
   */
  private async testConnection(): Promise<void> {
    try {
      const client = await this.renderPool.connect();
      await client.query('SELECT NOW()');
      client.release();
      console.log('✅ Render PostgreSQL接続成功');
    } catch (error) {
      console.error('❌ Render PostgreSQL接続失敗:', error);
      throw new Error(`Render DB接続エラー: ${error.message}`);
    }
  }

  /**
   * 同期システム開始
   */
  async startSync(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ 同期システムは既に実行中です');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Render-Supabase 同期システム開始');

    // 初期同期実行
    await this.performFullSync();

    // 定期同期開始
    setInterval(async () => {
      if (this.isRunning) {
        await this.performIncrementalSync();
      }
    }, this.syncInterval);
  }

  /**
   * 同期システム停止
   */
  async stopSync(): Promise<void> {
    this.isRunning = false;
    await this.renderPool.end();
    console.log('🛑 Render-Supabase 同期システム停止');
  }

  /**
   * 完全同期実行（初回・障害復旧時）
   */
  private async performFullSync(): Promise<void> {
    console.log('📊 完全同期実行中...');
    
    try {
      // 1. 未処理タスクをSupabaseから取得してRenderに同期
      const taskSync = await this.syncTasksFromSupabase();
      
      // 2. 完了済みタスクの結果をRenderからSupabaseに同期
      const resultSync = await this.syncResultsToSupabase();
      
      // 3. 同期状況を記録
      await this.updateSyncStatus('full_sync', {
        tasks_synced: taskSync.processed,
        results_synced: resultSync.processed,
        total_errors: taskSync.errors + resultSync.errors
      });

      console.log(`✅ 完全同期完了 - タスク: ${taskSync.processed}, 結果: ${resultSync.processed}`);
    } catch (error) {
      console.error('❌ 完全同期エラー:', error);
      await this.updateSyncStatus('full_sync', { error: error.message });
    }
  }

  /**
   * 増分同期実行（定期実行）
   */
  private async performIncrementalSync(): Promise<void> {
    try {
      // 最後の同期時刻を取得
      const lastSync = await this.getLastSyncTime();
      
      // 1. 新しいタスクを同期
      const taskSync = await this.syncTasksFromSupabase(lastSync);
      
      // 2. 更新された結果を同期
      const resultSync = await this.syncResultsToSupabase(lastSync);

      if (taskSync.processed > 0 || resultSync.processed > 0) {
        console.log(`🔄 増分同期完了 - タスク: ${taskSync.processed}, 結果: ${resultSync.processed}`);
      }
    } catch (error) {
      console.error('❌ 増分同期エラー:', error);
    }
  }

  /**
   * Supabaseからタスクを取得してRenderに同期
   */
  async syncTasksFromSupabase(since?: Date): Promise<SyncResult> {
    try {
      let query = supabase
        .from('tasks')
        .select(`
          id, user_id, account_id, recipient_name, message, status,
          scheduled_at, created_at, updated_at
        `)
        .in('status', ['pending', 'assigned']);

      if (since) {
        query = query.gt('updated_at', since.toISOString());
      }

      const { data: tasks, error } = await query.limit(100);

      if (error) {
        throw new Error(`Supabase取得エラー: ${error.message}`);
      }

      if (!tasks || tasks.length === 0) {
        return { success: true, processed: 0, errors: 0 };
      }

      let processed = 0;
      let errors = 0;

      for (const task of tasks) {
        try {
          // Renderデータベースに挿入または更新
          await this.renderPool.query(
            `INSERT INTO worker.tasks (
              supabase_task_id, worker_id, task_type, recipient_name, message,
              status, scheduled_at, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (supabase_task_id) 
            DO UPDATE SET
              status = EXCLUDED.status,
              scheduled_at = EXCLUDED.scheduled_at,
              updated_at = NOW()`,
            [
              task.id,
              null, // worker_idは後でアサイン
              'facebook_message',
              task.recipient_name,
              task.message,
              task.status,
              task.scheduled_at,
              task.created_at
            ]
          );

          // キューに追加
          await this.addToTaskQueue(task.id);
          
          processed++;
        } catch (error) {
          console.error(`タスク同期エラー (ID: ${task.id}):`, error);
          errors++;
        }
      }

      return { success: true, processed, errors };
    } catch (error) {
      console.error('Supabaseからのタスク同期エラー:', error);
      return { success: false, processed: 0, errors: 1, error: error.message };
    }
  }

  /**
   * Renderから結果を取得してSupabaseに同期
   */
  async syncResultsToSupabase(since?: Date): Promise<SyncResult> {
    try {
      let whereClause = "status IN ('completed', 'failed')";
      const params: any[] = [];

      if (since) {
        whereClause += " AND updated_at > $1";
        params.push(since.toISOString());
      }

      const { rows: completedTasks } = await this.renderPool.query(
        `SELECT supabase_task_id, status, completed_at, result, error_log, retry_count
         FROM worker.tasks 
         WHERE ${whereClause}
         ORDER BY updated_at DESC
         LIMIT 100`,
        params
      );

      if (completedTasks.length === 0) {
        return { success: true, processed: 0, errors: 0 };
      }

      let processed = 0;
      let errors = 0;

      for (const task of completedTasks) {
        try {
          const { error } = await supabase
            .from('tasks')
            .update({
              status: task.status,
              completed_at: task.completed_at,
              result: task.result,
              error_message: task.error_log,
              worker_id: task.worker_id
            })
            .eq('id', task.supabase_task_id);

          if (error) {
            throw error;
          }

          processed++;
        } catch (error) {
          console.error(`結果同期エラー (Task ID: ${task.supabase_task_id}):`, error);
          errors++;
        }
      }

      return { success: true, processed, errors };
    } catch (error) {
      console.error('Renderからの結果同期エラー:', error);
      return { success: false, processed: 0, errors: 1, error: error.message };
    }
  }

  /**
   * タスクをキューに追加
   */
  private async addToTaskQueue(taskId: string): Promise<void> {
    await this.renderPool.query(
      `INSERT INTO worker.task_queue (task_id, queue_name, priority)
       VALUES (
         (SELECT id FROM worker.tasks WHERE supabase_task_id = $1),
         'facebook',
         1
       )
       ON CONFLICT (task_id) DO NOTHING`,
      [taskId]
    );
  }

  /**
   * 最後の同期時刻を取得
   */
  private async getLastSyncTime(): Promise<Date> {
    const { rows } = await this.renderPool.query(
      `SELECT MAX(last_sync_at) as last_sync 
       FROM worker.sync_status 
       WHERE status = 'completed'`
    );

    const lastSync = rows[0]?.last_sync;
    return lastSync ? new Date(lastSync) : new Date(Date.now() - 3600000); // 1時間前をデフォルト
  }

  /**
   * 同期状況を更新
   */
  private async updateSyncStatus(syncType: string, details: any): Promise<void> {
    await this.renderPool.query(
      `INSERT INTO worker.sync_status (sync_type, last_sync_at, records_processed, errors_count, status, error_details)
       VALUES ($1, NOW(), $2, $3, $4, $5)`,
      [
        syncType,
        details.tasks_synced || details.results_synced || 0,
        details.total_errors || 0,
        details.error ? 'failed' : 'completed',
        details.error ? { error: details.error } : details
      ]
    );
  }

  /**
   * ワーカーメトリクスを取得
   */
  async getWorkerMetrics(): Promise<WorkerMetrics[]> {
    const { rows } = await this.renderPool.query(`
      SELECT 
        ws.worker_id,
        ws.worker_name,
        ws.status,
        ws.last_heartbeat,
        COALESCE(active.count, 0) as active_tasks,
        COALESCE(completed.count, 0) as completed_today,
        COALESCE(failed.count, 0) as failed_today
      FROM worker.worker_status ws
      LEFT JOIN (
        SELECT worker_id, COUNT(*) as count
        FROM worker.tasks
        WHERE status IN ('processing', 'assigned')
        GROUP BY worker_id
      ) active ON ws.worker_id = active.worker_id
      LEFT JOIN (
        SELECT worker_id, COUNT(*) as count
        FROM worker.tasks
        WHERE status = 'completed' AND DATE(completed_at) = CURRENT_DATE
        GROUP BY worker_id
      ) completed ON ws.worker_id = completed.worker_id
      LEFT JOIN (
        SELECT worker_id, COUNT(*) as count
        FROM worker.tasks
        WHERE status = 'failed' AND DATE(updated_at) = CURRENT_DATE
        GROUP BY worker_id
      ) failed ON ws.worker_id = failed.worker_id
      ORDER BY ws.last_heartbeat DESC
    `);

    return rows;
  }

  /**
   * システム統計を取得
   */
  async getSystemStats() {
    const [taskStats, workerStats, performanceStats] = await Promise.all([
      this.renderPool.query('SELECT * FROM worker.task_statistics'),
      this.renderPool.query('SELECT COUNT(*) as total_workers, COUNT(*) FILTER (WHERE status = \'online\') as online_workers FROM worker.worker_status'),
      this.renderPool.query(`
        SELECT 
          AVG(execution_time_ms) as avg_execution_time,
          COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
          COUNT(*) FILTER (WHERE status = 'failed') as failed_count
        FROM worker.execution_logs 
        WHERE logged_at > NOW() - INTERVAL '24 hours'
      `)
    ]);

    return {
      tasks: taskStats.rows[0] || {},
      workers: workerStats.rows[0] || {},
      performance: performanceStats.rows[0] || {}
    };
  }

  /**
   * 手動同期実行（API用）
   */
  async forceSyncAll(): Promise<SyncResult> {
    console.log('🔄 手動同期実行');
    
    try {
      const [taskSync, resultSync] = await Promise.all([
        this.syncTasksFromSupabase(),
        this.syncResultsToSupabase()
      ]);

      const totalProcessed = taskSync.processed + resultSync.processed;
      const totalErrors = taskSync.errors + resultSync.errors;

      await this.updateSyncStatus('manual_sync', {
        tasks_synced: taskSync.processed,
        results_synced: resultSync.processed,
        total_errors: totalErrors
      });

      return {
        success: totalErrors === 0,
        processed: totalProcessed,
        errors: totalErrors,
        details: { taskSync, resultSync }
      };
    } catch (error) {
      return {
        success: false,
        processed: 0,
        errors: 1,
        error: error.message
      };
    }
  }

  /**
   * ヘルスチェック
   */
  async healthCheck(): Promise<{ render: boolean; supabase: boolean; sync: boolean }> {
    try {
      // Render接続チェック
      const renderClient = await this.renderPool.connect();
      await renderClient.query('SELECT 1');
      renderClient.release();

      // Supabase接続チェック
      const { error: supabaseError } = await supabase.from('tasks').select('id').limit(1);

      // 最近の同期状況チェック
      const { rows } = await this.renderPool.query(
        'SELECT last_sync_at FROM worker.sync_status WHERE last_sync_at > NOW() - INTERVAL \'5 minutes\' LIMIT 1'
      );

      return {
        render: true,
        supabase: !supabaseError,
        sync: rows.length > 0
      };
    } catch (error) {
      console.error('ヘルスチェックエラー:', error);
      return { render: false, supabase: false, sync: false };
    }
  }
}

// シングルトンインスタンス
let syncManagerInstance: RenderSyncManager | null = null;

export const getRenderSyncManager = (): RenderSyncManager => {
  if (!syncManagerInstance) {
    syncManagerInstance = new RenderSyncManager();
  }
  return syncManagerInstance;
};