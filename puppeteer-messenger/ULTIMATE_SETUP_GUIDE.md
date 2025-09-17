# 🔥 Ultimate Facebook Messenger自動化 - 完全ガイド

## ⚠️ 免責事項
このツールは教育目的のみです。使用者の責任で利用してください。アカウント停止、法的責任等は一切負いません。

## 🛡️ 最高レベルの検出回避技術

### 実装された回避技術

1. **WebDriverプロパティ完全削除**
2. **Chrome特有プロパティの完全偽装**
3. **ハードウェア情報の偽装**
4. **Canvas/WebGLフィンガープリントの攪乱**
5. **マウス動作の完全人間化（ベジェ曲線）**
6. **タイピング速度の人間化（WPM 40-80）**
7. **自然なスクロール動作**
8. **Cookie/セッション管理**
9. **プロキシ/VPN対応**
10. **User-Agent完全偽装**

## 📋 セットアップ手順

### Step 1: 環境準備

```bash
# ディレクトリ作成と移動
mkdir ultimate-messenger-bot
cd ultimate-messenger-bot

# Node.js 16以上が必要
node --version

# 依存関係インストール
npm install puppeteer puppeteer-extra puppeteer-extra-plugin-stealth
npm install puppeteer-extra-plugin-adblocker puppeteer-extra-plugin-anonymize-ua
npm install dotenv chalk inquirer fs-extra
```

### Step 2: 設定ファイル作成

```bash
# .envファイルを作成
cp .env.example .env
```

#### .env設定内容
```bash
# Facebook認証情報
FB_EMAIL=your-email@example.com
FB_PASSWORD=your-secure-password

# プロキシ設定（推奨）
PROXY_SERVER=http://proxy-server:8080
# またはSOCKSプロキシ
# PROXY_SERVER=socks5://proxy-server:1080

# VPN設定
USE_VPN=true
VPN_SERVER=vpn-server.com

# セキュリティ設定
HEADLESS=false              # 開発時はfalse、本番時はtrue
SESSION_ROTATION=true       # セッションローテーション
MAX_RETRIES=3              # 最大リトライ回数
DELAY_MIN=30000            # 最小待機時間（ミリ秒）
DELAY_MAX=60000            # 最大待機時間（ミリ秒）

# 高度な設定
USER_DATA_DIR=./chrome-profiles  # Chromeプロファイル保存先
SCREENSHOT_DEBUG=true            # デバッグスクリーンショット
```

### Step 3: プロキシ/VPN設定（重要）

#### プロキシサーバー設定
```javascript
// 推奨プロキシサービス
// - Bright Data (旧Luminati)
// - Oxylabs
// - Storm Proxies
// - ProxyMesh

// 設定例
const proxy = {
  server: 'proxy-server.com:8080',
  username: 'proxy-username',
  password: 'proxy-password'
};
```

#### VPN設定（追加セキュリティ）
```bash
# OpenVPN設定
sudo openvpn --config your-vpn-config.ovpn

# または NordVPN
nordvpn connect

# または Express VPN
expressvpn connect
```

### Step 4: 初回セットアップスクリプト

```javascript
// setup.js
const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');
const chalk = require('chalk');

async function setup() {
  console.log(chalk.blue('🚀 Ultimate Stealth Bot セットアップ'));
  
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'email',
      message: 'Facebook Email:',
      validate: (input) => input.includes('@') || 'Valid email required'
    },
    {
      type: 'password',
      name: 'password',
      message: 'Facebook Password:',
      mask: '*'
    },
    {
      type: 'input',
      name: 'proxy',
      message: 'Proxy Server (optional):',
      default: ''
    },
    {
      type: 'confirm',
      name: 'headless',
      message: 'Run in headless mode?',
      default: false
    }
  ]);

  // .envファイル作成
  const envContent = `
FB_EMAIL=${answers.email}
FB_PASSWORD=${answers.password}
PROXY_SERVER=${answers.proxy}
HEADLESS=${answers.headless}
SESSION_ROTATION=true
MAX_RETRIES=3
DELAY_MIN=30000
DELAY_MAX=60000
USER_DATA_DIR=./chrome-profiles
SCREENSHOT_DEBUG=true
`;

  fs.writeFileSync('.env', envContent);
  
  // ディレクトリ作成
  const dirs = ['chrome-profiles', 'screenshots', 'logs'];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  console.log(chalk.green('✅ セットアップ完了！'));
}

if (require.main === module) {
  setup().catch(console.error);
}
```

## 🔧 使用方法

### 基本的な使用例

```javascript
// main.js
require('dotenv').config();
const UltimateStealthBot = require('./ultimate-stealth-bot');

async function main() {
  const bot = new UltimateStealthBot({
    email: process.env.FB_EMAIL,
    password: process.env.FB_PASSWORD,
    headless: process.env.HEADLESS === 'true',
    proxy: process.env.PROXY_SERVER,
    userDataDir: process.env.USER_DATA_DIR
  });

  try {
    // ブラウザ起動
    await bot.launch();
    console.log('🚀 ブラウザ起動完了');

    // ログイン
    const loginSuccess = await bot.login();
    if (!loginSuccess) {
      console.error('❌ ログイン失敗');
      return;
    }

    // メッセージ送信
    const recipients = [
      { name: '田中太郎', message: 'こんにちは！元気ですか？' },
      { name: '佐藤花子', message: 'お疲れ様です。明日の件ですが...' }
    ];

    for (const { name, message } of recipients) {
      const success = await bot.sendMessage(name, message);
      console.log(`${name}: ${success ? '✅ 成功' : '❌ 失敗'}`);
      
      // 送信間隔（重要）
      await bot.randomWait(60000, 120000); // 1-2分待機
    }

  } catch (error) {
    console.error('🔥 エラー:', error);
  } finally {
    await bot.close();
  }
}

main().catch(console.error);
```

### 高度な一括送信

```javascript
// bulk-sender.js
const UltimateStealthBot = require('./ultimate-stealth-bot');
const fs = require('fs');

class BulkMessageSender {
  constructor() {
    this.bot = new UltimateStealthBot({
      email: process.env.FB_EMAIL,
      password: process.env.FB_PASSWORD,
      headless: true, // 本番時は必ずtrue
      proxy: process.env.PROXY_SERVER,
      sessionRotation: true
    });
    
    this.results = [];
    this.maxPerSession = 10; // セッションあたり最大送信数
    this.dailyLimit = 50;    // 1日あたり最大送信数
  }

  async sendBulkMessages(recipients) {
    console.log(`📤 ${recipients.length}件のメッセージを送信開始`);
    
    let sentToday = this.getTodaySentCount();
    
    for (let i = 0; i < recipients.length; i++) {
      const { name, message } = recipients[i];
      
      // 日次制限チェック
      if (sentToday >= this.dailyLimit) {
        console.log('⚠️ 日次制限に達しました');
        break;
      }
      
      // セッション制限チェック
      if (i > 0 && i % this.maxPerSession === 0) {
        console.log('🔄 セッションローテーション中...');
        await this.rotateSession();
      }
      
      try {
        const success = await this.bot.sendMessage(name, message);
        this.results.push({
          name,
          message,
          success,
          timestamp: new Date().toISOString()
        });
        
        if (success) {
          sentToday++;
          this.updateSentCount(sentToday);
        }
        
        console.log(`${i + 1}/${recipients.length}: ${name} - ${success ? '✅' : '❌'}`);
        
        // ランダム待機（重要）
        const delay = 60000 + Math.random() * 120000; // 1-3分
        console.log(`⏰ ${Math.round(delay / 1000)}秒待機中...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        
      } catch (error) {
        console.error(`❌ ${name}への送信でエラー:`, error.message);
        this.results.push({
          name,
          message,
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    // 結果保存
    this.saveResults();
    return this.results;
  }

  async rotateSession() {
    await this.bot.close();
    await new Promise(resolve => setTimeout(resolve, 30000)); // 30秒待機
    
    // 新しいプロファイルでブラウザ再起動
    this.bot = new UltimateStealthBot({
      email: process.env.FB_EMAIL,
      password: process.env.FB_PASSWORD,
      headless: true,
      proxy: process.env.PROXY_SERVER,
      userDataDir: `./chrome-profiles/session-${Date.now()}`
    });
    
    await this.bot.launch();
    await this.bot.login();
  }

  getTodaySentCount() {
    const today = new Date().toDateString();
    const logPath = `./logs/sent-${today}.json`;
    
    try {
      const data = JSON.parse(fs.readFileSync(logPath, 'utf8'));
      return data.count || 0;
    } catch {
      return 0;
    }
  }

  updateSentCount(count) {
    const today = new Date().toDateString();
    const logPath = `./logs/sent-${today}.json`;
    
    fs.writeFileSync(logPath, JSON.stringify({ 
      count, 
      lastUpdate: new Date().toISOString() 
    }));
  }

  saveResults() {
    const filename = `./logs/results-${Date.now()}.json`;
    fs.writeFileSync(filename, JSON.stringify(this.results, null, 2));
    console.log(`📊 結果を保存: ${filename}`);
  }
}

module.exports = BulkMessageSender;
```

## 🚨 重要な運用ガイドライン

### 検出回避のベストプラクティス

1. **送信頻度**
   ```
   ✅ 1日10-50件まで
   ✅ 送信間隔：1-3分以上
   ✅ 時間帯：9:00-21:00（人間の活動時間）
   ❌ 深夜・早朝の送信
   ❌ 連続大量送信
   ```

2. **プロキシ/VPN使用**
   ```
   ✅ 住宅用プロキシ（Residential Proxy）
   ✅ 日本国内のIPアドレス
   ✅ 定期的なIP変更
   ❌ データセンタープロキシ
   ❌ 海外IP（位置情報不一致）
   ```

3. **アカウント管理**
   ```
   ✅ 古いアカウント（6ヶ月以上）
   ✅ 友達数：100人以上
   ✅ 定期的な手動ログイン
   ❌ 新規作成アカウント
   ❌ 友達数が少ない
   ```

4. **メッセージ内容**
   ```
   ✅ 自然な日本語
   ✅ 個人的な内容
   ✅ バリエーション豊富
   ❌ 広告・宣伝文句
   ❌ 同じ内容の使い回し
   ```

### エラー対応

```javascript
// error-handler.js
class ErrorHandler {
  static async handleFacebookError(error, bot) {
    if (error.message.includes('challenge')) {
      console.log('🔒 セキュリティチャレンジ検出');
      await bot.takeDebugScreenshot('challenge');
      // 手動対応が必要
      return 'MANUAL_REQUIRED';
    }
    
    if (error.message.includes('blocked')) {
      console.log('🚫 アカウントブロック検出');
      // 24時間待機
      return 'ACCOUNT_BLOCKED';
    }
    
    if (error.message.includes('rate limit')) {
      console.log('⚠️ レート制限検出');
      // 送信間隔を増加
      return 'RATE_LIMITED';
    }
    
    return 'UNKNOWN_ERROR';
  }
}
```

## 🔍 監視とログ

```javascript
// monitor.js
class ActivityMonitor {
  static async monitorBotActivity() {
    const logFile = `./logs/activity-${new Date().toDateString()}.log`;
    
    setInterval(() => {
      const stats = {
        timestamp: new Date().toISOString(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        activeConnections: process.listenerCount('connection')
      };
      
      fs.appendFileSync(logFile, JSON.stringify(stats) + '\n');
    }, 60000); // 1分間隔
  }
}
```

## 📊 成功率向上のコツ

1. **段階的導入**
   - 最初は1日5件から開始
   - 成功率90%以上を1週間維持
   - 徐々に送信数を増加

2. **多様性の確保**
   - 複数のメッセージテンプレート
   - 送信時間のランダム化
   - 異なる受信者パターン

3. **定期メンテナンス**
   - Cookie定期削除
   - プロファイル入れ替え
   - プロキシローテーション

**最重要：段階的かつ慎重に運用することで、長期的な成功率を確保できます。**