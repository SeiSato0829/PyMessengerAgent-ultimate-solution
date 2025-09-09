/**
 * SQLiteワーカー状況確認API
 */

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    const dbPath = path.join(dataDir, 'worker.db');
    
    // SQLiteファイル存在確認
    const dbExists = fs.existsSync(dbPath);
    const dbStats = dbExists ? fs.statSync(dbPath) : null;
    
    // メモリ使用量取得
    const memoryUsage = process.memoryUsage();
    const memoryUsageMB = {
      rss: Math.round(memoryUsage.rss / 1024 / 1024),
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      external: Math.round(memoryUsage.external / 1024 / 1024)
    };

    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      system: {
        database: {
          exists: dbExists,
          path: dbPath,
          size_mb: dbStats ? Math.round(dbStats.size / 1024 / 1024) : 0,
          created: dbStats ? dbStats.birthtime.toISOString() : null,
          modified: dbStats ? dbStats.mtime.toISOString() : null
        },
        memory: memoryUsageMB,
        worker: {
          status: "running", // SQLiteワーカーが動作中
          type: "sqlite-free-plan",
          pid: process.pid
        },
        environment: {
          node_version: process.version,
          platform: process.platform,
          uptime_seconds: Math.round(process.uptime())
        }
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('SQLite Status API エラー:', error);
    
    return NextResponse.json({
      success: false,
      timestamp: new Date().toISOString(),
      error: error.message
    }, { status: 500 });
  }
}