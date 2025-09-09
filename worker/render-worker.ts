/**
 * Render統合ワーカーシステム
 * PostgreSQLからタスクを取得してFacebook操作を実行
 */

import { Pool } from 'pg';
import { getRenderSyncManager } from '@/lib/render/sync-manager';
import os from 'os';
import { performance } from 'perf_hooks';

interface WorkerConfig {
  workerId: string;
  workerName: string;
  maxConcurrentTasks: number;
  taskTimeout: number;
  retryDelay: number;
  heartbeatInterval: number;
}

interface TaskData {
  id: string;
  supabase_task_id: string;
  task_type: string;
  recipient_name: string;
  message: string;
  facebook_account_id?: string;
  execution_details?: any;
  retry_count: number;
  max_retries: number;
}

interface ExecutionResult {
  success: boolean;
  result?: any;
  error?: string;
  executionTime: number;
  steps: ExecutionStep[];
}

interface ExecutionStep {
  name: string;
  status: 'started' | 'completed' | 'failed' | 'skipped';
  executionTime?: number;
  inputData?: any;
  outputData?: any;
  errorDetails?: any;
  screenshotPath?: string;
}

export class RenderIntegratedWorker {
  private config: WorkerConfig;
  private renderPool: Pool;
  private syncManager: any;
  private isRunning: boolean = false;
  private activeTasks: Map<string, AbortController> = new Map();
  private heartbeatTimer?: NodeJS.Timeout;

  constructor(config?: Partial<WorkerConfig>) {
    this.config = {
      workerId: config?.workerId || `worker-${os.hostname()}-${Date.now()}`,
      workerName: config?.workerName || `Render Worker ${os.hostname()}`,
      maxConcurrentTasks: config?.maxConcurrentTasks || 3,
      taskTimeout: config?.taskTimeout || 300000, // 5分
      retryDelay: config?.retryDelay || 60000, // 1分
      heartbeatInterval: config?.heartbeatInterval || 30000, // 30秒
      ...config
    };

    this.renderPool = new Pool({
      connectionString: process.env.RENDER_DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 5,
      idleTimeoutMillis: 30000,
    });

    this.syncManager = getRenderSyncManager();
    
    console.log(`🤖 ワーカー初期化: ${this.config.workerId}`);
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
    console.log(`🚀 Renderワーカー開始: ${this.config.workerId}`);

    try {
      // ワーカーステータスを登録
      await this.registerWorker();
      
      // 同期マネージャー開始
      await this.syncManager.startSync();
      
      // ハートビート開始
      this.startHeartbeat();
      
      // メインワーカーループ開始
      this.startWorkerLoop();
      
      console.log('✅ ワーカー開始完了');
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
    console.log('🛑 ワーカー停止中...');
    this.isRunning = false;

    // アクティブなタスクを中止
    for (const [taskId, controller] of this.activeTasks) {
      console.log(`⏹️ タスク中止: ${taskId}`);
      controller.abort();
    }

    // ハートビート停止
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    // ワーカーステータス更新
    await this.updateWorkerStatus('offline');

    // 接続プール終了
    await this.renderPool.end();
    await this.syncManager.stopSync();

    console.log('✅ ワーカー停止完了');
  }

  /**
   * ワーカー登録
   */
  private async registerWorker(): Promise<void> {
    await this.renderPool.query(`
      INSERT INTO worker.worker_status (
        worker_id, worker_name, status, hostname, ip_address, 
        max_concurrent_tasks, supported_platforms, version
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (worker_id) 
      DO UPDATE SET
        status = EXCLUDED.status,
        hostname = EXCLUDED.hostname,
        last_heartbeat = NOW(),
        updated_at = NOW()
    `, [
      this.config.workerId,
      this.config.workerName,
      'online',
      os.hostname(),
      await this.getLocalIP(),
      this.config.maxConcurrentTasks,
      JSON.stringify(['facebook']),
      '2.0.0'
    ]);
  }

  /**
   * ワーカーループ開始
   */
  private async startWorkerLoop(): Promise<void> {
    while (this.isRunning) {
      try {
        // 並行処理可能数をチェック
        if (this.activeTasks.size >= this.config.maxConcurrentTasks) {
          await this.sleep(5000); // 5秒待機
          continue;
        }

        // 次のタスクを取得
        const task = await this.getNextTask();
        if (!task) {
          await this.sleep(10000); // 10秒待機
          continue;
        }

        // タスクを非同期で実行
        this.executeTaskAsync(task);
        
      } catch (error) {
        console.error('ワーカーループエラー:', error);
        await this.sleep(30000); // 30秒待機してリトライ
      }
    }
  }

  /**
   * 次のタスクを取得
   */
  private async getNextTask(): Promise<TaskData | null> {
    const { rows } = await this.renderPool.query(`
      UPDATE worker.task_queue 
      SET locked_at = NOW(), locked_by = $1
      WHERE id IN (
        SELECT id FROM worker.task_queue
        WHERE available_at <= NOW() 
        AND locked_at IS NULL
        ORDER BY priority DESC, available_at ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      )
      RETURNING task_id
    `, [this.config.workerId]);

    if (rows.length === 0) {
      return null;
    }

    const { rows: taskRows } = await this.renderPool.query(`
      SELECT 
        t.id, t.supabase_task_id, t.task_type, t.recipient_name, 
        t.message, t.facebook_account_id, t.execution_details,
        t.retry_count, t.max_retries
      FROM worker.tasks t
      WHERE t.id = $1 AND t.status = 'pending'
    `, [rows[0].task_id]);

    return taskRows.length > 0 ? taskRows[0] : null;
  }

  /**
   * タスクを非同期実行
   */
  private async executeTaskAsync(task: TaskData): Promise<void> {
    const controller = new AbortController();
    this.activeTasks.set(task.id, controller);

    try {
      console.log(`📋 タスク開始: ${task.supabase_task_id} (${task.recipient_name})`);

      // タスクステータス更新
      await this.updateTaskStatus(task.id, 'processing');

      // タスク実行
      const result = await this.executeTask(task, controller.signal);

      if (result.success) {
        await this.handleTaskSuccess(task, result);
      } else {
        await this.handleTaskFailure(task, result);
      }

    } catch (error) {
      console.error(`❌ タスクエラー: ${task.supabase_task_id}`, error);
      await this.handleTaskError(task, error);
    } finally {
      this.activeTasks.delete(task.id);
    }
  }

  /**
   * 実際のタスク実行
   */
  private async executeTask(task: TaskData, signal: AbortSignal): Promise<ExecutionResult> {
    const startTime = performance.now();
    const steps: ExecutionStep[] = [];

    try {
      // Step 1: Facebook アカウント情報取得
      const accountStep = await this.executeStep('get_facebook_account', async () => {
        return await this.getFacebookAccount(task.facebook_account_id);
      }, signal);
      steps.push(accountStep);

      if (!accountStep.outputData) {
        throw new Error('Facebook アカウント情報の取得に失敗');
      }

      // Step 2: ブラウザ起動
      const browserStep = await this.executeStep('launch_browser', async () => {
        return await this.launchBrowser();
      }, signal);
      steps.push(browserStep);

      // Step 3: Facebook ログイン
      const loginStep = await this.executeStep('facebook_login', async () => {
        return await this.performFacebookLogin(browserStep.outputData, accountStep.outputData);
      }, signal);
      steps.push(loginStep);

      // Step 4: メッセージ送信
      const messageStep = await this.executeStep('send_message', async () => {
        return await this.sendFacebookMessage(
          browserStep.outputData, 
          task.recipient_name, 
          task.message
        );
      }, signal);
      steps.push(messageStep);

      // Step 5: ブラウザ終了
      const cleanupStep = await this.executeStep('cleanup_browser', async () => {
        if (browserStep.outputData?.browser) {
          await browserStep.outputData.browser.close();
        }
        return { cleaned: true };
      }, signal);
      steps.push(cleanupStep);

      const executionTime = performance.now() - startTime;

      return {
        success: true,
        result: messageStep.outputData,
        executionTime,
        steps
      };

    } catch (error) {
      const executionTime = performance.now() - startTime;
      
      return {
        success: false,
        error: error.message,
        executionTime,
        steps
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
   * Facebookアカウント情報取得
   */
  private async getFacebookAccount(accountId?: string): Promise<any> {
    // Supabaseからアカウント情報を取得
    // 実装は省略（既存のfacebook_worker.tsから移植）
    return {
      email: 'dummy@example.com',
      password: 'dummy_password'
    };
  }

  /**
   * ブラウザ起動
   */
  private async launchBrowser(): Promise<any> {
    // Playwright/Puppeteerでブラウザ起動
    // 実装は省略（既存のfacebook_worker.tsから移植）
    return {
      browser: null,
      page: null
    };
  }

  /**
   * Facebookログイン実行
   */
  private async performFacebookLogin(browser: any, account: any): Promise<any> {
    // Facebook自動ログイン処理
    // 実装は省略（既存のfacebook_worker.tsから移植）
    return {
      logged_in: true,
      session_cookies: []
    };
  }

  /**
   * メッセージ送信実行
   */
  private async sendFacebookMessage(browser: any, recipient: string, message: string): Promise<any> {
    // Facebook自動メッセージ送信処理
    // 実装は省略（既存のfacebook_worker.tsから移植）
    return {
      message_sent: true,
      recipient: recipient,
      sent_at: new Date().toISOString()
    };
  }

  /**
   * タスク成功処理
   */
  private async handleTaskSuccess(task: TaskData, result: ExecutionResult): Promise<void> {
    await this.updateTaskStatus(task.id, 'completed', result.result);
    await this.logExecutionSteps(task.id, result.steps);
    console.log(`✅ タスク成功: ${task.supabase_task_id}`);
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
    const updateFields: string[] = ['status = $2'];
    const params: any[] = [taskId, status];
    
    if (status === 'processing') {
      updateFields.push('started_at = NOW()');
      updateFields.push('worker_id = $3');
      params.push(this.config.workerId);
    }
    
    if (status === 'completed') {
      updateFields.push('completed_at = NOW()');
      updateFields.push('result = $3');
      params.push(JSON.stringify(result));
    }
    
    if (status === 'failed' && errorLog) {
      updateFields.push('error_log = $3');
      params.push(errorLog);
    }
    
    updateFields.push('updated_at = NOW()');

    await this.renderPool.query(
      `UPDATE worker.tasks SET ${updateFields.join(', ')} WHERE id = $1`,
      params
    );
  }

  /**
   * リトライスケジュール
   */
  private async scheduleRetry(task: TaskData): Promise<void> {
    const retryAt = new Date(Date.now() + this.config.retryDelay * (task.retry_count + 1));
    
    await this.renderPool.query(
      `UPDATE worker.tasks 
       SET status = 'pending', retry_count = retry_count + 1, updated_at = NOW()
       WHERE id = $1`,
      [task.id]
    );

    await this.renderPool.query(
      `UPDATE worker.task_queue 
       SET available_at = $1, locked_at = NULL, locked_by = NULL, attempts = attempts + 1
       WHERE task_id = $2`,
      [retryAt, task.id]
    );
  }

  /**
   * 実行ステップログ記録
   */
  private async logExecutionSteps(taskId: string, steps: ExecutionStep[]): Promise<void> {
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      await this.renderPool.query(`
        INSERT INTO worker.execution_logs (
          task_id, step_name, step_order, status, execution_time_ms,
          input_data, output_data, error_details, logged_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      `, [
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
    const metrics = await this.getSystemMetrics();
    
    await this.renderPool.query(
      'UPDATE worker.worker_status SET last_heartbeat = NOW(), updated_at = NOW() WHERE worker_id = $1',
      [this.config.workerId]
    );

    await this.renderPool.query(`
      INSERT INTO worker.system_metrics (
        worker_id, hostname, cpu_usage, memory_usage, memory_total_mb, memory_used_mb,
        active_tasks, recorded_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
    `, [
      this.config.workerId,
      os.hostname(),
      metrics.cpu_usage,
      metrics.memory_usage_percent,
      metrics.memory_total_mb,
      metrics.memory_used_mb,
      this.activeTasks.size
    ]);
  }

  /**
   * システムメトリクス取得
   */
  private async getSystemMetrics() {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    return {
      cpu_usage: 0, // CPU使用率の計算は複雑なので省略
      memory_usage_percent: (usedMemory / totalMemory) * 100,
      memory_total_mb: Math.round(totalMemory / 1024 / 1024),
      memory_used_mb: Math.round(usedMemory / 1024 / 1024)
    };
  }

  /**
   * ワーカーステータス更新
   */
  private async updateWorkerStatus(status: string): Promise<void> {
    await this.renderPool.query(
      'UPDATE worker.worker_status SET status = $1, updated_at = NOW() WHERE worker_id = $2',
      [status, this.config.workerId]
    );
  }

  /**
   * ローカルIP取得
   */
  private async getLocalIP(): Promise<string> {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const net of interfaces[name] || []) {
        if (net.family === 'IPv4' && !net.internal) {
          return net.address;
        }
      }
    }
    return '127.0.0.1';
  }

  /**
   * スリープ
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// プロセス終了時の処理
let worker: RenderIntegratedWorker | null = null;

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
    worker = new RenderIntegratedWorker();
    await worker.start();
  };

  startWorker().catch(error => {
    console.error('ワーカー起動失敗:', error);
    process.exit(1);
  });
}