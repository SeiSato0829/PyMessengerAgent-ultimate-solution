/**
 * SQLite統合ワーカー（Render無料プラン対応） - JavaScript版
 * TypeScriptエラー回避のためJavaScript版で実装
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { performance } = require('perf_hooks');

// SQLite3を動的にインポート
let sqlite3;
let sqlite;

async function initDatabase() {
  try {
    sqlite3 = require('sqlite3');
    sqlite = require('sqlite');
    
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log('📁 データディレクトリ作成:', dataDir);
    }

    const dbPath = path.join(dataDir, 'worker.db');
    
    const db = await sqlite.open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    // WALモード有効化
    await db.exec('PRAGMA journal_mode = WAL');
    await db.exec('PRAGMA synchronous = NORMAL');
    
    // テーブル初期化
    await initializeTables(db);
    
    console.log('✅ SQLite接続成功:', dbPath);
    return db;
  } catch (error) {
    console.error('❌ SQLite接続エラー:', error);
    throw error;
  }
}

async function initializeTables(db) {
  try {
    // タスクテーブル
    await db.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        supabase_task_id TEXT UNIQUE NOT NULL,
        task_type TEXT DEFAULT 'facebook_message',
        recipient_name TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        worker_id TEXT,
        
        scheduled_at TEXT,
        started_at TEXT,
        completed_at TEXT,
        
        result TEXT,
        error_log TEXT,
        retry_count INTEGER DEFAULT 0,
        max_retries INTEGER DEFAULT 3,
        
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        
        CHECK (status IN ('pending', 'assigned', 'processing', 'completed', 'failed', 'cancelled', 'retrying'))
      )
    `);

    // システムメトリクステーブル
    await db.exec(`
      CREATE TABLE IF NOT EXISTS system_metrics (
        id TEXT PRIMARY KEY,
        worker_id TEXT NOT NULL,
        memory_usage_mb INTEGER,
        active_tasks INTEGER DEFAULT 0,
        recorded_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // インデックス作成
    await db.exec('CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)');
    
    console.log('✅ SQLiteテーブル初期化完了');
  } catch (error) {
    console.error('❌ テーブル初期化エラー:', error);
    throw error;
  }
}

class SQLiteWorker {
  constructor() {
    this.workerId = `sqlite-worker-${Date.now()}`;
    this.workerName = 'SQLite Worker';
    this.maxConcurrentTasks = 1;
    this.memoryLimit = 180; // MB
    this.isRunning = false;
    this.activeTasks = new Map();
    this.db = null;
    
    console.log(`🤖 SQLiteワーカー初期化: ${this.workerId}`);
  }

  async start() {
    if (this.isRunning) {
      console.log('⚠️ ワーカーは既に実行中です');
      return;
    }

    this.isRunning = true;
    console.log(`🚀 SQLiteワーカー開始: ${this.workerId}`);

    try {
      // SQLite接続
      this.db = await initDatabase();
      
      // Keep-Alive開始
      this.startKeepAlive();
      
      // ハートビート開始
      this.startHeartbeat();
      
      // メインワーカーループ開始
      this.startWorkerLoop();
      
      console.log('✅ SQLiteワーカー開始完了');
    } catch (error) {
      console.error('❌ ワーカー開始エラー:', error);
      this.isRunning = false;
      throw error;
    }
  }

  async stop() {
    console.log('🛑 SQLiteワーカー停止中...');
    this.isRunning = false;

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
    }

    if (this.db) {
      await this.db.close();
    }

    console.log('✅ SQLiteワーカー停止完了');
  }

  startKeepAlive() {
    console.log('🔄 Keep-Alive システム開始');
    
    this.keepAliveTimer = setInterval(() => {
      const memUsage = process.memoryUsage();
      const memUsageMB = Math.round(memUsage.rss / 1024 / 1024);
      
      console.log(`📊 メモリ使用量: ${memUsageMB}MB`);
      
      if (memUsageMB > this.memoryLimit) {
        console.log('⚠️ メモリ使用量が制限に接近');
        if (global.gc) {
          global.gc();
          console.log('🗑️ ガベージコレクション実行');
        }
      }
    }, 60000); // 1分間隔
  }

  startHeartbeat() {
    this.heartbeatTimer = setInterval(async () => {
      try {
        if (this.db) {
          const memUsage = process.memoryUsage();
          const memUsageMB = Math.round(memUsage.rss / 1024 / 1024);
          
          await this.db.run(`
            INSERT INTO system_metrics (
              id, worker_id, memory_usage_mb, active_tasks, recorded_at
            ) VALUES (?, ?, ?, ?, datetime('now'))
          `, [
            Date.now().toString(),
            this.workerId,
            memUsageMB,
            this.activeTasks.size
          ]);
        }
      } catch (error) {
        console.error('ハートビートエラー:', error);
      }
    }, 60000); // 1分間隔
  }

  async startWorkerLoop() {
    console.log('🔄 ワーカーループ開始');
    
    while (this.isRunning) {
      try {
        // メモリチェック
        const memUsage = process.memoryUsage().rss / 1024 / 1024;
        if (memUsage > this.memoryLimit) {
          console.log('⚠️ メモリ使用量が制限に接近、待機中...');
          await this.sleep(30000);
          continue;
        }

        // 並行処理可能数チェック
        if (this.activeTasks.size >= this.maxConcurrentTasks) {
          await this.sleep(5000);
          continue;
        }

        // 次のタスクを取得（シミュレーション）
        console.log('📋 タスク確認中...');
        await this.sleep(15000); // 15秒待機
        
      } catch (error) {
        console.error('ワーカーループエラー:', error);
        await this.sleep(60000);
      }
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// プロセス終了処理
let worker = null;

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
const startWorker = async () => {
  try {
    worker = new SQLiteWorker();
    await worker.start();
  } catch (error) {
    console.error('ワーカー起動失敗:', error);
    process.exit(1);
  }
};

startWorker();