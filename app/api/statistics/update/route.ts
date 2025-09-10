/**
 * 送信統計更新API
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  try {
    const { sent, failed, timestamp } = await request.json()

    if (typeof sent !== 'number' || typeof failed !== 'number') {
      throw new Error('不正な統計データです')
    }

    const today = new Date(timestamp || new Date()).toISOString().split('T')[0]

    // 今日の統計を取得または作成
    const { data: existing, error: fetchError } = await supabase
      .from('daily_statistics')
      .select('*')
      .eq('date', today)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = not found
      throw new Error(`統計取得エラー: ${fetchError.message}`)
    }

    if (existing) {
      // 既存レコードを更新
      const updatedData = {
        sent_count: existing.sent_count + sent,
        failed_count: existing.failed_count + failed,
        success_rate: calculateSuccessRate(
          existing.sent_count + sent,
          existing.failed_count + failed
        ),
        updated_at: new Date().toISOString()
      }

      const { error: updateError } = await supabase
        .from('daily_statistics')
        .update(updatedData)
        .eq('date', today)

      if (updateError) {
        throw new Error(`統計更新エラー: ${updateError.message}`)
      }

      // リアルタイム統計も更新
      await updateRealtimeStats(sent, failed)

      return NextResponse.json({
        success: true,
        message: '統計を更新しました',
        data: {
          date: today,
          sent: existing.sent_count + sent,
          failed: existing.failed_count + failed,
          successRate: updatedData.success_rate
        }
      })

    } else {
      // 新規レコード作成
      const newData = {
        // account_id: TODO: 実際のアカウントID,
        date: today,
        sent_count: sent,
        failed_count: failed,
        delivered_count: 0, // 配信確認は別途実装
        read_count: 0, // 開封確認は別途実装
        response_count: 0, // 返信確認は別途実装
        success_rate: calculateSuccessRate(sent, failed),
        created_at: new Date().toISOString()
      }

      const { error: insertError } = await supabase
        .from('daily_statistics')
        .insert(newData)

      if (insertError) {
        throw new Error(`統計作成エラー: ${insertError.message}`)
      }

      // リアルタイム統計も更新
      await updateRealtimeStats(sent, failed)

      return NextResponse.json({
        success: true,
        message: '新規統計を作成しました',
        data: {
          date: today,
          sent,
          failed,
          successRate: newData.success_rate
        }
      })
    }

  } catch (error: any) {
    console.error('統計更新エラー:', error)
    return NextResponse.json({
      success: false,
      error: error.message || '統計の更新に失敗しました'
    }, { status: 500 })
  }
}

/**
 * 成功率計算
 */
function calculateSuccessRate(sent: number, failed: number): number {
  if (sent + failed === 0) return 0
  return Math.round((sent / (sent + failed)) * 100 * 100) / 100 // 小数点2桁
}

/**
 * リアルタイム統計更新
 */
async function updateRealtimeStats(sent: number, failed: number) {
  try {
    const { data: realtimeStats, error: fetchError } = await supabase
      .from('realtime_stats')
      .select('*')
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('リアルタイム統計取得エラー:', fetchError)
      return
    }

    const updates = {
      total_messages_today: (realtimeStats?.total_messages_today || 0) + sent + failed,
      success_rate_today: calculateSuccessRate(
        (realtimeStats?.total_messages_today || 0) + sent,
        failed
      ),
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    if (realtimeStats) {
      await supabase
        .from('realtime_stats')
        .update(updates)
        .eq('id', realtimeStats.id)
    } else {
      await supabase
        .from('realtime_stats')
        .insert(updates)
    }

  } catch (error) {
    console.error('リアルタイム統計更新エラー:', error)
  }
}