/**
 * SQLite統合ワーカー（Render無料プラン対応）
 * メモリ制限・リソース制限を考慮した軽量ワーカーシステム
 */

import { getDb } from '@/lib/sqlite/connection';
import { getSQLiteSyncManager } from '@/lib/sync/sqlite-sync';
import { performance } from 'perf_hooks';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';

interface WorkerConfig {
  workerId: string;
  workerName: string;
  maxConcurrentTasks: number;
  taskTimeout: number;
  retryDelay: number;
  heartbeatInterval: number;
  memoryLimit: number; // MB
}

interface TaskData {
  id: string;
  supabase_task_id: string;
  task_type: string;
  recipient_name: string;
  message: string;
  facebook_account_id?: string;
  retry_count: number;
  max_retries: number;
}

interface ExecutionResult {
  success: boolean;
  result?: any;
  error?: string;
  executionTime: number;
  steps: ExecutionStep[];
  memoryUsed: number;
}

interface ExecutionStep {
  name: string;
  status: 'started' | 'completed' | 'failed' | 'skipped';
  executionTime?: number;
  inputData?: any;
  outputData?: any;
  errorDetails?: any;
}

export class SQLiteWorker {
  private config: WorkerConfig;
  private syncManager: any;
  private isRunning: boolean = false;
  private activeTasks: Map<string, AbortController> = new Map();
  private heartbeatTimer?: NodeJS.Timeout;
  private cleanupTimer?: NodeJS.Timeout;

  constructor(config?: Partial<WorkerConfig>) {
    this.config = {
      workerId: config?.workerId || `sqlite-worker-${Date.now()}`,
      workerName: config?.workerName || `SQLite Worker`,
      maxConcurrentTasks: config?.maxConcurrentTasks || 1, // 無料プランでは1タスクのみ
      taskTimeout: config?.taskTimeout || 180000, // 3分制限（無料プラン）
      retryDelay: config?.retryDelay || 120000, // 2分リトライ間隔
      heartbeatInterval: config?.heartbeatInterval || 60000, // 1分間隔
      memoryLimit: config?.memoryLimit || 180, // 180MB制限
      ...config
    };

    this.syncManager = getSQLiteSyncManager();
    
    console.log(`🤖 SQLiteワーカー初期化: ${this.config.workerId}`);
    console.log(`📊 設定:`, {
      maxConcurrent: this.config.maxConcurrentTasks,
      memoryLimit: `${this.config.memoryLimit}MB`,
      timeout: `${this.config.taskTimeout/1000}秒`
    });
  }

  /**
   * ワーカー開始
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ ワーカーは既に実行中です');
      return;
    }

    this.isRunning = true;
    console.log(`🚀 SQLiteワーカー開始: ${this.config.workerId}`);

    try {
      // SQLite接続確認
      await getDb();
      
      // 同期マネージャー開始
      await this.syncManager.startSync();
      
      // ハートビート開始
      this.startHeartbeat();
      
      // クリーンアップタイマー開始
      this.startCleanupTimer();
      
      // メインワーカーループ開始
      this.startWorkerLoop();
      
      console.log('✅ SQLiteワーカー開始完了');
    } catch (error) {
      console.error('❌ ワーカー開始エラー:', error);
      this.isRunning = false;
      throw error;
    }
  }

  /**
   * ワーカー停止
   */
  async stop(): Promise<void> {
    console.log('🛑 SQLiteワーカー停止中...');
    this.isRunning = false;

    // アクティブなタスクを中止
    for (const [taskId, controller] of this.activeTasks) {
      console.log(`⏹️ タスク中止: ${taskId}`);
      controller.abort();
    }

    // タイマー停止
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    // 同期マネージャー停止
    await this.syncManager.stopSync();

    console.log('✅ SQLiteワーカー停止完了');
  }

  /**
   * ワーカーループ開始
   */
  private async startWorkerLoop(): Promise<void> {
    console.log('🔄 ワーカーループ開始');
    
    while (this.isRunning) {
      try {
        // メモリチェック
        if (!this.checkMemoryUsage()) {
          console.log('⚠️ メモリ使用量が制限に近いため待機中...');
          await this.sleep(30000);
          continue;
        }

        // 並行処理可能数をチェック
        if (this.activeTasks.size >= this.config.maxConcurrentTasks) {
          await this.sleep(5000);
          continue;
        }

        // 次のタスクを取得
        const task = await this.getNextTask();
        if (!task) {
          await this.sleep(15000); // 15秒待機
          continue;
        }

        // タスクを非同期で実行
        this.executeTaskAsync(task);
        
      } catch (error) {
        console.error('ワーカーループエラー:', error);
        await this.sleep(60000); // 1分待機してリトライ
      }
    }
  }

  /**
   * 次のタスクを取得
   */
  private async getNextTask(): Promise<TaskData | null> {
    try {
      const db = await getDb();
      
      const task = await db.get(`
        SELECT id, supabase_task_id, task_type, recipient_name, message, 
               facebook_account_id, retry_count, max_retries
        FROM tasks 
        WHERE status = 'pending'
        AND (scheduled_at IS NULL OR scheduled_at <= datetime('now'))
        ORDER BY created_at ASC
        LIMIT 1
      `);

      if (task) {
        // タスクを処理中に更新
        await db.run(`
          UPDATE tasks 
          SET status = 'processing', started_at = datetime('now'), worker_id = ?
          WHERE id = ?
        `, [this.config.workerId, task.id]);
      }

      return task;
    } catch (error) {
      console.error('次のタスク取得エラー:', error);
      return null;
    }
  }

  /**
   * タスクを非同期実行
   */
  private async executeTaskAsync(task: TaskData): Promise<void> {
    const controller = new AbortController();
    this.activeTasks.set(task.id, controller);

    try {
      console.log(`📋 タスク開始: ${task.supabase_task_id} (${task.recipient_name})`);

      // タイムアウト設定
      const timeout = setTimeout(() => {
        controller.abort();
        console.log(`⏰ タスクタイムアウト: ${task.supabase_task_id}`);
      }, this.config.taskTimeout);

      // タスク実行
      const result = await this.executeTask(task, controller.signal);

      clearTimeout(timeout);

      if (result.success) {
        await this.handleTaskSuccess(task, result);
      } else {
        await this.handleTaskFailure(task, result);
      }

    } catch (error) {
      if (error.name === 'AbortError') {
        console.log(`⏹️ タスク中止: ${task.supabase_task_id}`);
        await this.updateTaskStatus(task.id, 'failed', null, 'Task aborted');
      } else {
        console.error(`❌ タスクエラー: ${task.supabase_task_id}`, error);
        await this.handleTaskError(task, error);
      }
    } finally {
      this.activeTasks.delete(task.id);
    }
  }

  /**
   * 実際のタスク実行（軽量版）
   */
  private async executeTask(task: TaskData, signal: AbortSignal): Promise<ExecutionResult> {
    const startTime = performance.now();
    const steps: ExecutionStep[] = [];
    const startMemory = process.memoryUsage().rss;

    try {
      // Step 1: 事前チェック
      const checkStep = await this.executeStep('pre_check', async () => {
        if (signal.aborted) throw new Error('Task aborted');
        
        // メモリチェック
        const memUsage = process.memoryUsage().rss / 1024 / 1024;
        if (memUsage > this.config.memoryLimit) {
          throw new Error(`Memory limit exceeded: ${memUsage.toFixed(0)}MB`);
        }

        return { 
          memory_mb: memUsage,
          task_id: task.id,
          recipient: task.recipient_name
        };
      }, signal);
      steps.push(checkStep);

      // Step 2: Facebook アカウント情報取得（簡略版）
      const accountStep = await this.executeStep('get_facebook_account', async () => {
        if (signal.aborted) throw new Error('Task aborted');
        
        // 簡略化: 実際のアカウント取得は省略
        // 実装時はSupabaseから取得
        return {
          account_id: task.facebook_account_id || 'default',
          status: 'ready'
        };
      }, signal);
      steps.push(accountStep);

      // Step 3: Facebook処理のシミュレーション（軽量版）
      const facebookStep = await this.executeStep('facebook_simulation', async () => {
        if (signal.aborted) throw new Error('Task aborted');
        
        // 実際のブラウザ操作の代わりに軽量シミュレーション
        // 本実装時はPlaywrightを使用
        await this.sleep(2000 + Math.random() * 3000); // 2-5秒のランダム待機
        
        // ランダム成功/失敗（テスト用）
        const success = Math.random() > 0.2; // 80%成功率
        
        if (!success) {
          throw new Error('Facebook processing failed (simulated)');
        }

        return {
          message_sent: true,
          recipient: task.recipient_name,
          message_preview: task.message.substring(0, 50) + '...',
          sent_at: new Date().toISOString(),
          simulation: true
        };
      }, signal);
      steps.push(facebookStep);

      const executionTime = performance.now() - startTime;
      const endMemory = process.memoryUsage().rss;
      const memoryUsed = Math.round((endMemory - startMemory) / 1024 / 1024);

      return {
        success: true,
        result: facebookStep.outputData,
        executionTime,
        steps,
        memoryUsed
      };

    } catch (error) {
      const executionTime = performance.now() - startTime;
      const endMemory = process.memoryUsage().rss;
      const memoryUsed = Math.round((endMemory - startMemory) / 1024 / 1024);
      
      return {
        success: false,
        error: error.message,
        executionTime,
        steps,
        memoryUsed
      };
    }
  }

  /**
   * 実行ステップの共通処理
   */
  private async executeStep(
    stepName: string, 
    executor: () => Promise<any>, 
    signal: AbortSignal
  ): Promise<ExecutionStep> {
    const startTime = performance.now();
    
    const step: ExecutionStep = {
      name: stepName,
      status: 'started'
    };

    try {
      if (signal.aborted) {
        step.status = 'skipped';
        return step;
      }

      console.log(`  🔄 ${stepName} 実行中...`);
      
      const result = await executor();
      
      step.status = 'completed';
      step.executionTime = performance.now() - startTime;
      step.outputData = result;
      
      console.log(`  ✅ ${stepName} 完了 (${step.executionTime.toFixed(0)}ms)`);
      
      return step;
    } catch (error) {
      step.status = 'failed';
      step.executionTime = performance.now() - startTime;
      step.errorDetails = {
        message: error.message,
        stack: error.stack
      };
      
      console.log(`  ❌ ${stepName} 失敗: ${error.message}`);
      throw error;
    }
  }

  /**
   * タスク成功処理
   */
  private async handleTaskSuccess(task: TaskData, result: ExecutionResult): Promise<void> {
    await this.updateTaskStatus(task.id, 'completed', result.result);
    await this.logExecutionSteps(task.id, result.steps);
    console.log(`✅ タスク成功: ${task.supabase_task_id} (${result.executionTime.toFixed(0)}ms)`);
  }

  /**
   * タスク失敗処理
   */
  private async handleTaskFailure(task: TaskData, result: ExecutionResult): Promise<void> {
    if (task.retry_count < task.max_retries) {
      // リトライ
      await this.scheduleRetry(task);
      console.log(`🔄 タスクリトライ予定: ${task.supabase_task_id} (${task.retry_count + 1}/${task.max_retries})`);
    } else {
      // 最終失敗
      await this.updateTaskStatus(task.id, 'failed', null, result.error);
      console.log(`❌ タスク最終失敗: ${task.supabase_task_id}`);
    }
    
    await this.logExecutionSteps(task.id, result.steps);
  }

  /**
   * タスクエラー処理
   */
  private async handleTaskError(task: TaskData, error: any): Promise<void> {
    await this.updateTaskStatus(task.id, 'failed', null, error.message);
    console.error(`💥 タスクエラー: ${task.supabase_task_id}`, error);
  }

  /**
   * タスクステータス更新
   */
  private async updateTaskStatus(
    taskId: string, 
    status: string, 
    result?: any, 
    errorLog?: string
  ): Promise<void> {
    try {
      const db = await getDb();
      
      let sql = 'UPDATE tasks SET status = ?, updated_at = datetime(\'now\')';
      const params: any[] = [status];
      
      if (status === 'completed') {
        sql += ', completed_at = datetime(\'now\'), result = ?';
        params.push(result ? JSON.stringify(result) : null);
      }
      
      if (status === 'failed' && errorLog) {
        sql += ', error_log = ?';
        params.push(errorLog);
      }
      
      sql += ' WHERE id = ?';
      params.push(taskId);

      await db.run(sql, params);
    } catch (error) {
      console.error('タスクステータス更新エラー:', error);
    }
  }

  /**
   * リトライスケジュール
   */
  private async scheduleRetry(task: TaskData): Promise<void> {
    try {
      const db = await getDb();
      const retryAt = new Date(Date.now() + this.config.retryDelay * (task.retry_count + 1));
      
      await db.run(`
        UPDATE tasks 
        SET status = 'pending', retry_count = retry_count + 1, 
            scheduled_at = ?, updated_at = datetime('now')
        WHERE id = ?
      `, [retryAt.toISOString(), task.id]);
    } catch (error) {
      console.error('リトライスケジュールエラー:', error);
    }
  }

  /**
   * 実行ステップログ記録
   */
  private async logExecutionSteps(taskId: string, steps: ExecutionStep[]): Promise<void> {
    try {
      const db = await getDb();
      
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        await db.run(`
          INSERT INTO execution_logs (
            id, task_id, step_name, step_order, status, execution_time_ms,
            input_data, output_data, error_details, logged_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `, [
          uuidv4(),
          taskId,
          step.name,
          i + 1,
          step.status,
          Math.round(step.executionTime || 0),
          JSON.stringify(step.inputData || null),
          JSON.stringify(step.outputData || null),
          JSON.stringify(step.errorDetails || null)
        ]);
      }
    } catch (error) {
      console.error('実行ステップログエラー:', error);
    }
  }

  /**
   * メモリ使用量チェック
   */
  private checkMemoryUsage(): boolean {
    const memUsage = process.memoryUsage().rss / 1024 / 1024; // MB
    
    if (memUsage > this.config.memoryLimit) {
      console.log(`⚠️ メモリ使用量警告: ${memUsage.toFixed(0)}MB / ${this.config.memoryLimit}MB`);
      
      // ガベージコレクション実行
      if (global.gc) {
        global.gc();
        console.log('🗑️ ガベージコレクション実行');
      }
      
      return false;
    }
    
    return true;
  }

  /**
   * ハートビート開始
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(async () => {
      try {
        await this.sendHeartbeat();
      } catch (error) {
        console.error('ハートビートエラー:', error);
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * ハートビート送信
   */
  private async sendHeartbeat(): Promise<void> {
    try {
      const memUsage = process.memoryUsage();
      const db = await getDb();
      
      await db.run(`
        INSERT INTO system_metrics (
          id, worker_id, memory_usage_mb, active_tasks, recorded_at
        ) VALUES (?, ?, ?, ?, datetime('now'))
      `, [
        uuidv4(),
        this.config.workerId,
        Math.round(memUsage.rss / 1024 / 1024),
        this.activeTasks.size
      ]);
    } catch (error) {
      console.error('ハートビート送信エラー:', error);
    }
  }

  /**
   * クリーンアップタイマー開始
   */
  private startCleanupTimer(): void {
    // 30分ごとにクリーンアップ実行
    this.cleanupTimer = setInterval(async () => {
      try {
        await this.syncManager.cleanup();
      } catch (error) {
        console.error('クリーンアップエラー:', error);
      }
    }, 1800000);
  }

  /**
   * スリープ
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// プロセス終了時の処理
let worker: SQLiteWorker | null = null;

process.on('SIGTERM', async () => {
  console.log('📡 SIGTERM受信');
  if (worker) {
    await worker.stop();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('📡 SIGINT受信');
  if (worker) {
    await worker.stop();
  }
  process.exit(0);
});

// ワーカー起動
if (require.main === module) {
  const startWorker = async () => {
    worker = new SQLiteWorker();
    await worker.start();
  };

  startWorker().catch(error => {
    console.error('ワーカー起動失敗:', error);
    process.exit(1);
  });
}