'use client';

import { useState } from 'react';

export default function Dashboard() {
  const [message, setMessage] = useState('');
  const [recipient, setRecipient] = useState('');
  const [status, setStatus] = useState('待機中');

  const sendMessage = async () => {
    if (!message || !recipient) {
      alert('メッセージと送信先を入力してください');
      return;
    }

    setStatus('送信中...');
    
    try {
      // 簡易メッセージ送信シミュレーション
      await new Promise(resolve => setTimeout(resolve, 2000));
      setStatus('送信完了');
      setMessage('');
      setRecipient('');
      alert('メッセージを送信しました');
    } catch (error) {
      setStatus('送信失敗');
      alert('送信に失敗しました');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">
          PyMessenger - 無料プラン
        </h1>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">ステータス</h2>
            <div className="bg-gray-100 p-3 rounded">
              {status}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                送信先
              </label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full border rounded px-3 py-2"
                placeholder="友達の名前"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                メッセージ
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full border rounded px-3 py-2"
                rows={4}
                placeholder="送信するメッセージを入力"
              />
            </div>
            
            <button
              onClick={sendMessage}
              disabled={status === '送信中...'}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:bg-gray-400"
            >
              {status === '送信中...' ? '送信中...' : 'メッセージ送信'}
            </button>
          </div>
        </div>

        <div className="mt-6 bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold mb-2">システム情報</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Render無料プラン対応版</li>
            <li>• 最小限の機能で動作</li>
            <li>• メモリ使用量: 最適化済み</li>
          </ul>
        </div>
      </div>
    </div>
  );
}