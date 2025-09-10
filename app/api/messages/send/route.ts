/**
 * メッセージ送信API
 * 実際のFacebookメッセージ送信を処理
 */

import { NextRequest, NextResponse } from 'next/server';
import { FacebookMessengerClient } from '@/lib/facebook/client';
import { supabase } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { recipientId, message, accountId, scheduleTime } = body;

    // 入力検証
    if (!recipientId || !message || !accountId) {
      return NextResponse.json({
        error: '必須パラメータが不足しています'
      }, { status: 400 });
    }

    // アカウント情報取得
    const { data: account, error: accountError } = await supabase
      .from('facebook_accounts')
      .select('*')
      .eq('id', accountId)
      .single();

    if (accountError || !account) {
      return NextResponse.json({
        error: 'アカウントが見つかりません'
      }, { status: 404 });
    }

    // スケジュール送信の場合
    if (scheduleTime) {
      const { error: taskError } = await supabase
        .from('message_tasks')
        .insert({
          account_id: accountId,
          recipient_id: recipientId,
          message_content: message,
          scheduled_at: scheduleTime,
          status: 'pending',
          created_at: new Date().toISOString()
        });

      if (taskError) {
        return NextResponse.json({
          error: 'タスク作成に失敗しました'
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'メッセージをスケジュールしました',
        scheduledAt: scheduleTime
      });
    }

    // 即時送信
    const client = new FacebookMessengerClient({
      accessToken: account.access_token, // TODO: 暗号化対応
      pageId: account.page_id,
      apiVersion: 'v18.0'
    });

    const result = await client.sendMessage({
      recipientId,
      message
    });

    if (result.success) {
      // 統計更新
      await updateStatistics('sent');
      
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        recipientId: result.recipientId,
        timestamp: result.timestamp
      });
    } else {
      // 統計更新
      await updateStatistics('failed');
      
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('送信APIエラー:', error);
    return NextResponse.json({
      error: error.message || '送信に失敗しました'
    }, { status: 500 });
  }
}

/**
 * 統計情報を更新
 */
async function updateStatistics(status: 'sent' | 'failed') {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const { data: existing } = await supabase
      .from('daily_statistics')
      .select('*')
      .eq('date', today)
      .single();

    if (existing) {
      const updates = status === 'sent' 
        ? { sent_count: existing.sent_count + 1 }
        : { failed_count: existing.failed_count + 1 };

      await supabase
        .from('daily_statistics')
        .update(updates)
        .eq('date', today);
    } else {
      await supabase
        .from('daily_statistics')
        .insert({
          date: today,
          sent_count: status === 'sent' ? 1 : 0,
          failed_count: status === 'failed' ? 1 : 0,
          created_at: new Date().toISOString()
        });
    }
  } catch (error) {
    console.error('統計更新エラー:', error);
  }
}