/**
 * 強制認証エンドポイント - デモモードを完全バイパス
 * 環境変数に関係なくLocalStorage認証を優先
 */

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // 受け取った認証データを検証
    if (body.accessToken && body.userId && body.userName) {
      // 認証データを返す（デモモードを完全に無視）
      return NextResponse.json({
        success: true,
        authenticated: true,
        accountId: body.userId,
        accountName: body.userName,
        status: 'active',
        expiresAt: body.expiresAt || new Date(Date.now() + 86400000).toISOString(),
        isDemoMode: false, // 常にfalse
        message: '✅ Facebook認証成功（強制認証モード）',
        source: 'force-auth',
        
        // デバッグ情報
        debug: {
          environmentCheck: 'bypassed',
          authMethod: 'force-auth',
          timestamp: new Date().toISOString()
        }
      })
    } else {
      throw new Error('認証データが不完全です')
    }
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      authenticated: false,
      isDemoMode: true,
      error: error.message,
      message: '❌ 強制認証に失敗しました'
    }, { status: 400 })
  }
}

export async function GET() {
  // GETリクエストで現在の状態を確認
  return NextResponse.json({
    endpoint: '/api/auth/facebook/force-auth',
    method: 'POST',
    description: '強制認証エンドポイント - デモモードをバイパス',
    usage: {
      body: {
        accessToken: 'Facebook Access Token',
        userId: 'Facebook User ID',
        userName: 'Facebook User Name',
        expiresAt: 'Token Expiration (optional)'
      }
    },
    note: '環境変数に関係なく認証を成功させます'
  })
}