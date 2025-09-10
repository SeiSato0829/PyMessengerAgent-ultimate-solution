/**
 * Facebook認証状態確認API
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function GET(request: NextRequest) {
  try {
    // TODO: 実際の認証ユーザーIDを取得
    const userId = 'current-user'

    // アクティブなFacebookアカウントを取得
    const { data: accounts, error } = await supabase
      .from('facebook_accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .gt('token_expires_at', new Date().toISOString())

    if (error) {
      throw new Error(`アカウント確認エラー: ${error.message}`)
    }

    if (!accounts || accounts.length === 0) {
      return NextResponse.json({
        authenticated: false,
        error: 'アクティブなFacebookアカウントが見つかりません'
      })
    }

    const account = accounts[0]
    
    // トークンの有効性を確認
    const tokenValid = await validateFacebookToken(account.access_token)
    
    if (!tokenValid) {
      // トークンが無効な場合はステータス更新
      await supabase
        .from('facebook_accounts')
        .update({ status: 'expired' })
        .eq('id', account.id)

      return NextResponse.json({
        authenticated: false,
        error: 'Facebookトークンの期限が切れています'
      })
    }

    return NextResponse.json({
      authenticated: true,
      accountId: account.id,
      accountName: account.account_name,
      pageName: account.page_name,
      dailyLimit: account.daily_limit,
      status: account.status,
      expiresAt: account.token_expires_at
    })

  } catch (error: any) {
    console.error('認証状態確認エラー:', error)
    return NextResponse.json({
      authenticated: false,
      error: error.message || '認証状態の確認に失敗しました'
    }, { status: 500 })
  }
}

/**
 * Facebookトークンの有効性確認
 */
async function validateFacebookToken(accessToken: string): Promise<boolean> {
  try {
    // トークンを復号化（実際の実装では適切な復号化が必要）
    const decryptedToken = decrypt(accessToken)
    
    if (!decryptedToken) {
      return false
    }

    // Facebook Graph APIでトークン検証
    const response = await fetch(`https://graph.facebook.com/v18.0/debug_token?input_token=${decryptedToken}&access_token=${decryptedToken}`)
    const data = await response.json()

    return data.data?.is_valid === true
  } catch (error) {
    console.error('トークン検証エラー:', error)
    return false
  }
}

/**
 * 復号化関数（簡易版）
 */
function decrypt(encryptedText: string): string {
  if (!encryptedText) return ''
  
  try {
    const decoded = Buffer.from(encryptedText, 'base64').toString()
    const [key, text] = decoded.split(':')
    return text || ''
  } catch {
    return ''
  }
}