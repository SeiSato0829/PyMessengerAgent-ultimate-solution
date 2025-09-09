"""
ローカルワーカー（実際にFacebook自動化を実行）
Supabase管理ダッシュボードと連携
"""

import asyncio
import os
import sys
import json
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from uuid import uuid4
import socket

# Supabase Python クライアント
from supabase import create_client, Client
from playwright.async_api import async_playwright, Browser, Page

# 既存のFacebook自動化コードを流用
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from working_solution.facebook_automation_complete import FacebookAutomation

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class LocalWorker:
    """Supabaseと連携するローカルワーカー"""
    
    def __init__(self, supabase_url: str, supabase_key: str, worker_api_key: str):
        self.supabase: Client = create_client(supabase_url, supabase_key)
        self.worker_api_key = worker_api_key
        self.worker_id = None
        self.worker_name = f"worker-{socket.gethostname()}"
        self.automations: Dict[str, FacebookAutomation] = {}
        self.running = True
        
    async def register_worker(self) -> bool:
        """ワーカーを登録"""
        try:
            # APIキーで認証
            auth_response = self.supabase.auth.sign_in_with_password(
                email=os.getenv("WORKER_EMAIL"),
                password=os.getenv("WORKER_PASSWORD")
            )
            
            if not auth_response.user:
                logger.error("Worker authentication failed")
                return False
            
            # ワーカー登録
            worker_data = {
                "user_id": auth_response.user.id,
                "worker_name": self.worker_name,
                "worker_type": "local",
                "ip_address": socket.gethostbyname(socket.gethostname()),
                "status": "online",
                "capabilities": {
                    "browser_automation": True,
                    "playwright_version": "1.40.0",
                    "max_concurrent": 3
                }
            }
            
            result = self.supabase.table("worker_connections").upsert(
                worker_data,
                on_conflict="worker_name"
            ).execute()
            
            if result.data:
                self.worker_id = result.data[0]["id"]
                logger.info(f"Worker registered: {self.worker_name} (ID: {self.worker_id})")
                return True
                
        except Exception as e:
            logger.error(f"Worker registration failed: {e}")
            return False
    
    async def heartbeat(self):
        """定期的にハートビート送信"""
        while self.running:
            try:
                if self.worker_id:
                    self.supabase.table("worker_connections").update({
                        "last_heartbeat": datetime.utcnow().isoformat(),
                        "status": "online"
                    }).eq("id", self.worker_id).execute()
                    
                await asyncio.sleep(30)  # 30秒ごと
                
            except Exception as e:
                logger.error(f"Heartbeat error: {e}")
                await asyncio.sleep(60)
    
    async def fetch_pending_tasks(self) -> list:
        """待機中のタスクを取得"""
        try:
            # 認証ユーザーのタスクのみ取得
            result = self.supabase.table("tasks").select("*").in_(
                "status", ["pending", "retry"]
            ).order("created_at").limit(10).execute()
            
            return result.data if result.data else []
            
        except Exception as e:
            logger.error(f"Failed to fetch tasks: {e}")
            return []
    
    async def process_task(self, task: Dict[str, Any]) -> bool:
        """タスクを処理"""
        task_id = task["id"]
        
        try:
            # タスクを処理中に更新
            self.supabase.table("tasks").update({
                "status": "processing",
                "updated_at": datetime.utcnow().isoformat()
            }).eq("id", task_id).execute()
            
            # ログ記録
            self.log_action(task_id, "task_started", {
                "worker": self.worker_name,
                "task_type": task["task_type"]
            })
            
            # アカウント情報取得
            account_result = self.supabase.table("facebook_accounts").select("*").eq(
                "id", task["account_id"]
            ).single().execute()
            
            if not account_result.data:
                raise Exception("Account not found")
            
            account = account_result.data
            
            # 復号化（Fernetで暗号化されている前提）
            from cryptography.fernet import Fernet
            key = os.getenv("ENCRYPTION_KEY").encode()
            fernet = Fernet(key)
            password = fernet.decrypt(account["encrypted_password"].encode()).decode()
            
            # Facebook自動化インスタンス取得or作成
            if account["id"] not in self.automations:
                automation = FacebookAutomation(
                    email=account["email"],
                    password=password,
                    headless=True  # 本番はTrue、デバッグ時はFalse
                )
                await automation.initialize()
                self.automations[account["id"]] = automation
            else:
                automation = self.automations[account["id"]]
            
            # タスクタイプに応じて処理
            if task["task_type"] == "send_message":
                # ログイン（必要な場合）
                if not await automation.login():
                    raise Exception("Login failed")
                
                # メッセージ送信
                success = await automation.send_message(
                    recipient_name=task["recipient_name"],
                    message=task["message"]
                )
                
                if success:
                    # 成功
                    self.supabase.table("tasks").update({
                        "status": "completed",
                        "completed_at": datetime.utcnow().isoformat(),
                        "result": {"success": True, "message": "Message sent successfully"}
                    }).eq("id", task_id).execute()
                    
                    self.log_action(task_id, "task_completed", {
                        "recipient": task["recipient_name"]
                    })
                    
                    return True
                else:
                    raise Exception("Failed to send message")
            
            else:
                raise Exception(f"Unknown task type: {task['task_type']}")
                
        except Exception as e:
            logger.error(f"Task processing error: {e}")
            
            # エラー記録
            self.supabase.table("tasks").update({
                "status": "failed",
                "error_message": str(e),
                "retry_count": task.get("retry_count", 0) + 1,
                "updated_at": datetime.utcnow().isoformat()
            }).eq("id", task_id).execute()
            
            self.log_action(task_id, "task_failed", {
                "error": str(e)
            })
            
            return False
    
    def log_action(self, task_id: str, action: str, details: Dict):
        """実行ログを記録"""
        try:
            self.supabase.table("execution_logs").insert({
                "task_id": task_id,
                "worker_id": self.worker_id,
                "action": action,
                "details": details
            }).execute()
        except Exception as e:
            logger.error(f"Failed to log action: {e}")
    
    async def cleanup(self):
        """クリーンアップ"""
        self.running = False
        
        # 全自動化インスタンスをクリーンアップ
        for automation in self.automations.values():
            await automation.cleanup()
        
        # ワーカーをオフラインに
        if self.worker_id:
            try:
                self.supabase.table("worker_connections").update({
                    "status": "offline",
                    "last_heartbeat": datetime.utcnow().isoformat()
                }).eq("id", self.worker_id).execute()
            except:
                pass
    
    async def run(self):
        """メインループ"""
        logger.info("Starting LocalWorker...")
        
        # ワーカー登録
        if not await self.register_worker():
            logger.error("Failed to register worker")
            return
        
        # ハートビートタスク開始
        heartbeat_task = asyncio.create_task(self.heartbeat())
        
        try:
            while self.running:
                # タスク取得
                tasks = await self.fetch_pending_tasks()
                
                if tasks:
                    logger.info(f"Found {len(tasks)} pending tasks")
                    
                    # タスクを順次処理（並列処理も可能）
                    for task in tasks:
                        logger.info(f"Processing task: {task['id']}")
                        await self.process_task(task)
                        
                        # 次のタスクまで少し待機
                        await asyncio.sleep(2)
                
                # 次のポーリングまで待機
                await asyncio.sleep(10)
                
        except KeyboardInterrupt:
            logger.info("Shutting down...")
        except Exception as e:
            logger.error(f"Unexpected error: {e}")
        finally:
            await self.cleanup()
            heartbeat_task.cancel()


async def main():
    """エントリーポイント"""
    
    # 環境変数チェック
    required_env = [
        "SUPABASE_URL",
        "SUPABASE_ANON_KEY", 
        "WORKER_EMAIL",
        "WORKER_PASSWORD",
        "ENCRYPTION_KEY"
    ]
    
    missing = [env for env in required_env if not os.getenv(env)]
    if missing:
        print(f"Missing environment variables: {', '.join(missing)}")
        print("\n.envファイルを作成してください:")
        print("```")
        for env in missing:
            print(f"{env}=your-value-here")
        print("```")
        sys.exit(1)
    
    # ワーカー起動
    worker = LocalWorker(
        supabase_url=os.getenv("SUPABASE_URL"),
        supabase_key=os.getenv("SUPABASE_ANON_KEY"),
        worker_api_key=os.getenv("WORKER_API_KEY", "")
    )
    
    await worker.run()


if __name__ == "__main__":
    asyncio.run(main())