#!/usr/bin/env python3
"""
PyMessenger Local Worker
Facebook Messenger自動化ワーカー
"""

import asyncio
import os
import sys
import json
import logging
import socket
import traceback
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

import psutil
from dotenv import load_dotenv
from supabase import create_client, Client
from cryptography.fernet import Fernet

from facebook_automation import FacebookAutomation

# ログ設定
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('worker.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class LocalWorker:
    def __init__(self):
        load_dotenv()
        
        # 設定の読み込み
        self.supabase_url = os.getenv('SUPABASE_URL')
        self.supabase_key = os.getenv('SUPABASE_KEY')
        self.worker_name = os.getenv('WORKER_NAME', f'worker-{socket.gethostname()}')
        self.worker_type = os.getenv('WORKER_TYPE', 'facebook_automation')
        self.encryption_key = os.getenv('ENCRYPTION_KEY').encode()
        
        if not all([self.supabase_url, self.supabase_key, self.encryption_key]):
            raise ValueError("必要な環境変数が設定されていません")
        
        # Supabaseクライアント初期化
        self.supabase: Client = create_client(self.supabase_url, self.supabase_key)
        
        # 暗号化
        self.cipher = Fernet(self.encryption_key)
        
        # Facebook自動化インスタンス
        self.facebook = None
        
        # ワーカー状態
        self.is_running = False
        self.current_task = None
        self.worker_id = None
        
        logger.info(f"ワーカー初期化完了: {self.worker_name}")

    async def start(self):
        """ワーカー開始"""
        try:
            logger.info("ワーカーを開始しています...")
            
            # ワーカー登録
            await self.register_worker()
            
            # Facebook自動化初期化
            self.facebook = FacebookAutomation()
            await self.facebook.initialize()
            
            self.is_running = True
            logger.info("ワーカーが正常に開始されました")
            
            # メインループ開始
            await self.main_loop()
            
        except Exception as e:
            logger.error(f"ワーカー開始エラー: {str(e)}")
            logger.error(traceback.format_exc())
            await self.cleanup()

    async def register_worker(self):
        """ワーカーをデータベースに登録"""
        try:
            # システム情報取得
            system_info = {
                'hostname': socket.gethostname(),
                'ip_address': socket.gethostbyname(socket.gethostname()),
                'cpu_count': psutil.cpu_count(),
                'memory_total': psutil.virtual_memory().total,
                'platform': sys.platform
            }
            
            # ワーカー登録
            result = self.supabase.table('worker_connections').upsert({
                'worker_name': self.worker_name,
                'worker_type': self.worker_type,
                'status': 'online',
                'ip_address': system_info['ip_address'],
                'hostname': system_info['hostname'],
                'system_info': system_info,
                'last_heartbeat': datetime.utcnow().isoformat()
            }).execute()
            
            if result.data:
                self.worker_id = result.data[0]['id']
                logger.info(f"ワーカー登録完了: ID {self.worker_id}")
            else:
                raise Exception("ワーカー登録に失敗しました")
                
        except Exception as e:
            logger.error(f"ワーカー登録エラー: {str(e)}")
            raise

    async def main_loop(self):
        """メインループ"""
        heartbeat_interval = 30  # 30秒間隔
        task_check_interval = 5   # 5秒間隔
        
        last_heartbeat = datetime.utcnow()
        last_task_check = datetime.utcnow()
        
        while self.is_running:
            try:
                current_time = datetime.utcnow()
                
                # ハートビート送信
                if (current_time - last_heartbeat).seconds >= heartbeat_interval:
                    await self.send_heartbeat()
                    last_heartbeat = current_time
                
                # タスクチェック
                if (current_time - last_task_check).seconds >= task_check_interval:
                    await self.check_and_process_tasks()
                    last_task_check = current_time
                
                # 短時間待機
                await asyncio.sleep(1)
                
            except KeyboardInterrupt:
                logger.info("停止シグナルを受信しました")
                break
            except Exception as e:
                logger.error(f"メインループエラー: {str(e)}")
                logger.error(traceback.format_exc())
                await asyncio.sleep(5)  # エラー時は少し長めに待機

    async def send_heartbeat(self):
        """ハートビート送信"""
        try:
            system_stats = {
                'cpu_percent': psutil.cpu_percent(),
                'memory_percent': psutil.virtual_memory().percent,
                'disk_percent': psutil.disk_usage('/').percent if os.path.exists('/') else 0
            }
            
            self.supabase.table('worker_connections').update({
                'last_heartbeat': datetime.utcnow().isoformat(),
                'system_stats': system_stats,
                'current_task_id': self.current_task.get('id') if self.current_task else None
            }).eq('id', self.worker_id).execute()
            
            logger.debug("ハートビート送信完了")
            
        except Exception as e:
            logger.error(f"ハートビート送信エラー: {str(e)}")

    async def check_and_process_tasks(self):
        """タスクチェックと処理"""
        try:
            # 現在処理中のタスクがある場合はスキップ
            if self.current_task:
                return
            
            # 待機中のタスクを取得
            result = self.supabase.table('tasks').select('*').eq('status', 'pending').order('created_at').limit(1).execute()
            
            if not result.data:
                return
            
            task = result.data[0]
            logger.info(f"新しいタスクを検出: {task['id']}")
            
            # タスクを処理中に更新
            self.supabase.table('tasks').update({
                'status': 'processing',
                'started_at': datetime.utcnow().isoformat(),
                'worker_id': self.worker_id
            }).eq('id', task['id']).execute()
            
            # タスク処理
            await self.process_task(task)
            
        except Exception as e:
            logger.error(f"タスクチェックエラー: {str(e)}")

    async def process_task(self, task: Dict[Any, Any]):
        """タスク処理"""
        self.current_task = task
        task_id = task['id']
        
        try:
            logger.info(f"タスク処理開始: {task_id}")
            
            # タスクタイプに応じて処理
            if task['task_type'] == 'send_message':
                await self.process_send_message_task(task)
            else:
                raise ValueError(f"未対応のタスクタイプ: {task['task_type']}")
            
            # タスク完了
            self.supabase.table('tasks').update({
                'status': 'completed',
                'completed_at': datetime.utcnow().isoformat(),
                'result': {'success': True}
            }).eq('id', task_id).execute()
            
            # 実行ログ記録
            await self.log_task_execution(task_id, 'completed', None)
            
            logger.info(f"タスク完了: {task_id}")
            
        except Exception as e:
            error_message = str(e)
            logger.error(f"タスク処理エラー {task_id}: {error_message}")
            logger.error(traceback.format_exc())
            
            # タスク失敗
            self.supabase.table('tasks').update({
                'status': 'failed',
                'completed_at': datetime.utcnow().isoformat(),
                'error_message': error_message,
                'result': {'success': False, 'error': error_message}
            }).eq('id', task_id).execute()
            
            # 実行ログ記録
            await self.log_task_execution(task_id, 'failed', error_message)
            
        finally:
            self.current_task = None

    async def process_send_message_task(self, task: Dict[Any, Any]):
        """メッセージ送信タスク処理"""
        try:
            # アカウント情報取得
            account_result = self.supabase.table('facebook_accounts').select('*').eq('id', task['account_id']).single().execute()
            account = account_result.data
            
            # パスワード復号化
            encrypted_password = account['encrypted_password'].encode()
            password = self.cipher.decrypt(encrypted_password).decode()
            
            # Facebookにログイン
            if not await self.facebook.is_logged_in():
                await self.facebook.login(account['email'], password)
            
            # メッセージ送信
            await self.facebook.send_message(
                recipient_name=task['recipient_name'],
                message=task['message']
            )
            
            logger.info(f"メッセージ送信完了: {task['recipient_name']}")
            
        except Exception as e:
            logger.error(f"メッセージ送信エラー: {str(e)}")
            raise

    async def log_task_execution(self, task_id: str, status: str, error_message: Optional[str] = None):
        """タスク実行ログ記録"""
        try:
            self.supabase.table('execution_logs').insert({
                'task_id': task_id,
                'worker_id': self.worker_id,
                'status': status,
                'error_message': error_message,
                'executed_at': datetime.utcnow().isoformat()
            }).execute()
        except Exception as e:
            logger.error(f"ログ記録エラー: {str(e)}")

    async def cleanup(self):
        """クリーンアップ"""
        try:
            self.is_running = False
            
            # ワーカーステータス更新
            if self.worker_id:
                self.supabase.table('worker_connections').update({
                    'status': 'offline',
                    'last_heartbeat': datetime.utcnow().isoformat()
                }).eq('id', self.worker_id).execute()
            
            # Facebook自動化クリーンアップ
            if self.facebook:
                await self.facebook.cleanup()
            
            logger.info("クリーンアップ完了")
            
        except Exception as e:
            logger.error(f"クリーンアップエラー: {str(e)}")

    async def stop(self):
        """ワーカー停止"""
        logger.info("ワーカーを停止しています...")
        await self.cleanup()

async def main():
    """メイン関数"""
    worker = LocalWorker()
    
    try:
        await worker.start()
    except KeyboardInterrupt:
        logger.info("停止シグナルを受信")
    except Exception as e:
        logger.error(f"予期しないエラー: {str(e)}")
        logger.error(traceback.format_exc())
    finally:
        await worker.cleanup()

if __name__ == "__main__":
    asyncio.run(main())