#!/usr/bin/env python3
"""
ワーカーセットアップスクリプト
"""

import os
import sys
import subprocess
import asyncio
from pathlib import Path

async def setup_worker():
    """ワーカー環境をセットアップ"""
    print("🚀 PyMessenger Worker セットアップ開始")
    
    # 現在のディレクトリ確認
    worker_dir = Path(__file__).parent
    print(f"📁 ワーカーディレクトリ: {worker_dir}")
    
    # Python version確認
    print(f"🐍 Python version: {sys.version}")
    
    # requirements.txtの存在確認
    requirements_file = worker_dir / "requirements.txt"
    if not requirements_file.exists():
        print("❌ requirements.txtが見つかりません")
        return False
    
    # 依存関係インストール
    print("📦 依存関係をインストールしています...")
    try:
        result = subprocess.run([
            sys.executable, "-m", "pip", "install", "-r", str(requirements_file)
        ], check=True, capture_output=True, text=True)
        print("✅ 依存関係インストール完了")
    except subprocess.CalledProcessError as e:
        print(f"❌ 依存関係インストールエラー: {e}")
        print(f"STDOUT: {e.stdout}")
        print(f"STDERR: {e.stderr}")
        return False
    
    # Playwrightブラウザインストール
    print("🌐 Playwrightブラウザをインストールしています...")
    try:
        result = subprocess.run([
            sys.executable, "-m", "playwright", "install", "chromium"
        ], check=True, capture_output=True, text=True)
        print("✅ Playwrightブラウザインストール完了")
    except subprocess.CalledProcessError as e:
        print(f"❌ Playwrightブラウザインストールエラー: {e}")
        return False
    
    # 環境変数ファイル確認
    env_example = worker_dir / ".env.example"
    env_file = worker_dir / ".env"
    
    if env_example.exists() and not env_file.exists():
        print("📝 .env.exampleから.envファイルを作成してください")
        print(f"   cp {env_example} {env_file}")
        print("   その後、.envファイルを編集して適切な値を設定してください")
    
    # ディレクトリ作成
    screenshots_dir = worker_dir / "screenshots"
    screenshots_dir.mkdir(exist_ok=True)
    print(f"📸 スクリーンショットディレクトリ作成: {screenshots_dir}")
    
    print("✅ セットアップ完了")
    print("\n🔧 次の手順:")
    print("1. .envファイルを編集してSupabase接続情報を設定")
    print("2. Facebook認証情報を設定")
    print("3. python main.py でワーカーを起動")
    
    return True

async def test_worker():
    """ワーカーの基本テスト"""
    print("🧪 ワーカーテスト開始")
    
    try:
        # 基本インポートテスト
        import supabase
        import playwright
        import psutil
        print("✅ 基本ライブラリインポート成功")
        
        # 環境変数チェック
        from dotenv import load_dotenv
        load_dotenv()
        
        required_vars = ['SUPABASE_URL', 'SUPABASE_KEY', 'ENCRYPTION_KEY']
        for var in required_vars:
            if not os.getenv(var):
                print(f"⚠️  環境変数 {var} が設定されていません")
        
        print("✅ ワーカーテスト完了")
        return True
        
    except ImportError as e:
        print(f"❌ インポートエラー: {e}")
        return False
    except Exception as e:
        print(f"❌ テストエラー: {e}")
        return False

async def main():
    """メイン関数"""
    if len(sys.argv) > 1:
        command = sys.argv[1]
        if command == "test":
            await test_worker()
        elif command == "setup":
            await setup_worker()
        else:
            print("使用方法: python setup.py [setup|test]")
    else:
        await setup_worker()

if __name__ == "__main__":
    asyncio.run(main())