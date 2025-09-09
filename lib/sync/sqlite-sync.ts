/**
 * SQLite同期システム（Render無料プラン対応）
 * Supabase ↔ SQLite の軽量同期システム
 */

import { getDb } from '@/lib/sqlite/connection';
import { supabase } from '@/lib/supabase/client';
import { v4 as uuidv4 } from 'uuid';

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
  account_id?: string;
  recipient_name: string;
  message: string;
  status: string;
  scheduled_at?: string;
  created_at: string;
}

export class SQLiteSyncManager {
  private syncInterval: number;
  private isRunning: boolean = false;
  private maxRetries = 3;
  private batchSize = 5; // 無料プラン用に小さく設定

  constructor() {
    this.syncInterval = parseInt(process.env.SYNC_INTERVAL || '300000', 10); // 5分間隔
    console.log(`📊 SQLite同期マネージャー初期化 (間隔: ${this.syncInterval/1000}秒)`);
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
    console.log('🚀 SQLite同期システム開始');

    // 初期同期実行
    await this.performInitialSync();

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
    console.log('🛑 SQLite同期システム停止');
  }

  /**
   * 初期同期実行
   */
  private async performInitialSync(): Promise<void> {
    console.log('📊 初期同期実行中...');
    
    try {
      // 未処理タスクを同期
      const taskSync = await this.syncTasksFromSupabase();
      
      // 完了済みタスクの結果を同期
      const resultSync = await this.syncResultsToSupabase();
      
      // 同期状況を記録
      await this.updateSyncStatus('initial_sync', {
        tasks_synced: taskSync.processed,
        results_synced: resultSync.processed,
        total_errors: taskSync.errors + resultSync.errors
      });

      console.log(`✅ 初期同期完了 - タスク: ${taskSync.processed}, 結果: ${resultSync.processed}`);
    } catch (error) {
      console.error('❌ 初期同期エラー:', error);
      await this.updateSyncStatus('initial_sync', { error: error.message });
    }
  }

  /**
   * 増分同期実行（定期実行）
   */
  private async performIncrementalSync(): Promise<void> {
    try {
      // メモリ使用量チェック
      const memoryUsage = process.memoryUsage();
      if (memoryUsage.rss > 180 * 1024 * 1024) { // 180MB制限
        console.log('⚠️ メモリ使用量が多いため同期をスキップ');
        return;
      }

      // 最後の同期時刻を取得
      const lastSync = await this.getLastSyncTime();
      
      // 新しいタスクを同期
      const taskSync = await this.syncTasksFromSupabase(lastSync);
      
      // 更新された結果を同期
      const resultSync = await this.syncResultsToSupabase();

      if (taskSync.processed > 0 || resultSync.processed > 0) {
        console.log(`🔄 増分同期完了 - タスク: ${taskSync.processed}, 結果: ${resultSync.processed}`);
      }
    } catch (error) {
      console.error('❌ 増分同期エラー:', error);
    }
  }

  /**
   * Supabaseからタスクを取得してSQLiteに同期
   */
  async syncTasksFromSupabase(since?: Date): Promise<SyncResult> {
    try {
      let query = supabase
        .from('tasks')
        .select(`
          id, user_id, account_id, recipient_name, message, status,
          scheduled_at, created_at, updated_at
        `)
        .in('status', ['pending', 'assigned'])
        .limit(this.batchSize);

      if (since) {
        query = query.gt('updated_at', since.toISOString());
      }

      const { data: tasks, error } = await query;

      if (error) {
        throw new Error(`Supabase取得エラー: ${error.message}`);
      }

      if (!tasks || tasks.length === 0) {
        return { success: true, processed: 0, errors: 0 };
      }

      let processed = 0;
      let errors = 0;
      const db = await getDb();

      for (const task of tasks) {
        try {
          await db.run(`
            INSERT OR REPLACE INTO tasks (
              id, supabase_task_id, task_type, recipient_name, message,
              status, scheduled_at, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            uuidv4(),
            task.id,
            'facebook_message',
            task.recipient_name,
            task.message,
            task.status,
            task.scheduled_at,
            task.created_at,
            new Date().toISOString()
          ]);
          
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
   * SQLiteから結果を取得してSupabaseに同期
   */
  async syncResultsToSupabase(): Promise<SyncResult> {
    try {
      const db = await getDb();
      
      const completedTasks = await db.all(`
        SELECT supabase_task_id, status, completed_at, result, error_log, worker_id
        FROM tasks 
        WHERE status IN ('completed', 'failed')
        AND (completed_at > datetime('now', '-1 hour') OR updated_at > datetime('now', '-1 hour'))
        LIMIT ?
      `, [this.batchSize]);

      if (completedTasks.length === 0) {
        return { success: true, processed: 0, errors: 0 };
      }

      let processed = 0;
      let errors = 0;

      for (const task of completedTasks) {
        try {
          const updateData: any = {
            status: task.status,
            worker_id: task.worker_id
          };

          if (task.completed_at) {
            updateData.completed_at = task.completed_at;
          }

          if (task.result) {
            try {
              updateData.result = JSON.parse(task.result);
            } catch {
              updateData.result = task.result;
            }
          }

          if (task.error_log) {
            updateData.error_message = task.error_log;
          }

          const { error } = await supabase
            .from('tasks')
            .update(updateData)
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
      console.error('SQLiteからの結果同期エラー:', error);
      return { success: false, processed: 0, errors: 1, error: error.message };
    }
  }

  /**
   * 最後の同期時刻を取得
   */
  private async getLastSyncTime(): Promise<Date> {
    try {
      const db = await getDb();
      
      const result = await db.get(`
        SELECT MAX(last_sync_at) as last_sync 
        FROM sync_status 
        WHERE status = 'completed'
      `);

      const lastSync = result?.last_sync;
      return lastSync ? new Date(lastSync) : new Date(Date.now() - 3600000); // 1時間前をデフォルト
    } catch (error) {
      console.error('最終同期時刻取得エラー:', error);
      return new Date(Date.now() - 3600000);
    }
  }

  /**
   * 同期状況を更新
   */
  private async updateSyncStatus(syncType: string, details: any): Promise<void> {
    try {
      const db = await getDb();
      
      await db.run(`
        INSERT INTO sync_status (id, sync_type, last_sync_at, records_processed, errors_count, status, error_details)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        uuidv4(),
        syncType,
        new Date().toISOString(),
        details.tasks_synced || details.results_synced || 0,
        details.total_errors || 0,
        details.error ? 'failed' : 'completed',
        details.error ? JSON.stringify({ error: details.error }) : JSON.stringify(details)
      ]);
    } catch (error) {
      console.error('同期状況更新エラー:', error);
    }
  }

  /**
   * システム統計を取得
   */
  async getSystemStats() {
    try {
      const db = await getDb();
      
      const [taskStats, logStats, syncStats] = await Promise.all([
        db.get(`
          SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
            COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing_count,
            COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
            COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count,
            COUNT(CASE WHEN date(created_at) = date('now') THEN 1 END) as today_count
          FROM tasks
        `),
        db.get('SELECT COUNT(*) as total_logs FROM execution_logs'),
        db.get(`
          SELECT 
            COUNT(*) as total_syncs,
            COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_syncs,
            MAX(last_sync_at) as last_sync_time
          FROM sync_status
        `)
      ]);

      // 成功率を計算
      const successRate = taskStats.completed_count + taskStats.failed_count > 0 
        ? Math.round((taskStats.completed_count / (taskStats.completed_count + taskStats.failed_count)) * 100)
        : 0;

      return {
        tasks: {
          ...taskStats,
          success_rate: successRate
        },
        logs: logStats,
        sync: syncStats,
        memory: process.memoryUsage()
      };
    } catch (error) {
      console.error('システム統計取得エラー:', error);
      return {
        tasks: { total: 0, pending_count: 0, processing_count: 0, completed_count: 0, failed_count: 0, today_count: 0, success_rate: 0 },
        logs: { total_logs: 0 },
        sync: { total_syncs: 0, successful_syncs: 0, last_sync_time: null },
        memory: process.memoryUsage()
      };
    }
  }

  /**
   * 手動同期実行
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
  async healthCheck(): Promise<{ sqlite: boolean; supabase: boolean; memory: boolean }> {
    try {
      // SQLite接続チェック
      const db = await getDb();
      await db.get('SELECT 1');

      // Supabase接続チェック
      const { error: supabaseError } = await supabase.from('tasks').select('id').limit(1);

      // メモリチェック
      const memoryUsage = process.memoryUsage();
      const memoryOk = memoryUsage.rss < 200 * 1024 * 1024; // 200MB制限

      return {
        sqlite: true,
        supabase: !supabaseError,
        memory: memoryOk
      };
    } catch (error) {
      console.error('ヘルスチェックエラー:', error);
      return { sqlite: false, supabase: false, memory: false };
    }
  }

  /**
   * データベースクリーンアップ
   */
  async cleanup(): Promise<void> {
    try {
      const db = await getDb();
      
      // 1週間以上前の完了タスクを削除
      await db.run(`
        DELETE FROM tasks 
        WHERE status IN ('completed', 'failed') 
        AND completed_at < datetime('now', '-7 days')
      `);

      // 古い実行ログを削除
      await db.run(`
        DELETE FROM execution_logs 
        WHERE logged_at < datetime('now', '-3 days')
      `);

      // 古い同期ステータスを削除
      await db.run(`
        DELETE FROM sync_status 
        WHERE last_sync_at < datetime('now', '-1 day')
      `);

      console.log('✅ データベースクリーンアップ完了');
    } catch (error) {
      console.error('❌ クリーンアップエラー:', error);
    }
  }
}

// シングルトンインスタンス
let syncManagerInstance: SQLiteSyncManager | null = null;

export const getSQLiteSyncManager = (): SQLiteSyncManager => {
  if (!syncManagerInstance) {
    syncManagerInstance = new SQLiteSyncManager();
  }
  return syncManagerInstance;
};