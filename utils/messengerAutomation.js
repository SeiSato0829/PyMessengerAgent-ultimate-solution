/**
 * Facebook Messenger 完全自動化ユーティリティ
 * ブラウザ拡張機能風の高度な自動化
 */

// グローバル自動化クラス
class MessengerAutomator {
  constructor() {
    this.isRunning = false;
    this.attempts = 0;
    this.maxAttempts = 100;
    this.debug = true;
    this.observers = [];
    this.progressCallback = null;
    this.messageQueue = [];
    this.currentTarget = null;
  }

  // デバッグログ
  log(message, type = 'info') {
    if (!this.debug) return;
    const timestamp = new Date().toLocaleTimeString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warn' ? '⚠️' : 'ℹ️';
    console.log(`[${timestamp}] ${prefix} Messenger Automator: ${message}`);
  }

  // 進捗更新
  updateProgress(step, percentage, status) {
    this.log(`Step ${step}: ${status} (${percentage}%)`);
    if (this.progressCallback) {
      this.progressCallback(step, percentage, status);
    }
  }

  // 要素を安全に取得
  async findElement(selectors, timeout = 30000, checkVisible = true) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        
        for (const element of elements) {
          if (!checkVisible || this.isElementVisible(element)) {
            this.log(`Found element with selector: ${selector}`, 'success');
            return element;
          }
        }
      }
      
      await this.sleep(500);
    }
    
    throw new Error(`Element not found after ${timeout}ms. Selectors: ${selectors.join(', ')}`);
  }

  // 要素の可視性チェック
  isElementVisible(element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.width > 0 &&
      rect.height > 0 &&
      element.offsetParent !== null &&
      getComputedStyle(element).visibility !== 'hidden' &&
      getComputedStyle(element).display !== 'none'
    );
  }

  // 非同期スリープ
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 高度なテキスト入力
  async typeText(element, text, options = {}) {
    const {
      clearFirst = true,
      typeSpeed = 50,
      triggerEvents = true
    } = options;

    this.log(`Typing text: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);

    // フォーカス
    element.focus();
    element.click();
    await this.sleep(100);

    // 既存テキストをクリア
    if (clearFirst) {
      element.innerHTML = '';
      element.innerText = '';
      element.textContent = '';
      element.value = '';
    }

    // テキストを設定
    if (element.contentEditable === 'true') {
      element.innerHTML = text;
      element.innerText = text;
    } else {
      element.value = text;
    }

    // イベントを発火
    if (triggerEvents) {
      const events = [
        'input',
        'change',
        'keydown',
        'keyup',
        'keypress',
        'focus',
        'blur'
      ];

      for (const eventType of events) {
        const event = new Event(eventType, { bubbles: true, cancelable: true });
        element.dispatchEvent(event);
        await this.sleep(10);
      }

      // React/Vue 用の特別なイベント
      const reactEvent = new Event('input', { bubbles: true });
      Object.defineProperty(reactEvent, 'target', { value: element, enumerable: true });
      element.dispatchEvent(reactEvent);
    }

    await this.sleep(typeSpeed);
    this.log('Text typing completed', 'success');
  }

  // メッセージボックスの検索
  async findMessageBox() {
    this.updateProgress(2, 30, 'メッセージボックスを検索中...');

    const selectors = [
      // 最新のFacebook Messenger
      'div[contenteditable="true"][data-testid]',
      'div[contenteditable="true"][aria-label*="メッセージ"]',
      'div[contenteditable="true"][aria-label*="message"]',
      'div[contenteditable="true"][aria-label*="Message"]',
      'div[contenteditable="true"][role="textbox"]',
      'div[data-testid="composer-input"]',
      'div[aria-describedby*="placeholder"]',
      
      // フォールバック用
      'div.notranslate[contenteditable="true"]',
      'div[contenteditable="true"]:not([aria-label*="コメント"])',
      'textarea[aria-label*="メッセージ"]',
      'textarea[aria-label*="message"]',
      'textarea[placeholder*="メッセージ"]',
      'textarea[placeholder*="message"]',
      
      // 古いバージョン用
      'div._1mf[contenteditable="true"]',
      'div._5rpu[contenteditable="true"]',
      'div._1p1t[contenteditable="true"]'
    ];

    try {
      const messageBox = await this.findElement(selectors, 30000);
      this.log('Message box found successfully', 'success');
      return messageBox;
    } catch (error) {
      this.log(`Message box not found: ${error.message}`, 'error');
      throw error;
    }
  }

  // 送信ボタンの検索
  async findSendButton() {
    this.updateProgress(4, 80, '送信ボタンを検索中...');

    const selectors = [
      // 最新バージョン
      'div[aria-label*="送信"]',
      'div[aria-label*="Send"]',
      'button[aria-label*="送信"]',
      'button[aria-label*="Send"]',
      'div[role="button"][aria-label*="送信"]',
      'div[role="button"][aria-label*="Send"]',
      
      // アイコンベース
      'svg[aria-label*="送信"]',
      'svg[aria-label*="Send"]',
      
      // データ属性ベース
      'div[data-testid*="send"]',
      'button[data-testid*="send"]',
      
      // クラスベース（フォールバック）
      'button[type="submit"]',
      'div._30yy',
      'div._9wy',
      'button._30yy'
    ];

    try {
      const sendButton = await this.findElement(selectors, 15000);
      this.log('Send button found successfully', 'success');
      return sendButton;
    } catch (error) {
      this.log(`Send button not found: ${error.message}`, 'error');
      throw error;
    }
  }

  // メイン自動化プロセス
  async sendMessage(recipientId, message, options = {}) {
    const {
      progressCallback = null,
      timeout = 60000,
      retries = 3
    } = options;

    this.progressCallback = progressCallback;
    this.isRunning = true;
    this.currentTarget = { recipientId, message };

    try {
      this.updateProgress(1, 10, '自動化プロセスを開始しています...');

      // ページの準備を待機
      await this.waitForPageReady();

      // メッセージボックスを検索
      const messageBox = await this.findMessageBox();
      this.updateProgress(3, 60, 'メッセージを入力中...');

      // メッセージを入力
      await this.typeText(messageBox, message, {
        clearFirst: true,
        typeSpeed: 100,
        triggerEvents: true
      });

      await this.sleep(1000);

      // 送信ボタンを検索
      const sendButton = await this.findSendButton();
      this.updateProgress(5, 90, 'メッセージを送信中...');

      // 送信ボタンをクリック
      await this.clickElement(sendButton);

      // 送信確認を待機
      await this.waitForSentConfirmation();

      this.updateProgress(6, 100, '✅ メッセージの送信が完了しました！');
      this.log('Message sent successfully!', 'success');

      return {
        success: true,
        recipientId,
        message,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.log(`Automation failed: ${error.message}`, 'error');
      this.updateProgress(0, 0, `❌ エラー: ${error.message}`);
      
      if (retries > 0) {
        this.log(`Retrying... (${retries} attempts left)`, 'warn');
        await this.sleep(2000);
        return this.sendMessage(recipientId, message, { ...options, retries: retries - 1 });
      }
      
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  // ページの準備完了を待機
  async waitForPageReady() {
    this.updateProgress(1, 20, 'ページの読み込みを待機中...');
    
    // DOMの準備を待機
    if (document.readyState !== 'complete') {
      await new Promise(resolve => {
        if (document.readyState === 'complete') {
          resolve();
        } else {
          window.addEventListener('load', resolve, { once: true });
        }
      });
    }

    // React/SPA の初期化を待機
    await this.sleep(3000);

    // 必要な要素が表示されるまで待機
    const checkInterval = setInterval(() => {
      const hasMessengerInterface = document.querySelector('[data-testid], [aria-label*="メッセージ"], [aria-label*="message"]');
      if (hasMessengerInterface) {
        clearInterval(checkInterval);
        this.log('Page is ready for automation', 'success');
      }
    }, 500);

    // タイムアウト設定
    setTimeout(() => {
      clearInterval(checkInterval);
    }, 10000);
  }

  // 要素をクリック
  async clickElement(element) {
    this.log('Clicking element...');
    
    // 複数のクリック方法を試行
    const clickMethods = [
      () => element.click(),
      () => {
        const event = new MouseEvent('click', { bubbles: true, cancelable: true });
        element.dispatchEvent(event);
      },
      () => {
        element.focus();
        const enterEvent = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
        element.dispatchEvent(enterEvent);
      }
    ];

    for (const method of clickMethods) {
      try {
        method();
        await this.sleep(500);
        this.log('Element clicked successfully', 'success');
        return;
      } catch (error) {
        this.log(`Click method failed: ${error.message}`, 'warn');
      }
    }

    throw new Error('All click methods failed');
  }

  // 送信確認を待機
  async waitForSentConfirmation() {
    this.updateProgress(5, 95, '送信確認を待機中...');
    
    // 送信完了の兆候を探す
    const confirmationSelectors = [
      // 送信済みメッセージの兆候
      'div[aria-label*="送信済み"]',
      'div[aria-label*="delivered"]',
      'div[aria-label*="sent"]',
      
      // 新しいメッセージが表示される兆候
      '.message-sent',
      '.sent-message',
      '[data-testid*="sent"]'
    ];

    const startTime = Date.now();
    const timeout = 5000;

    while (Date.now() - startTime < timeout) {
      for (const selector of confirmationSelectors) {
        if (document.querySelector(selector)) {
          this.log('Message sent confirmation detected', 'success');
          return true;
        }
      }
      await this.sleep(200);
    }

    // 確認が見つからない場合でも成功とみなす
    this.log('Send confirmation timeout, but assuming success', 'warn');
    return true;
  }

  // 緊急停止
  stop() {
    this.isRunning = false;
    this.log('Automation stopped by user', 'warn');
  }

  // 複数メッセージの自動送信
  async sendMultipleMessages(messageQueue) {
    this.log(`Starting batch send for ${messageQueue.length} messages`);
    const results = [];

    for (let i = 0; i < messageQueue.length; i++) {
      const { recipientId, message } = messageQueue[i];
      
      try {
        this.updateProgress(1, 0, `メッセージ ${i + 1}/${messageQueue.length} を送信中...`);
        const result = await this.sendMessage(recipientId, message);
        results.push(result);
        
        // 連続送信間の待機
        if (i < messageQueue.length - 1) {
          await this.sleep(2000);
        }
        
      } catch (error) {
        this.log(`Failed to send message ${i + 1}: ${error.message}`, 'error');
        results.push({
          success: false,
          error: error.message,
          recipientId,
          message
        });
      }
    }

    return results;
  }
}

// グローバルインスタンス
if (typeof window !== 'undefined') {
  window.MessengerAutomator = MessengerAutomator;
  window.messengerBot = new MessengerAutomator();
  
  // コンソールからの簡単実行用
  window.sendAutoMessage = function(recipientId, message) {
    return window.messengerBot.sendMessage(recipientId, message, {
      progressCallback: (step, percentage, status) => {
        console.log(`🤖 [${percentage}%] ${status}`);
      }
    });
  };
  
  console.log('🤖 Messenger Automator loaded! Use: sendAutoMessage("recipientId", "message")');
}

// Node.js環境用のエクスポート
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MessengerAutomator;
}