/**
 * Render無料プラン用のKeep-Alive システム
 * 15分スリープ回避とメモリ管理
 */

interface KeepAliveConfig {
  pingInterval: number; // ping間隔（ミリ秒）
  gcInterval: number;   // GC実行間隔（ミリ秒）
  memoryThreshold: number; // メモリしきい値（MB）
  maxRunTime: number;   // 最大実行時間（ミリ秒）
}

export class RenderKeepAlive {
  private config: KeepAliveConfig;
  private pingTimer?: NodeJS.Timeout;
  private gcTimer?: NodeJS.Timeout;
  private shutdownTimer?: NodeJS.Timeout;
  private startTime: number;
  private isRunning: boolean = false;

  constructor(config?: Partial<KeepAliveConfig>) {
    this.config = {
      pingInterval: 10 * 60 * 1000,    // 10分間隔
      gcInterval: 5 * 60 * 1000,       // 5分間隔
      memoryThreshold: 180,            // 180MB
      maxRunTime: 20 * 24 * 60 * 60 * 1000, // 20日 (750時間制限考慮)
      ...config
    };
    
    this.startTime = Date.now();
    
    console.log('🔄 Render Keep-Alive システム初期化');
    console.log('設定:', {
      ping間隔: `${this.config.pingInterval / 60000}分`,
      GC間隔: `${this.config.gcInterval / 60000}分`,
      メモリ制限: `${this.config.memoryThreshold}MB`,
      最大実行時間: `${this.config.maxRunTime / (24 * 60 * 60 * 1000)}日`
    });
  }

  /**
   * Keep-Aliveシステム開始
   */
  start(): void {
    if (this.isRunning) {
      console.log('⚠️ Keep-Aliveは既に実行中です');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Keep-Alive システム開始');

    // セルフPing開始
    this.startSelfPing();

    // ガベージコレクション開始
    this.startGarbageCollection();

    // 自動シャットダウンタイマー開始
    this.startShutdownTimer();
  }

  /**
   * Keep-Aliveシステム停止
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    console.log('🛑 Keep-Alive システム停止');

    if (this.pingTimer) {
      clearInterval(this.pingTimer);
    }
    if (this.gcTimer) {
      clearInterval(this.gcTimer);
    }
    if (this.shutdownTimer) {
      clearTimeout(this.shutdownTimer);
    }
  }

  /**
   * セルフPing開始（スリープ回避）
   */
  private startSelfPing(): void {
    this.pingTimer = setInterval(async () => {
      try {
        // 自分自身にHTTPリクエスト送信
        const response = await fetch(`${process.env.RENDER_EXTERNAL_URL || 'http://localhost:3000'}/api/ping`, {
          method: 'GET',
          headers: {
            'User-Agent': 'RenderKeepAlive/1.0'
          },
          signal: AbortSignal.timeout(30000) // 30秒タイムアウト
        });

        if (response.ok) {
          console.log('📡 Keep-alive ping 成功');
        } else {
          console.log('⚠️ Keep-alive ping レスポンスエラー:', response.status);
        }

        // メモリ使用量をログ出力
        const memUsage = process.memoryUsage();
        const memUsageMB = Math.round(memUsage.rss / 1024 / 1024);
        console.log(`📊 メモリ使用量: ${memUsageMB}MB`);

        // メモリ制限チェック
        if (memUsageMB > this.config.memoryThreshold) {
          console.log('⚠️ メモリ使用量が制限に接近しています');
          this.forceGarbageCollection();
        }

      } catch (error) {
        console.error('❌ Keep-alive ping エラー:', error instanceof Error ? error.message : error);
      }
    }, this.config.pingInterval);
  }

  /**
   * 定期ガベージコレクション開始
   */
  private startGarbageCollection(): void {
    this.gcTimer = setInterval(() => {
      this.forceGarbageCollection();
    }, this.config.gcInterval);
  }

  /**
   * 強制ガベージコレクション実行
   */
  private forceGarbageCollection(): void {
    const beforeGC = process.memoryUsage();
    
    if (global.gc) {
      global.gc();
      console.log('🗑️ ガベージコレクション実行');
      
      const afterGC = process.memoryUsage();
      const freedMemory = Math.round((beforeGC.rss - afterGC.rss) / 1024 / 1024);
      
      if (freedMemory > 0) {
        console.log(`💾 メモリ解放: ${freedMemory}MB`);
      }
    } else {
      console.log('⚠️ ガベージコレクションが利用できません');
    }
  }

  /**
   * 自動シャットダウンタイマー開始（750時間制限対応）
   */
  private startShutdownTimer(): void {
    const timeUntilShutdown = this.config.maxRunTime - (Date.now() - this.startTime);
    
    if (timeUntilShutdown <= 0) {
      console.log('⏰ 実行時間制限に達しています。即座にシャットダウンします。');
      this.gracefulShutdown();
      return;
    }

    console.log(`⏰ 自動シャットダウンまで: ${Math.round(timeUntilShutdown / (24 * 60 * 60 * 1000))}日`);

    this.shutdownTimer = setTimeout(() => {
      console.log('⏰ 実行時間制限（750時間）に到達。グレースフルシャットダウンを開始します。');
      this.gracefulShutdown();
    }, timeUntilShutdown);
  }

  /**
   * グレースフルシャットダウン
   */
  private async gracefulShutdown(): Promise<void> {
    console.log('🔄 グレースフルシャットダウン開始...');
    
    try {
      // Keep-Alive停止
      this.stop();
      
      // 最終的なガベージコレクション
      this.forceGarbageCollection();
      
      // プロセス終了
      setTimeout(() => {
        console.log('👋 プロセス終了');
        process.exit(0);
      }, 5000); // 5秒後に終了
      
    } catch (error) {
      console.error('❌ グレースフルシャットダウンエラー:', error);
      process.exit(1);
    }
  }

  /**
   * 現在のシステム状態を取得
   */
  getSystemStatus() {
    const uptime = Date.now() - this.startTime;
    const memUsage = process.memoryUsage();
    const remainingTime = this.config.maxRunTime - uptime;

    return {
      uptime: {
        ms: uptime,
        hours: Math.round(uptime / (60 * 60 * 1000)),
        days: Math.round(uptime / (24 * 60 * 60 * 1000))
      },
      memory: {
        rss: Math.round(memUsage.rss / 1024 / 1024),
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024)
      },
      limits: {
        memoryThreshold: this.config.memoryThreshold,
        memoryUsage: Math.round(memUsage.rss / 1024 / 1024),
        memoryPercent: Math.round((memUsage.rss / 1024 / 1024) / this.config.memoryThreshold * 100)
      },
      shutdown: {
        remainingMs: remainingTime,
        remainingHours: Math.max(0, Math.round(remainingTime / (60 * 60 * 1000))),
        remainingDays: Math.max(0, Math.round(remainingTime / (24 * 60 * 60 * 1000)))
      },
      isRunning: this.isRunning
    };
  }

  /**
   * 稼働時間警告チェック
   */
  checkUptimeWarning(): { warning: boolean; message?: string; hoursRemaining?: number } {
    const uptime = Date.now() - this.startTime;
    const remainingTime = this.config.maxRunTime - uptime;
    const hoursRemaining = Math.round(remainingTime / (60 * 60 * 1000));

    if (remainingTime <= 0) {
      return {
        warning: true,
        message: 'アプリケーションは制限時間に達しました。再起動が必要です。',
        hoursRemaining: 0
      };
    } else if (hoursRemaining <= 24) {
      return {
        warning: true,
        message: `アプリケーションは24時間以内にシャットダウンされます。`,
        hoursRemaining
      };
    } else if (hoursRemaining <= 72) {
      return {
        warning: true,
        message: `アプリケーションは72時間以内にシャットダウンされます。`,
        hoursRemaining
      };
    }

    return { warning: false };
  }
}

// シングルトンインスタンス
let keepAliveInstance: RenderKeepAlive | null = null;

export const getRenderKeepAlive = (): RenderKeepAlive => {
  if (!keepAliveInstance) {
    keepAliveInstance = new RenderKeepAlive();
  }
  return keepAliveInstance;
};

// 自動開始（環境変数で制御）
if (process.env.NODE_ENV === 'production' && process.env.RENDER_KEEP_ALIVE === 'true') {
  const keepAlive = getRenderKeepAlive();
  keepAlive.start();
  
  console.log('🔄 Render Keep-Alive自動開始');
}