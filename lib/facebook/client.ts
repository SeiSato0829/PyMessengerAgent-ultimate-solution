/**
 * Facebook Messenger API クライアント
 * 実際のメッセージ送信機能を実装
 */

import axios from 'axios';
import { supabase } from '@/lib/supabase/client';

export interface FacebookConfig {
  accessToken: string;
  pageId: string;
  apiVersion: string;
}

export interface MessagePayload {
  recipientId: string;
  message: string;
  metadata?: any;
}

export interface SendResult {
  success: boolean;
  messageId?: string;
  recipientId?: string;
  error?: string;
  timestamp: string;
}

export class FacebookMessengerClient {
  private config: FacebookConfig;
  private baseUrl: string;
  private rateLimitDelay = 2000; // 2秒間隔で送信

  constructor(config: FacebookConfig) {
    this.config = config;
    this.baseUrl = `https://graph.facebook.com/${config.apiVersion}`;
  }

  /**
   * メッセージを送信
   */
  async sendMessage(payload: MessagePayload): Promise<SendResult> {
    try {
      // Facebook Graph API エンドポイント
      const url = `${this.baseUrl}/${this.config.pageId}/messages`;

      // メッセージペイロード構築
      const data = {
        recipient: { id: payload.recipientId },
        message: { text: payload.message },
        messaging_type: 'UPDATE',
        access_token: this.config.accessToken
      };

      // API呼び出し
      const response = await axios.post(url, data);

      // 成功時の記録
      await this.logMessage({
        recipientId: payload.recipientId,
        message: payload.message,
        status: 'sent',
        messageId: response.data.message_id,
        timestamp: new Date().toISOString()
      });

      return {
        success: true,
        messageId: response.data.message_id,
        recipientId: response.data.recipient_id,
        timestamp: new Date().toISOString()
      };

    } catch (error: any) {
      console.error('Facebook送信エラー:', error.response?.data || error.message);

      // エラーの記録
      await this.logMessage({
        recipientId: payload.recipientId,
        message: payload.message,
        status: 'failed',
        error: error.response?.data?.error?.message || error.message,
        timestamp: new Date().toISOString()
      });

      return {
        success: false,
        error: error.response?.data?.error?.message || error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * 複数のメッセージを順次送信
   */
  async sendBulkMessages(messages: MessagePayload[]): Promise<SendResult[]> {
    const results: SendResult[] = [];
    
    for (const msg of messages) {
      // レート制限を考慮して待機
      await this.delay(this.rateLimitDelay);
      
      const result = await this.sendMessage(msg);
      results.push(result);
      
      // 成功率の計算
      const successCount = results.filter(r => r.success).length;
      const successRate = (successCount / results.length) * 100;
      
      console.log(`📊 送信進捗: ${results.length}/${messages.length} (成功率: ${successRate.toFixed(1)}%)`);
    }

    return results;
  }

  /**
   * メッセージ履歴をSupabaseに記録
   */
  private async logMessage(data: any): Promise<void> {
    try {
      const { error } = await supabase
        .from('message_history')
        .insert({
          recipient_id: data.recipientId,
          message_content: data.message,
          status: data.status,
          facebook_message_id: data.messageId,
          error_message: data.error,
          sent_at: data.timestamp,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('履歴記録エラー:', error);
      }
    } catch (error) {
      console.error('履歴記録失敗:', error);
    }
  }

  /**
   * アクセストークンの検証
   */
  async verifyAccessToken(): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/debug_token`;
      const response = await axios.get(url, {
        params: {
          input_token: this.config.accessToken,
          access_token: this.config.accessToken
        }
      });

      return response.data.data.is_valid;
    } catch (error) {
      console.error('トークン検証エラー:', error);
      return false;
    }
  }

  /**
   * ページ情報の取得
   */
  async getPageInfo(): Promise<any> {
    try {
      const url = `${this.baseUrl}/${this.config.pageId}`;
      const response = await axios.get(url, {
        params: {
          fields: 'id,name,access_token',
          access_token: this.config.accessToken
        }
      });

      return response.data;
    } catch (error) {
      console.error('ページ情報取得エラー:', error);
      return null;
    }
  }

  /**
   * 遅延関数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 使用例
export const createFacebookClient = async (accountId: string): Promise<FacebookMessengerClient | null> => {
  try {
    // Supabaseからアカウント情報を取得
    const { data, error } = await supabase
      .from('facebook_accounts')
      .select('*')
      .eq('id', accountId)
      .single();

    if (error || !data) {
      console.error('アカウント情報取得失敗:', error);
      return null;
    }

    // 暗号化されたトークンを復号化（実装必要）
    const accessToken = data.encrypted_token; // TODO: 復号化処理

    return new FacebookMessengerClient({
      accessToken,
      pageId: data.page_id,
      apiVersion: 'v18.0'
    });

  } catch (error) {
    console.error('クライアント作成失敗:', error);
    return null;
  }
};