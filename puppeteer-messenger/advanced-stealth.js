/**
 * より高度なステルス機能付きバージョン
 * Facebook検出を回避するための追加対策
 */

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// ステルスプラグインを使用
puppeteer.use(StealthPlugin());

class StealthMessengerBot {
  constructor(config = {}) {
    this.config = {
      email: config.email,
      password: config.password,
      headless: config.headless || false,
      proxy: config.proxy, // プロキシサーバー（オプション）
      userDataDir: config.userDataDir || './chrome-data' // Chromeプロファイルの保存先
    };
  }

  async launch() {
    const args = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-features=site-per-process',
      '--disable-web-security',
      '--disable-features=IsolateOrigins',
      '--disable-site-isolation-trials',
      '--disable-features=BlockInsecurePrivateNetworkRequests',
      '--window-size=1920,1080',
      '--start-maximized'
    ];

    // プロキシ設定（必要な場合）
    if (this.config.proxy) {
      args.push(`--proxy-server=${this.config.proxy}`);
    }

    this.browser = await puppeteer.launch({
      headless: this.config.headless,
      args,
      executablePath: puppeteer.executablePath(),
      userDataDir: this.config.userDataDir, // プロファイル保存
      defaultViewport: null,
      ignoreHTTPSErrors: true
    });

    this.page = await this.browser.newPage();

    // さらなる検出回避設定
    await this.setupEvasion();
    
    return this.page;
  }

  async setupEvasion() {
    // WebDriverプロパティを削除
    await this.page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
    });

    // Chrome特有のプロパティを偽装
    await this.page.evaluateOnNewDocument(() => {
      window.navigator.chrome = {
        runtime: {},
      };
    });

    // Permissionsを偽装
    await this.page.evaluateOnNewDocument(() => {
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) => (
        parameters.name === 'notifications' ?
          Promise.resolve({ state: Notification.permission }) :
          originalQuery(parameters)
      );
    });

    // プラグインを偽装
    await this.page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'plugins', {
        get: () => [
          {
            0: {type: "application/x-google-chrome-pdf", suffixes: "pdf"},
            description: "Portable Document Format",
            filename: "internal-pdf-viewer",
            length: 1,
            name: "Chrome PDF Plugin"
          }
        ],
      });
    });

    // 言語設定
    await this.page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'languages', {
        get: () => ['ja-JP', 'ja', 'en-US', 'en'],
      });
    });

    // タイムゾーンを設定
    await this.page.evaluateOnNewDocument(() => {
      Object.defineProperty(Intl.DateTimeFormat.prototype, 'resolvedOptions', {
        value: function() {
          return {
            timeZone: 'Asia/Tokyo',
            locale: 'ja-JP'
          };
        }
      });
    });

    // マウス動作を人間らしくする
    await this.installMouseHelper();
  }

  async installMouseHelper() {
    await this.page.evaluateOnNewDocument(() => {
      // マウスカーソルを表示（デバッグ用）
      if (!window.location.href.includes('facebook.com')) return;
      
      const mouse = document.createElement('div');
      mouse.style.position = 'fixed';
      mouse.style.width = '20px';
      mouse.style.height = '20px';
      mouse.style.borderRadius = '50%';
      mouse.style.backgroundColor = 'red';
      mouse.style.opacity = '0.5';
      mouse.style.pointerEvents = 'none';
      mouse.style.zIndex = '99999';
      
      document.addEventListener('DOMContentLoaded', () => {
        document.body.appendChild(mouse);
      });
      
      document.addEventListener('mousemove', (e) => {
        mouse.style.left = e.clientX - 10 + 'px';
        mouse.style.top = e.clientY - 10 + 'px';
      });
    });
  }

  /**
   * 人間らしいマウス移動
   */
  async humanLikeMove(x, y) {
    const steps = 20;
    const currentPosition = await this.page.evaluate(() => {
      return { x: window.mouseX || 0, y: window.mouseY || 0 };
    });

    for (let i = 0; i < steps; i++) {
      const progress = i / steps;
      const easeProgress = this.easeInOutCubic(progress);
      
      const newX = currentPosition.x + (x - currentPosition.x) * easeProgress;
      const newY = currentPosition.y + (y - currentPosition.y) * easeProgress;
      
      await this.page.mouse.move(newX, newY);
      await this.randomWait(10, 30);
    }
  }

  /**
   * イージング関数（自然な動き）
   */
  easeInOutCubic(t) {
    return t < 0.5 
      ? 4 * t * t * t 
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  /**
   * 人間らしいタイピング
   */
  async humanType(selector, text) {
    await this.page.click(selector);
    
    for (const char of text) {
      await this.page.keyboard.type(char);
      
      // ランダムな速度でタイピング
      const delay = Math.floor(Math.random() * 200) + 50;
      await this.randomWait(delay, delay + 50);
      
      // たまにタイプミスして修正（より人間らしく）
      if (Math.random() < 0.05) {
        await this.page.keyboard.type('a');
        await this.randomWait(100, 200);
        await this.page.keyboard.press('Backspace');
        await this.randomWait(100, 200);
      }
    }
  }

  /**
   * スクロール（人間らしく）
   */
  async humanScroll() {
    const scrollHeight = await this.page.evaluate(() => document.body.scrollHeight);
    const viewportHeight = await this.page.evaluate(() => window.innerHeight);
    
    let currentPosition = 0;
    const scrollDistance = Math.floor(Math.random() * 300) + 100;
    
    while (currentPosition < scrollHeight - viewportHeight) {
      await this.page.evaluate((distance) => {
        window.scrollBy(0, distance);
      }, scrollDistance);
      
      currentPosition += scrollDistance;
      await this.randomWait(500, 1500);
    }
  }

  async randomWait(min, max) {
    const delay = Math.floor(Math.random() * (max - min) + min);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

/**
 * セキュリティ対策を追加した使用例
 */
async function secureMain() {
  const bot = new StealthMessengerBot({
    email: process.env.FB_EMAIL,
    password: process.env.FB_PASSWORD,
    headless: false,
    userDataDir: './chrome-profile', // プロファイルを保存
    proxy: 'http://proxy-server:8080' // 必要に応じてプロキシ
  });

  try {
    await bot.launch();
    
    // VPNまたはプロキシ経由での接続を推奨
    // 送信間隔を長めに設定（1分以上）
    // 一度に大量送信しない（1日10件程度まで）
    
  } catch (error) {
    console.error('エラー:', error);
  } finally {
    await bot.close();
  }
}

module.exports = StealthMessengerBot;