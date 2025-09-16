/**
 * デプロイバージョン確認エンドポイント
 * 最新コードが反映されているか確認
 */

import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    version: '2.1.0',
    timestamp: new Date().toISOString(),
    deployedAt: '2024-12-16',
    features: {
      recipientSelector: true,
      forceAuth: true,
      debugEndpoints: true,
      envValidation: true,
      messageComposer: true
    },
    criticalFix: '⚠️ InteractiveMessageComposerをダッシュボードに正しく配置',
    updates: [
      '🔴 重要修正: コンポーネントを実際にレンダリング',
      '受信者選択UIがヘッダー直下に表示',
      'FacebookAuthPanelも同時に表示',
      '黄色い強調表示で視認性向上'
    ],
    checkUI: {
      message: '受信者選択UIが表示されない場合:',
      steps: [
        '1. Ctrl+F5でハード更新',
        '2. ブラウザのキャッシュクリア',
        '3. シークレットモードで確認',
        '4. /api/debug/check でバージョン確認'
      ]
    }
  })
}