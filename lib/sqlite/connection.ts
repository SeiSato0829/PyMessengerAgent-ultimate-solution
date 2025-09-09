/**
 * SQLite接続管理（Render無料プラン対応）
 * PostgreSQLの代替としてローカルSQLiteを使用
 */

import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import { promises as fs } from 'fs';
import path from 'path';

let db: Database | null = null;

/**
 * SQLiteデータベース接続を取得
 */
export const getDb = async (): Promise<Database> => {
  if (db) {
    return db;
  }

  // データディレクトリを確保
  const dataDir = path.join(process.cwd(), 'data');
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
    console.log('📁 データディレクトリ作成:', dataDir);
  }

  const dbPath = path.join(dataDir, 'worker.db');
  
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    // WALモード有効化（パフォーマンス向上）
    await db.exec('PRAGMA journal_mode = WAL');
    await db.exec('PRAGMA synchronous = NORMAL');
    await db.exec('PRAGMA cache_size = 1000');
    await db.exec('PRAGMA temp_store = MEMORY');
    
    console.log('✅ SQLite接続成功:', dbPath);
    
    // テーブル初期化
    await initializeTables(db);
    
    return db;
  } catch (error) {
    console.error('❌ SQLite接続エラー:', error);
    throw error;
  }
};

/**
 * テーブル初期化
 */
const initializeTables = async (database: Database): Promise<void> => {
  try {
    // タスクテーブル
    await database.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        supabase_task_id TEXT UNIQUE NOT NULL,
        task_type TEXT DEFAULT 'facebook_message',
        recipient_name TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        worker_id TEXT,
        
        -- Facebook情報
        facebook_account_id TEXT,
        
        -- タイムスタンプ
        scheduled_at TEXT,
        started_at TEXT,
        completed_at TEXT,
        
        -- 結果・エラー
        result TEXT, -- JSON文字列
        error_log TEXT,
        retry_count INTEGER DEFAULT 0,
        max_retries INTEGER DEFAULT 3,
        
        -- メタデータ
        execution_details TEXT, -- JSON文字列
        
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        
        CHECK (status IN ('pending', 'assigned', 'processing', 'completed', 'failed', 'cancelled', 'retrying'))
      )
    `);

    // 実行ログテーブル
    await database.exec(`
      CREATE TABLE IF NOT EXISTS execution_logs (
        id TEXT PRIMARY KEY,
        task_id TEXT NOT NULL,
        step_name TEXT NOT NULL,
        step_order INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'started',
        
        -- パフォーマンス
        execution_time_ms INTEGER,
        
        -- データ
        input_data TEXT, -- JSON文字列
        output_data TEXT, -- JSON文字列
        error_details TEXT, -- JSON文字列
        
        logged_at TEXT DEFAULT CURRENT_TIMESTAMP,
        
        CHECK (status IN ('started', 'completed', 'failed', 'skipped')),
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
      )
    `);

    // システムメトリクステーブル
    await database.exec(`
      CREATE TABLE IF NOT EXISTS system_metrics (
        id TEXT PRIMARY KEY,
        worker_id TEXT NOT NULL,
        
        -- システムメトリクス
        memory_usage_mb INTEGER,
        active_tasks INTEGER DEFAULT 0,
        completed_tasks_today INTEGER DEFAULT 0,
        failed_tasks_today INTEGER DEFAULT 0,
        
        recorded_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 同期状況テーブル
    await database.exec(`
      CREATE TABLE IF NOT EXISTS sync_status (
        id TEXT PRIMARY KEY,
        sync_type TEXT NOT NULL, -- 'tasks_from_supabase', 'results_to_supabase'
        last_sync_at TEXT DEFAULT CURRENT_TIMESTAMP,
        records_processed INTEGER DEFAULT 0,
        errors_count INTEGER DEFAULT 0,
        status TEXT DEFAULT 'pending',
        error_details TEXT, -- JSON文字列
        
        CHECK (status IN ('pending', 'running', 'completed', 'failed'))
      )
    `);

    // インデックス作成
    await database.exec(`
      CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    `);
    
    await database.exec(`
      CREATE INDEX IF NOT EXISTS idx_tasks_supabase_id ON tasks(supabase_task_id);
    `);
    
    await database.exec(`
      CREATE INDEX IF NOT EXISTS idx_execution_logs_task_id ON execution_logs(task_id);
    `);

    // 更新トリガー作成
    await database.exec(`
      CREATE TRIGGER IF NOT EXISTS update_tasks_timestamp 
      AFTER UPDATE ON tasks
      BEGIN
        UPDATE tasks SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
      END;
    `);

    console.log('✅ SQLiteテーブル初期化完了');
  } catch (error) {
    console.error('❌ テーブル初期化エラー:', error);
    throw error;
  }
};

/**
 * データベース統計を取得
 */
export const getDbStats = async (): Promise<any> => {
  const database = await getDb();
  
  const [taskStats, logStats, dbInfo] = await Promise.all([
    database.get(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'processing' THEN 1 END) as processing,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed
      FROM tasks
    `),
    database.get('SELECT COUNT(*) as total FROM execution_logs'),
    database.get('PRAGMA database_list')
  ]);

  return {
    tasks: taskStats,
    logs: logStats,
    database: dbInfo
  };
};

/**
 * データベースクリーンアップ（古いデータを削除）
 */
export const cleanupOldData = async (): Promise<void> => {
  const database = await getDb();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 7); // 7日前
  
  try {
    // 完了・失敗したタスクの古いログを削除
    await database.run(`
      DELETE FROM execution_logs 
      WHERE task_id IN (
        SELECT id FROM tasks 
        WHERE status IN ('completed', 'failed') 
        AND completed_at < ?
      )
    `, [cutoffDate.toISOString()]);

    // 古いシステムメトリクスを削除
    await database.run(`
      DELETE FROM system_metrics 
      WHERE recorded_at < ?
    `, [cutoffDate.toISOString()]);

    console.log('✅ 古いデータクリーンアップ完了');
  } catch (error) {
    console.error('❌ クリーンアップエラー:', error);
  }
};

/**
 * データベース接続を閉じる
 */
export const closeDb = async (): Promise<void> => {
  if (db) {
    await db.close();
    db = null;
    console.log('🔒 SQLite接続を閉じました');
  }
};

// プロセス終了時にDBを閉じる
process.on('exit', () => {
  if (db) {
    db.close();
  }
});

process.on('SIGTERM', async () => {
  await closeDb();
});

process.on('SIGINT', async () => {
  await closeDb();
});