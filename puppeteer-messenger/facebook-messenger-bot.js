/**
 * Facebook Messenger自動送信 - Puppeteer実装
 * 
 * ⚠️ 警告：このコードはFacebookの利用規約に違反する可能性があります
 * ⚠️ アカウント停止のリスクがあります
 * ⚠️ 教育目的での参考実装です
 */

const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const path = require('path');

class FacebookMessengerBot {
  constructor(config = {}) {
    this.email = config.email || process.env.FB_EMAIL;
    this.password = config.password || process.env.FB_PASSWORD;
    this.headless = config.headless !== undefined ? config.headless : false;
    this.browser = null;
    this.page = null;
    this.cookiesPath = path.join(__dirname, 'cookies.json');
  }

  /**
   * ブラウザを起動
   */
  async launch() {
    console.log('🚀 ブラウザを起動中...');
    
    this.browser = await puppeteer.launch({
      headless: this.headless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-notifications', // 通知を無効化
        '--disable-features=site-per-process',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920,1080',
        '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      ],
      defaultViewport: {
        width: 1920,
        height: 1080
      }
    });

    this.page = await this.browser.newPage();

    // コンソールログを表示
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('❌ ページエラー:', msg.text());
      }
    });

    // リクエストをインターセプト（画像などの不要なリソースをブロック）
    await this.page.setRequestInterception(true);
    this.page.on('request', (request) => {
      const resourceType = request.resourceType();
      if (['image', 'stylesheet', 'font'].includes(resourceType)) {
        request.abort();
      } else {
        request.continue();
      }
    });

    console.log('✅ ブラウザ起動完了');
  }

  /**
   * Facebookにログイン
   */
  async login() {
    console.log('🔐 Facebookにログイン中...');

    // 保存されたCookieがあればロード
    const cookiesExist = await this.loadCookies();
    if (cookiesExist) {
      await this.page.goto('https://www.facebook.com', {
        waitUntil: 'networkidle2',
        timeout: 60000
      });

      // ログイン済みかチェック
      const isLoggedIn = await this.checkLoginStatus();
      if (isLoggedIn) {
        console.log('✅ Cookie経由でログイン成功');
        return true;
      }
    }

    // 通常のログイン処理
    await this.page.goto('https://www.facebook.com', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    // ログインフォームに入力
    await this.page.waitForSelector('input[name="email"]', { timeout: 30000 });
    await this.page.type('input[name="email"]', this.email, { delay: 100 });
    await this.page.type('input[name="pass"]', this.password, { delay: 100 });

    // ランダムな待機時間（人間らしく見せるため）
    await this.randomWait(1000, 3000);

    // ログインボタンをクリック
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 }),
      this.page.click('button[name="login"]')
    ]);

    // ログイン成功確認
    const loginSuccess = await this.checkLoginStatus();
    if (loginSuccess) {
      console.log('✅ ログイン成功');
      await this.saveCookies();
      return true;
    } else {
      console.error('❌ ログイン失敗');
      return false;
    }
  }

  /**
   * ログイン状態をチェック
   */
  async checkLoginStatus() {
    try {
      // プロフィールアイコンまたはホームボタンの存在を確認
      const profileSelector = 'div[aria-label="Account"]';
      const homeSelector = 'a[aria-label="Home"]';
      
      const element = await this.page.$(profileSelector) || await this.page.$(homeSelector);
      return !!element;
    } catch (error) {
      return false;
    }
  }

  /**
   * Messengerページに移動してメッセージを送信
   */
  async sendMessage(recipientName, message) {
    console.log(`📤 ${recipientName}にメッセージを送信中...`);

    try {
      // Messengerページに移動
      await this.page.goto('https://www.facebook.com/messages', {
        waitUntil: 'networkidle2',
        timeout: 60000
      });

      await this.randomWait(2000, 4000);

      // 検索ボックスを探す
      const searchSelector = 'input[aria-label="Search Messenger"]';
      await this.page.waitForSelector(searchSelector, { timeout: 30000 });
      
      // 受信者を検索
      await this.page.click(searchSelector);
      await this.page.type(searchSelector, recipientName, { delay: 150 });
      
      await this.randomWait(2000, 3000);

      // 検索結果から最初の人を選択
      const resultSelector = 'ul[role="listbox"] li:first-child';
      await this.page.waitForSelector(resultSelector, { timeout: 10000 });
      await this.page.click(resultSelector);

      await this.randomWait(2000, 3000);

      // メッセージ入力欄を探す
      const messageBoxSelector = 'div[aria-label*="Message"]';
      await this.page.waitForSelector(messageBoxSelector, { timeout: 30000 });
      await this.page.click(messageBoxSelector);

      // メッセージを入力
      await this.page.type(messageBoxSelector, message, { delay: 100 });

      await this.randomWait(1000, 2000);

      // Enterキーで送信
      await this.page.keyboard.press('Enter');

      console.log(`✅ メッセージ送信成功: ${recipientName}`);
      return true;

    } catch (error) {
      console.error(`❌ メッセージ送信失敗: ${error.message}`);
      
      // スクリーンショットを保存（デバッグ用）
      await this.page.screenshot({ 
        path: `error-${Date.now()}.png`,
        fullPage: true 
      });
      
      return false;
    }
  }

  /**
   * 複数の人にメッセージを送信
   */
  async sendBulkMessages(recipients) {
    const results = [];
    
    for (const { name, message } of recipients) {
      const success = await this.sendMessage(name, message);
      results.push({ name, success });
      
      // 送信間隔を空ける（スパム対策）
      await this.randomWait(30000, 60000); // 30秒〜1分待機
    }
    
    return results;
  }

  /**
   * Cookieを保存
   */
  async saveCookies() {
    try {
      const cookies = await this.page.cookies();
      await fs.writeFile(this.cookiesPath, JSON.stringify(cookies, null, 2));
      console.log('🍪 Cookieを保存しました');
    } catch (error) {
      console.error('Cookie保存エラー:', error);
    }
  }

  /**
   * Cookieをロード
   */
  async loadCookies() {
    try {
      const cookiesString = await fs.readFile(this.cookiesPath, 'utf8');
      const cookies = JSON.parse(cookiesString);
      await this.page.setCookie(...cookies);
      console.log('🍪 Cookieをロードしました');
      return true;
    } catch (error) {
      console.log('Cookie未保存またはロードエラー');
      return false;
    }
  }

  /**
   * ランダムな待機時間
   */
  async randomWait(min, max) {
    const delay = Math.floor(Math.random() * (max - min) + min);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * ブラウザを閉じる
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      console.log('👋 ブラウザを閉じました');
    }
  }

  /**
   * 2段階認証の処理（必要な場合）
   */
  async handle2FA(code) {
    console.log('🔒 2段階認証コードを入力中...');
    
    const codeInput = await this.page.$('input[name="approvals_code"]');
    if (codeInput) {
      await this.page.type('input[name="approvals_code"]', code, { delay: 100 });
      await this.page.click('button[type="submit"]');
      await this.page.waitForNavigation({ waitUntil: 'networkidle2' });
      return true;
    }
    
    return false;
  }
}

/**
 * 使用例
 */
async function main() {
  const bot = new FacebookMessengerBot({
    email: 'your-email@example.com',
    password: 'your-password',
    headless: false // falseにすると実際のブラウザが見える
  });

  try {
    // ブラウザ起動
    await bot.launch();

    // ログイン
    const loginSuccess = await bot.login();
    if (!loginSuccess) {
      console.error('ログインに失敗しました');
      return;
    }

    // 単一メッセージ送信
    await bot.sendMessage('友達の名前', 'こんにちは！自動送信テストです。');

    // 複数メッセージ送信
    const recipients = [
      { name: '友達1', message: 'メッセージ1' },
      { name: '友達2', message: 'メッセージ2' },
      { name: '友達3', message: 'メッセージ3' }
    ];
    
    const results = await bot.sendBulkMessages(recipients);
    console.log('送信結果:', results);

  } catch (error) {
    console.error('エラー:', error);
  } finally {
    // ブラウザを閉じる
    await bot.close();
  }
}

// 環境変数から実行
if (require.main === module) {
  main().catch(console.error);
}

module.exports = FacebookMessengerBot;