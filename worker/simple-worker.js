/**
 * 超軽量ファイルベースワーカー（Render無料プラン対応）
 */

const fs = require('fs');
const path = require('path');

class SimpleWorker {
  constructor() {
    this.workerId = `worker-${Date.now()}`;
    this.isRunning = false;
    this.dataDir = path.join(process.cwd(), 'data');
    this.tasksFile = path.join(this.dataDir, 'tasks.json');
    this.statusFile = path.join(this.dataDir, 'status.json');
    
    // データディレクトリ作成
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
    
    console.log(`🤖 簡易ワーカー初期化: ${this.workerId}`);
  }

  async start() {
    this.isRunning = true;
    console.log(`🚀 簡易ワーカー開始: ${this.workerId}`);
    
    // 初期ステータス作成
    this.updateStatus({
      worker_id: this.workerId,
      status: 'online',
      memory_mb: Math.round(process.memoryUsage().rss / 1024 / 1024),
      started_at: new Date().toISOString(),
      last_heartbeat: new Date().toISOString()
    });

    // Keep-Alive開始
    this.startKeepAlive();
    
    // メインループ開始
    this.startMainLoop();
  }

  startKeepAlive() {
    console.log('🔄 Keep-Alive開始');
    
    setInterval(() => {
      const memUsage = Math.round(process.memoryUsage().rss / 1024 / 1024);
      console.log(`📊 メモリ使用量: ${memUsage}MB`);
      
      this.updateStatus({
        worker_id: this.workerId,
        status: 'online',
        memory_mb: memUsage,
        last_heartbeat: new Date().toISOString()
      });
      
      // ガベージコレクション
      if (memUsage > 150 && global.gc) {
        global.gc();
        console.log('🗑️ ガベージコレクション実行');
      }
      
    }, 60000); // 1分間隔
  }

  async startMainLoop() {
    console.log('🔄 メインループ開始');
    
    while (this.isRunning) {
      try {
        // タスク処理（シミュレーション）
        console.log('📋 タスク確認中...');
        
        // 簡単なタスクファイル確認
        this.processTasks();
        
        // 30秒待機
        await this.sleep(30000);
        
      } catch (error) {
        console.error('❌ メインループエラー:', error);
        await this.sleep(60000);
      }
    }
  }

  processTasks() {
    try {
      if (fs.existsSync(this.tasksFile)) {
        const tasks = JSON.parse(fs.readFileSync(this.tasksFile, 'utf8') || '[]');
        const pendingTasks = tasks.filter(task => task.status === 'pending');
        
        if (pendingTasks.length > 0) {
          console.log(`📨 ${pendingTasks.length}件のタスクを確認`);
          
          // 最初のタスクを処理
          const task = pendingTasks[0];
          task.status = 'completed';
          task.completed_at = new Date().toISOString();
          task.result = 'シミュレーション完了';
          
          // ファイルに保存
          fs.writeFileSync(this.tasksFile, JSON.stringify(tasks, null, 2));
          console.log(`✅ タスク処理完了: ${task.id || task.message?.slice(0, 20)}`);
        }
      }
    } catch (error) {
      console.error('❌ タスク処理エラー:', error);
    }
  }

  updateStatus(status) {
    try {
      fs.writeFileSync(this.statusFile, JSON.stringify(status, null, 2));
    } catch (error) {
      console.error('❌ ステータス更新エラー:', error);
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async stop() {
    console.log('🛑 簡易ワーカー停止中...');
    this.isRunning = false;
    
    this.updateStatus({
      worker_id: this.workerId,
      status: 'offline',
      stopped_at: new Date().toISOString()
    });
    
    console.log('✅ 簡易ワーカー停止完了');
  }
}

// プロセス終了処理
let worker = null;

process.on('SIGTERM', async () => {
  console.log('📡 SIGTERM受信');
  if (worker) await worker.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('📡 SIGINT受信');
  if (worker) await worker.stop();
  process.exit(0);
});

// ワーカー起動
const startWorker = async () => {
  try {
    worker = new SimpleWorker();
    await worker.start();
  } catch (error) {
    console.error('❌ ワーカー起動失敗:', error);
    process.exit(1);
  }
};

startWorker();