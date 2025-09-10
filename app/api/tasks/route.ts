import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  try {
    const { recipient, message } = await request.json();
    
    if (!recipient || !message) {
      return NextResponse.json({
        success: false,
        error: '送信先とメッセージは必須です'
      }, { status: 400 });
    }

    const dataDir = path.join(process.cwd(), 'data');
    const tasksFile = path.join(dataDir, 'tasks.json');
    
    // データディレクトリ作成
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // 既存タスク読み込み
    let tasks = [];
    if (fs.existsSync(tasksFile)) {
      try {
        tasks = JSON.parse(fs.readFileSync(tasksFile, 'utf8'));
      } catch {
        tasks = [];
      }
    }

    // 新タスク作成
    const newTask = {
      id: Date.now().toString(),
      recipient,
      message,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    tasks.push(newTask);

    // ファイルに保存
    fs.writeFileSync(tasksFile, JSON.stringify(tasks, null, 2));

    return NextResponse.json({
      success: true,
      task: newTask
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    const tasksFile = path.join(dataDir, 'tasks.json');
    
    let tasks = [];
    if (fs.existsSync(tasksFile)) {
      try {
        tasks = JSON.parse(fs.readFileSync(tasksFile, 'utf8'));
      } catch {
        tasks = [];
      }
    }

    return NextResponse.json({
      success: true,
      tasks: tasks.slice(-10) // 最新10件
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}