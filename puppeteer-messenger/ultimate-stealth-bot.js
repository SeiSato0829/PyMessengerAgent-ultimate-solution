/**
 * Ultimate Stealth Facebook Messenger Bot
 * 最高レベルの検出回避技術を実装
 * 
 * ⚠️ 警告：教育目的のみ。自己責任で使用してください。
 */

const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const AdblockerPlugin = require('puppeteer-extra-plugin-adblocker');
const AnonymizeUA = require('puppeteer-extra-plugin-anonymize-ua');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// プラグイン設定
puppeteer.use(StealthPlugin());
puppeteer.use(AdblockerPlugin({ blockTrackers: true }));
puppeteer.use(AnonymizeUA());

class UltimateStealthBot {
  constructor(config = {}) {
    this.config = {
      email: config.email || process.env.FB_EMAIL,
      password: config.password || process.env.FB_PASSWORD,
      headless: config.headless !== undefined ? config.headless : 'new', // 新しいヘッドレスモード
      proxy: config.proxy,
      userAgent: config.userAgent || this.generateUserAgent(),
      viewport: config.viewport || this.generateViewport(),
      locale: config.locale || 'ja-JP',
      timezone: config.timezone || 'Asia/Tokyo',
      userDataDir: config.userDataDir || path.join(__dirname, 'chrome-profile-' + this.generateSessionId()),
      maxRetries: config.maxRetries || 3,
      sessionRotation: config.sessionRotation || true,
    };
    
    this.browser = null;
    this.page = null;
    this.sessionId = this.generateSessionId();
    this.fingerprint = this.generateFingerprint();
  }

  /**
   * セッションIDを生成
   */
  generateSessionId() {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * デバイスフィンガープリントを生成
   */
  generateFingerprint() {
    return {
      canvas: Math.random().toString(36).substring(7),
      webgl: Math.random().toString(36).substring(7),
      audio: Math.random().toString(36).substring(7),
      fonts: this.generateFontList(),
    };
  }

  /**
   * リアルなUserAgentを生成
   */
  generateUserAgent() {
    const agents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ];
    return agents[Math.floor(Math.random() * agents.length)];
  }

  /**
   * リアルなビューポートを生成
   */
  generateViewport() {
    const viewports = [
      { width: 1920, height: 1080 },
      { width: 1366, height: 768 },
      { width: 1440, height: 900 },
      { width: 1536, height: 864 },
      { width: 1600, height: 900 },
    ];
    return viewports[Math.floor(Math.random() * viewports.length)];
  }

  /**
   * フォントリストを生成
   */
  generateFontList() {
    const baseFonts = [
      'Arial', 'Verdana', 'Helvetica', 'Times New Roman',
      'Georgia', 'Courier New', 'Trebuchet MS'
    ];
    // ランダムに並び替え
    return baseFonts.sort(() => Math.random() - 0.5);
  }

  /**
   * ブラウザを起動（最高レベルの偽装）
   */
  async launch() {
    console.log('🚀 超ステルスモードでブラウザ起動中...');
    
    const args = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-features=site-per-process',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      `--window-size=${this.config.viewport.width},${this.config.viewport.height}`,
      '--window-position=0,0',
      '--start-maximized',
      '--disable-features=IsolateOrigins',
      '--disable-site-isolation-trials',
      '--disable-features=BlockInsecurePrivateNetworkRequests',
      '--disable-web-security',
      '--disable-features=CrossSiteDocumentBlockingIfIsolating',
      '--disable-features=CrossSiteDocumentBlockingAlways',
      '--disable-features=IsolateOrigins,site-per-process',
      '--flag-switches-begin',
      '--disable-site-isolation-trials',
      '--flag-switches-end',
      `--user-agent=${this.config.userAgent}`,
      '--disable-features=UserAgentClientHint',
      `--lang=${this.config.locale}`,
    ];

    // プロキシ設定
    if (this.config.proxy) {
      args.push(`--proxy-server=${this.config.proxy}`);
    }

    // ブラウザ起動オプション
    const options = {
      headless: this.config.headless,
      args,
      ignoreHTTPSErrors: true,
      defaultViewport: this.config.viewport,
      executablePath: puppeteer.executablePath(),
      userDataDir: this.config.userDataDir,
      devtools: false,
      ignoreDefaultArgs: [
        '--enable-automation',
        '--enable-blink-features=AutomationControlled',
      ],
    };

    this.browser = await puppeteer.launch(options);
    
    // 全ページに対して偽装を適用
    this.browser.on('targetcreated', async (target) => {
      const page = await target.page();
      if (page) {
        await this.applyEvasion(page);
      }
    });

    this.page = await this.browser.newPage();
    await this.applyEvasion(this.page);
    
    console.log('✅ ステルスブラウザ起動完了');
    return this.page;
  }

  /**
   * 最高レベルの検出回避を適用
   */
  async applyEvasion(page) {
    // WebDriverを完全に隠蔽
    await page.evaluateOnNewDocument(() => {
      // WebDriver削除
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false,
      });
      
      // Chrome特有のプロパティを偽装
      window.chrome = {
        app: {
          isInstalled: false,
          InstallState: {
            DISABLED: 'disabled',
            INSTALLED: 'installed',
            NOT_INSTALLED: 'not_installed'
          },
          RunningState: {
            CANNOT_RUN: 'cannot_run',
            READY_TO_RUN: 'ready_to_run',
            RUNNING: 'running'
          }
        },
        runtime: {
          OnInstalledReason: {
            CHROME_UPDATE: 'chrome_update',
            INSTALL: 'install',
            SHARED_MODULE_UPDATE: 'shared_module_update',
            UPDATE: 'update'
          },
          OnRestartRequiredReason: {
            APP_UPDATE: 'app_update',
            OS_UPDATE: 'os_update',
            PERIODIC: 'periodic'
          },
          PlatformArch: {
            ARM: 'arm',
            ARM64: 'arm64',
            MIPS: 'mips',
            MIPS64: 'mips64',
            X86_32: 'x86-32',
            X86_64: 'x86-64'
          },
          PlatformNaclArch: {
            ARM: 'arm',
            MIPS: 'mips',
            MIPS64: 'mips64',
            X86_32: 'x86-32',
            X86_64: 'x86-64'
          },
          PlatformOs: {
            ANDROID: 'android',
            CROS: 'cros',
            LINUX: 'linux',
            MAC: 'mac',
            OPENBSD: 'openbsd',
            WIN: 'win'
          },
          RequestUpdateCheckStatus: {
            NO_UPDATE: 'no_update',
            THROTTLED: 'throttled',
            UPDATE_AVAILABLE: 'update_available'
          },
          connect: () => {},
          sendMessage: () => {},
        },
        webstore: {
          install: () => {},
          onDownloadProgress: {},
          onInstallStageChanged: {},
        }
      };

      // Permissions API偽装
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) => (
        parameters.name === 'notifications' ?
          Promise.resolve({ state: Notification.permission }) :
          originalQuery(parameters)
      );

      // Plugin偽装
      Object.defineProperty(navigator, 'plugins', {
        get: () => {
          return [
            { 
              0: { type: "application/x-google-chrome-pdf", suffixes: "pdf" },
              1: { type: "application/pdf", suffixes: "pdf" },
              description: "Portable Document Format",
              filename: "internal-pdf-viewer",
              length: 2,
              name: "Chrome PDF Plugin"
            },
            {
              0: { type: "application/x-nacl", suffixes: "" },
              1: { type: "application/x-pnacl", suffixes: "" },
              description: "Native Client Executable",
              filename: "internal-nacl-plugin",
              length: 2,
              name: "Native Client"
            }
          ];
        },
      });

      // Language偽装
      Object.defineProperty(navigator, 'languages', {
        get: () => ['ja-JP', 'ja', 'en-US', 'en'],
      });

      // Hardware Concurrency偽装
      Object.defineProperty(navigator, 'hardwareConcurrency', {
        get: () => 4 + Math.floor(Math.random() * 4),
      });

      // Device Memory偽装
      Object.defineProperty(navigator, 'deviceMemory', {
        get: () => 8,
      });

      // Connection偽装
      Object.defineProperty(navigator, 'connection', {
        get: () => ({
          effectiveType: '4g',
          rtt: 100,
          downlink: 1.5,
          saveData: false,
        }),
      });

      // Battery API偽装
      navigator.getBattery = () => Promise.resolve({
        charging: true,
        chargingTime: 0,
        dischargingTime: Infinity,
        level: 0.8 + Math.random() * 0.2,
      });

      // WebGL偽装
      const getParameter = WebGLRenderingContext.prototype.getParameter;
      WebGLRenderingContext.prototype.getParameter = function(parameter) {
        if (parameter === 37445) {
          return 'Intel Inc.';
        }
        if (parameter === 37446) {
          return 'Intel Iris OpenGL Engine';
        }
        return getParameter.apply(this, arguments);
      };

      // Canvas偽装
      const toDataURL = HTMLCanvasElement.prototype.toDataURL;
      HTMLCanvasElement.prototype.toDataURL = function() {
        const context = this.getContext('2d');
        const imageData = context.getImageData(0, 0, this.width, this.height);
        for (let i = 0; i < imageData.data.length; i += 4) {
          imageData.data[i] = imageData.data[i] ^ (Math.random() * 0.1);
        }
        context.putImageData(imageData, 0, 0);
        return toDataURL.apply(this, arguments);
      };

      // AudioContext偽装
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const analyser = audioContext.createAnalyser();
      const gain = audioContext.createGain();
      const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);

      // Timezone偽装
      Date.prototype.getTimezoneOffset = () => -540; // JST
    });

    // マウス動作の人間化
    await this.humanizeMouseMovements(page);
    
    // キーボード入力の人間化
    await this.humanizeKeyboard(page);

    // スクロールの人間化
    await this.humanizeScrolling(page);
  }

  /**
   * マウス動作を人間らしくする
   */
  async humanizeMouseMovements(page) {
    page.on('mouse', async (x, y) => {
      // ベジェ曲線を使った自然なマウス移動
      const steps = 20 + Math.floor(Math.random() * 10);
      for (let i = 0; i < steps; i++) {
        const t = i / steps;
        const easing = t < 0.5 
          ? 4 * t * t * t 
          : 1 - Math.pow(-2 * t + 2, 3) / 2;
        
        await page.mouse.move(
          x * easing,
          y * easing
        );
        
        await this.randomWait(5, 15);
      }
    });
  }

  /**
   * キーボード入力を人間らしくする
   */
  async humanizeKeyboard(page) {
    const originalType = page.keyboard.type.bind(page.keyboard);
    page.keyboard.type = async (text, options = {}) => {
      const chars = text.split('');
      for (const char of chars) {
        // WPM: 40-80 (人間の平均タイピング速度)
        const wpm = 40 + Math.random() * 40;
        const delay = 60000 / (wpm * 5); // 1文字あたりのミリ秒
        
        await originalType(char, { delay: delay + Math.random() * 50 });
        
        // 時々一時停止（考えている様子）
        if (Math.random() < 0.05) {
          await this.randomWait(500, 2000);
        }
        
        // タイプミスと修正（3%の確率）
        if (Math.random() < 0.03) {
          const wrongChar = String.fromCharCode(97 + Math.floor(Math.random() * 26));
          await originalType(wrongChar, { delay: delay });
          await this.randomWait(200, 500);
          await page.keyboard.press('Backspace');
          await this.randomWait(100, 300);
        }
      }
    };
  }

  /**
   * スクロールを人間らしくする
   */
  async humanizeScrolling(page) {
    page.on('load', async () => {
      // ページ読み込み後、自然にスクロール
      const scrollHeight = await page.evaluate(() => document.body.scrollHeight);
      let currentPosition = 0;
      
      while (currentPosition < scrollHeight - 1000) {
        const scrollAmount = 100 + Math.random() * 300;
        await page.evaluate((amount) => {
          window.scrollBy({
            top: amount,
            behavior: 'smooth'
          });
        }, scrollAmount);
        
        currentPosition += scrollAmount;
        
        // 読んでいる時間をシミュレート
        await this.randomWait(1000, 3000);
        
        // 時々上にも少しスクロール
        if (Math.random() < 0.2) {
          await page.evaluate(() => {
            window.scrollBy({
              top: -(50 + Math.random() * 100),
              behavior: 'smooth'
            });
          });
          await this.randomWait(500, 1000);
        }
      }
    });
  }

  /**
   * 高度なログイン処理（2FA対応）
   */
  async login() {
    console.log('🔐 高度なステルスログイン開始...');
    
    // Cookie読み込み試行
    const cookieLogin = await this.tryLoginWithCookies();
    if (cookieLogin) {
      console.log('✅ Cookie経由でログイン成功');
      return true;
    }

    // 通常ログイン
    await this.page.goto('https://www.facebook.com', {
      waitUntil: 'networkidle0',
      timeout: 60000
    });

    // ランダム待機（ページ観察）
    await this.randomWait(2000, 5000);

    // メールアドレス入力
    const emailSelector = 'input[name="email"], input[id="email"]';
    await this.page.waitForSelector(emailSelector, { visible: true });
    await this.humanClick(emailSelector);
    await this.humanType(this.config.email);

    await this.randomWait(500, 1500);

    // パスワード入力
    const passSelector = 'input[name="pass"], input[id="pass"]';
    await this.humanClick(passSelector);
    await this.humanType(this.config.password);

    await this.randomWait(1000, 2000);

    // ログインボタンクリック
    const loginButton = 'button[name="login"], button[type="submit"]';
    await this.humanClick(loginButton);

    // ナビゲーション待機
    try {
      await this.page.waitForNavigation({ 
        waitUntil: 'networkidle0', 
        timeout: 30000 
      });
    } catch (e) {
      console.log('ナビゲーション待機タイムアウト（正常な場合があります）');
    }

    // 2FA確認
    const has2FA = await this.check2FA();
    if (has2FA) {
      console.log('📱 2段階認証が必要です');
      // ここで2FAコードを待つ必要があります
      return false;
    }

    // ログイン成功確認
    const success = await this.verifyLogin();
    if (success) {
      await this.saveCookies();
      console.log('✅ ログイン成功');
    }

    return success;
  }

  /**
   * 2FA確認
   */
  async check2FA() {
    const selectors = [
      'input[name="approvals_code"]',
      'input[aria-label*="code"]',
      'input[placeholder*="code"]'
    ];
    
    for (const selector of selectors) {
      const element = await this.page.$(selector);
      if (element) return true;
    }
    return false;
  }

  /**
   * 人間らしいクリック
   */
  async humanClick(selector) {
    const element = await this.page.$(selector);
    if (!element) throw new Error(`Element not found: ${selector}`);
    
    const box = await element.boundingBox();
    if (!box) throw new Error(`Element not visible: ${selector}`);
    
    // ランダムな位置をクリック
    const x = box.x + box.width * (0.3 + Math.random() * 0.4);
    const y = box.y + box.height * (0.3 + Math.random() * 0.4);
    
    // マウスを移動
    await this.moveMouseNaturally(x, y);
    await this.randomWait(100, 300);
    
    // クリック
    await this.page.mouse.click(x, y);
  }

  /**
   * 自然なマウス移動（ベジェ曲線）
   */
  async moveMouseNaturally(targetX, targetY) {
    const currentPosition = await this.page.evaluate(() => ({
      x: window.mouseX || 0,
      y: window.mouseY || 0
    }));
    
    const distance = Math.sqrt(
      Math.pow(targetX - currentPosition.x, 2) + 
      Math.pow(targetY - currentPosition.y, 2)
    );
    
    const steps = Math.min(25, Math.max(5, Math.floor(distance / 50)));
    
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const easing = t < 0.5 
        ? 4 * t * t * t 
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
      
      const x = currentPosition.x + (targetX - currentPosition.x) * easing;
      const y = currentPosition.y + (targetY - currentPosition.y) * easing;
      
      // 微妙な揺れを追加
      const wobbleX = (Math.random() - 0.5) * 2;
      const wobbleY = (Math.random() - 0.5) * 2;
      
      await this.page.mouse.move(x + wobbleX, y + wobbleY);
      await this.randomWait(10, 30);
    }
    
    // 最終位置に正確に移動
    await this.page.mouse.move(targetX, targetY);
  }

  /**
   * 人間らしいタイピング
   */
  async humanType(text) {
    for (const char of text) {
      await this.page.keyboard.type(char);
      
      // WPM: 40-80
      const wpm = 40 + Math.random() * 40;
      const delay = 60000 / (wpm * 5);
      
      await this.randomWait(delay, delay + 100);
      
      // 時々の一時停止
      if (Math.random() < 0.05) {
        await this.randomWait(500, 1500);
      }
    }
  }

  /**
   * メッセージ送信（最高レベルの偽装）
   */
  async sendMessage(recipientName, message) {
    console.log(`📤 ${recipientName}へステルス送信開始...`);
    
    try {
      // Messengerページへ移動
      await this.page.goto('https://www.facebook.com/messages/t/', {
        waitUntil: 'networkidle0',
        timeout: 60000
      });

      await this.randomWait(3000, 5000);

      // 新規メッセージボタンを探す
      const newMessageSelectors = [
        'div[aria-label*="新しいメッセージ"]',
        'div[aria-label*="New message"]',
        'a[aria-label*="新しいメッセージ"]',
        'svg[aria-label*="新規メッセージ"]'
      ];

      let clicked = false;
      for (const selector of newMessageSelectors) {
        try {
          await this.page.waitForSelector(selector, { timeout: 5000 });
          await this.humanClick(selector);
          clicked = true;
          break;
        } catch (e) {
          continue;
        }
      }

      if (!clicked) {
        // 代替方法：検索ボックスを直接使用
        const searchSelectors = [
          'input[placeholder*="検索"]',
          'input[placeholder*="Search"]',
          'input[aria-label*="Search"]'
        ];
        
        for (const selector of searchSelectors) {
          try {
            await this.page.waitForSelector(selector, { timeout: 5000 });
            await this.humanClick(selector);
            break;
          } catch (e) {
            continue;
          }
        }
      }

      await this.randomWait(1000, 2000);

      // 受信者名を入力
      await this.humanType(recipientName);
      await this.randomWait(2000, 3000);

      // 検索結果を選択
      await this.page.keyboard.press('ArrowDown');
      await this.randomWait(500, 1000);
      await this.page.keyboard.press('Enter');
      await this.randomWait(2000, 3000);

      // メッセージ入力欄を探す
      const messageSelectors = [
        'div[aria-label*="メッセージ"]',
        'div[aria-label*="Message"]',
        'div[contenteditable="true"]',
        'textarea[placeholder*="メッセージ"]'
      ];

      let messageBox = null;
      for (const selector of messageSelectors) {
        messageBox = await this.page.$(selector);
        if (messageBox) break;
      }

      if (!messageBox) {
        throw new Error('メッセージ入力欄が見つかりません');
      }

      await this.humanClick(messageBox);
      await this.randomWait(500, 1000);

      // メッセージを入力
      await this.humanType(message);
      await this.randomWait(1000, 2000);

      // 送信（Enter）
      await this.page.keyboard.press('Enter');

      console.log(`✅ メッセージ送信完了: ${recipientName}`);
      
      // 送信後の待機（重要）
      await this.randomWait(5000, 10000);
      
      return true;

    } catch (error) {
      console.error(`❌ 送信失敗: ${error.message}`);
      await this.takeDebugScreenshot('send-error');
      return false;
    }
  }

  /**
   * デバッグスクリーンショット
   */
  async takeDebugScreenshot(name) {
    const filename = `debug-${name}-${Date.now()}.png`;
    await this.page.screenshot({ 
      path: path.join(__dirname, 'screenshots', filename),
      fullPage: true 
    });
    console.log(`📸 スクリーンショット保存: ${filename}`);
  }

  /**
   * Cookie保存
   */
  async saveCookies() {
    try {
      const cookies = await this.page.cookies();
      const cookiesPath = path.join(this.config.userDataDir, 'cookies.json');
      await fs.mkdir(path.dirname(cookiesPath), { recursive: true });
      await fs.writeFile(cookiesPath, JSON.stringify(cookies, null, 2));
      console.log('🍪 Cookie保存成功');
    } catch (error) {
      console.error('Cookie保存エラー:', error);
    }
  }

  /**
   * Cookieでログイン試行
   */
  async tryLoginWithCookies() {
    try {
      const cookiesPath = path.join(this.config.userDataDir, 'cookies.json');
      const cookiesString = await fs.readFile(cookiesPath, 'utf8');
      const cookies = JSON.parse(cookiesString);
      
      await this.page.setCookie(...cookies);
      await this.page.goto('https://www.facebook.com', {
        waitUntil: 'networkidle0'
      });
      
      return await this.verifyLogin();
    } catch (error) {
      return false;
    }
  }

  /**
   * ログイン確認
   */
  async verifyLogin() {
    const loggedInSelectors = [
      'div[aria-label="Account"]',
      'div[aria-label="アカウント"]',
      'a[aria-label="Home"]',
      'a[aria-label="ホーム"]',
      'div[role="banner"]'
    ];
    
    for (const selector of loggedInSelectors) {
      const element = await this.page.$(selector);
      if (element) return true;
    }
    
    return false;
  }

  /**
   * ランダム待機
   */
  async randomWait(min, max) {
    const delay = Math.floor(Math.random() * (max - min) + min);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * ブラウザ終了
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      console.log('👋 ブラウザ終了');
    }
  }
}

module.exports = UltimateStealthBot;