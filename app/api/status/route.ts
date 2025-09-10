import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    const statusFile = path.join(dataDir, 'status.json');
    const tasksFile = path.join(dataDir, 'tasks.json');
    
    // ワーカーステータス読み込み
    let workerStatus = null;
    if (fs.existsSync(statusFile)) {
      try {
        workerStatus = JSON.parse(fs.readFileSync(statusFile, 'utf8'));
      } catch {
        workerStatus = null;
      }
    }

    // タスク統計
    let taskStats = { pending: 0, completed: 0, total: 0 };
    if (fs.existsSync(tasksFile)) {
      try {
        const tasks = JSON.parse(fs.readFileSync(tasksFile, 'utf8'));
        taskStats.total = tasks.length;
        taskStats.pending = tasks.filter(t => t.status === 'pending').length;
        taskStats.completed = tasks.filter(t => t.status === 'completed').length;
      } catch {
        // エラー時はデフォルト値を使用
      }
    }

    // システム情報
    const memoryUsage = process.memoryUsage();
    const systemInfo = {
      memory: {
        used_mb: Math.round(memoryUsage.rss / 1024 / 1024),
        heap_mb: Math.round(memoryUsage.heapUsed / 1024 / 1024)
      },
      uptime_minutes: Math.round(process.uptime() / 60),
      node_version: process.version,
      platform: process.platform
    };

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      worker: workerStatus || { status: 'offline', worker_id: 'unknown' },
      tasks: taskStats,
      system: systemInfo
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}