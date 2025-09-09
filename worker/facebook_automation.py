"""
Facebook Messenger自動化モジュール
Playwrightを使用してFacebook Messengerを自動操作
"""

import asyncio
import logging
import os
from typing import Optional, Dict, Any
from datetime import datetime

from playwright.async_api import async_playwright, Browser, BrowserContext, Page

logger = logging.getLogger(__name__)

class FacebookAutomation:
    def __init__(self):
        self.playwright = None
        self.browser: Optional[Browser] = None
        self.context: Optional[BrowserContext] = None
        self.page: Optional[Page] = None
        
        # 設定
        self.headless = os.getenv('HEADLESS', 'true').lower() == 'true'
        self.timeout = int(os.getenv('BROWSER_TIMEOUT', '30000'))
        self.retry_count = int(os.getenv('RETRY_COUNT', '3'))
        
        # ログイン状態
        self.logged_in = False
        self.current_user = None

    async def initialize(self):
        """ブラウザ初期化"""
        try:
            logger.info("ブラウザを初期化しています...")
            
            self.playwright = await async_playwright().start()
            
            # ブラウザ起動
            self.browser = await self.playwright.chromium.launch(
                headless=self.headless,
                args=[
                    '--no-sandbox',
                    '--disable-blink-features=AutomationControlled',
                    '--disable-web-security',
                    '--disable-features=VizDisplayCompositor'
                ]
            )
            
            # コンテキスト作成
            self.context = await self.browser.new_context(
                viewport={'width': 1280, 'height': 720},
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
            )
            
            # ページ作成
            self.page = await self.context.new_page()
            
            # タイムアウト設定
            self.page.set_default_timeout(self.timeout)
            
            logger.info("ブラウザ初期化完了")
            
        except Exception as e:
            logger.error(f"ブラウザ初期化エラー: {str(e)}")
            raise

    async def login(self, email: str, password: str) -> bool:
        """Facebookログイン"""
        for attempt in range(self.retry_count):
            try:
                logger.info(f"Facebookログイン試行 {attempt + 1}/{self.retry_count}: {email}")
                
                # Facebookログインページにアクセス
                await self.page.goto('https://www.facebook.com/login')
                await self.page.wait_for_load_state('networkidle')
                
                # メールアドレス入力
                await self.page.fill('input[name="email"]', email)
                await self.page.wait_for_timeout(1000)
                
                # パスワード入力
                await self.page.fill('input[name="pass"]', password)
                await self.page.wait_for_timeout(1000)
                
                # ログインボタンクリック
                await self.page.click('button[name="login"]')
                
                # ログイン完了待機（リダイレクト確認）
                await self.page.wait_for_url('**/facebook.com**', timeout=30000)
                
                # 2FA確認（必要な場合）
                await self.page.wait_for_timeout(3000)
                current_url = self.page.url
                
                if 'checkpoint' in current_url or 'two_factor' in current_url:
                    logger.warning("2FAが要求されています。手動で確認してください。")
                    # 2FA完了まで待機（最大5分）
                    for _ in range(60):
                        await self.page.wait_for_timeout(5000)
                        current_url = self.page.url
                        if 'checkpoint' not in current_url and 'two_factor' not in current_url:
                            break
                    else:
                        raise Exception("2FA認証がタイムアウトしました")
                
                # ログイン成功確認
                await self.page.wait_for_selector('[aria-label="メニュー"], [aria-label="Menu"]', timeout=10000)
                
                self.logged_in = True
                self.current_user = email
                logger.info(f"ログイン成功: {email}")
                
                return True
                
            except Exception as e:
                logger.error(f"ログイン試行 {attempt + 1} 失敗: {str(e)}")
                if attempt == self.retry_count - 1:
                    raise Exception(f"ログインに失敗しました: {str(e)}")
                await self.page.wait_for_timeout(5000)

    async def is_logged_in(self) -> bool:
        """ログイン状態確認"""
        try:
            if not self.logged_in:
                return False
            
            # Facebookページにアクセスしてログイン状態確認
            await self.page.goto('https://www.facebook.com')
            await self.page.wait_for_load_state('networkidle')
            
            # メニューボタンの存在確認
            menu_selector = await self.page.query_selector('[aria-label="メニュー"], [aria-label="Menu"]')
            return menu_selector is not None
            
        except Exception as e:
            logger.error(f"ログイン状態確認エラー: {str(e)}")
            self.logged_in = False
            return False

    async def send_message(self, recipient_name: str, message: str) -> bool:
        """メッセージ送信"""
        for attempt in range(self.retry_count):
            try:
                logger.info(f"メッセージ送信試行 {attempt + 1}/{self.retry_count}: {recipient_name}")
                
                # Messengerページにアクセス
                await self.page.goto('https://www.messenger.com')
                await self.page.wait_for_load_state('networkidle')
                
                # 検索ボックスを探す
                search_selector = 'input[placeholder*="検索"], input[placeholder*="Search"], input[aria-label*="検索"], input[aria-label*="Search"]'
                await self.page.wait_for_selector(search_selector, timeout=10000)
                
                # 受信者を検索
                await self.page.fill(search_selector, recipient_name)
                await self.page.wait_for_timeout(2000)
                
                # 検索結果から受信者を選択
                result_selector = f'div[aria-label*="{recipient_name}"], span:has-text("{recipient_name}")'
                try:
                    await self.page.wait_for_selector(result_selector, timeout=5000)
                    await self.page.click(result_selector)
                except:
                    # 検索結果の最初の項目をクリック
                    await self.page.click('div[role="listbox"] > div:first-child')
                
                await self.page.wait_for_timeout(2000)
                
                # メッセージ入力ボックスを探す
                message_input_selectors = [
                    'div[aria-label*="メッセージ"]',
                    'div[aria-label*="Message"]',
                    'div[contenteditable="true"][data-text]',
                    'div[contenteditable="true"]'
                ]
                
                message_input = None
                for selector in message_input_selectors:
                    try:
                        message_input = await self.page.wait_for_selector(selector, timeout=3000)
                        if message_input:
                            break
                    except:
                        continue
                
                if not message_input:
                    raise Exception("メッセージ入力ボックスが見つかりません")
                
                # メッセージ入力
                await message_input.click()
                await self.page.wait_for_timeout(500)
                await message_input.fill(message)
                await self.page.wait_for_timeout(1000)
                
                # 送信ボタンをクリック
                send_selectors = [
                    'div[aria-label*="送信"]',
                    'div[aria-label*="Send"]',
                    'button[aria-label*="送信"]',
                    'button[aria-label*="Send"]'
                ]
                
                sent = False
                for selector in send_selectors:
                    try:
                        send_button = await self.page.query_selector(selector)
                        if send_button:
                            await send_button.click()
                            sent = True
                            break
                    except:
                        continue
                
                if not sent:
                    # Enterキーで送信を試行
                    await self.page.keyboard.press('Enter')
                
                await self.page.wait_for_timeout(2000)
                
                logger.info(f"メッセージ送信完了: {recipient_name}")
                return True
                
            except Exception as e:
                logger.error(f"メッセージ送信試行 {attempt + 1} 失敗: {str(e)}")
                if attempt == self.retry_count - 1:
                    raise Exception(f"メッセージ送信に失敗しました: {str(e)}")
                await self.page.wait_for_timeout(5000)

    async def get_conversation_history(self, recipient_name: str, limit: int = 10) -> list:
        """会話履歴取得"""
        try:
            logger.info(f"会話履歴取得開始: {recipient_name}")
            
            # Messengerページにアクセス
            await self.page.goto('https://www.messenger.com')
            await self.page.wait_for_load_state('networkidle')
            
            # 受信者を検索
            search_selector = 'input[placeholder*="検索"], input[placeholder*="Search"]'
            await self.page.wait_for_selector(search_selector, timeout=10000)
            await self.page.fill(search_selector, recipient_name)
            await self.page.wait_for_timeout(2000)
            
            # 受信者を選択
            result_selector = f'div[aria-label*="{recipient_name}"]'
            await self.page.click(result_selector)
            await self.page.wait_for_timeout(3000)
            
            # メッセージ履歴を取得
            messages = []
            message_elements = await self.page.query_selector_all('div[data-testid="message-container"]')
            
            for element in message_elements[:limit]:
                try:
                    text_content = await element.text_content()
                    timestamp = await element.get_attribute('data-timestamp')
                    
                    if text_content:
                        messages.append({
                            'text': text_content.strip(),
                            'timestamp': timestamp,
                            'retrieved_at': datetime.utcnow().isoformat()
                        })
                except:
                    continue
            
            logger.info(f"会話履歴取得完了: {len(messages)}件")
            return messages
            
        except Exception as e:
            logger.error(f"会話履歴取得エラー: {str(e)}")
            raise

    async def cleanup(self):
        """クリーンアップ"""
        try:
            logger.info("Facebook自動化クリーンアップ開始")
            
            if self.page:
                await self.page.close()
                
            if self.context:
                await self.context.close()
                
            if self.browser:
                await self.browser.close()
                
            if self.playwright:
                await self.playwright.stop()
                
            logger.info("Facebook自動化クリーンアップ完了")
            
        except Exception as e:
            logger.error(f"クリーンアップエラー: {str(e)}")

    async def take_screenshot(self, filename: str = None) -> str:
        """スクリーンショット撮影"""
        try:
            if not filename:
                filename = f"screenshot_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
            
            screenshot_path = os.path.join('screenshots', filename)
            os.makedirs('screenshots', exist_ok=True)
            
            await self.page.screenshot(path=screenshot_path)
            logger.info(f"スクリーンショット保存: {screenshot_path}")
            
            return screenshot_path
            
        except Exception as e:
            logger.error(f"スクリーンショット撮影エラー: {str(e)}")
            raise