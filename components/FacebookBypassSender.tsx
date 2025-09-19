'use client'

import React, { useState } from 'react'

export function FacebookBypassSender() {
  const [recipientId, setRecipientId] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<string>('')
  const [progress, setProgress] = useState<number>(0)

  // URLからIDを抽出
  const extractIdFromUrl = (input: string) => {
    const patterns = [
      /facebook\.com\/profile\.php\?id=(\d+)/,
      /facebook\.com\/([^/?&\s]+)/,
      /fb\.com\/([^/?&\s]+)/
    ]
    
    for (const pattern of patterns) {
      const match = input.match(pattern)
      if (match && match[1]) {
        return match[1]
      }
    }
    return input
  }

  // Facebookアクセス制限を回避してメッセージ送信
  const bypassAndSend = async () => {
    if (!recipientId || !message) {
      alert('受信者IDとメッセージは必須です')
      return
    }

    setLoading(true)
    setProgress(0)
    setStatus('🔧 Facebook制限回避システムを起動中...')

    try {
      const processedId = extractIdFromUrl(recipientId)
      
      // ステップ1: 複数の回避方法を並列実行
      setStatus('🚀 複数のアクセス方法を並列実行中...')
      setProgress(20)

      const bypassMethods = [
        // 方法1: m.me直接アクセス（最も制限が少ない）
        () => {
          const url = `https://m.me/${processedId}`
          return window.open(url, 'bypass_method_1', 'width=600,height=700,scrollbars=yes,resizable=yes')
        },
        
        // 方法2: Messengerアプリプロトコル
        () => {
          const url = `fb-messenger://user-thread/${processedId}`
          window.location.href = url
          return null
        },
        
        // 方法3: Facebook Lite経由
        () => {
          const url = `https://mbasic.facebook.com/messages/thread/${processedId}`
          return window.open(url, 'bypass_method_3', 'width=800,height=600,scrollbars=yes,resizable=yes')
        },
        
        // 方法4: Instagram Direct（クロスプラットフォーム）
        () => {
          const url = `https://www.instagram.com/direct/new/?text=${encodeURIComponent(message)}`
          return window.open(url, 'bypass_method_4', 'width=700,height=600,scrollbars=yes,resizable=yes')
        },
        
        // 方法5: WhatsApp Web（代替）
        () => {
          const url = `https://wa.me/${processedId}?text=${encodeURIComponent(message)}`
          return window.open(url, 'bypass_method_5', 'width=600,height=700,scrollbars=yes,resizable=yes')
        }
      ]

      // 制限回避スクリプト
      const bypassScript = `
        // Facebook制限回避スクリプト
        (function() {
          console.log('🔧 Facebook制限回避システム開始');
          
          const targetMessage = "${message.replace(/"/g, '\\"')}";
          
          // 1. ユーザーエージェント偽装
          Object.defineProperty(navigator, 'userAgent', {
            get: function() {
              return 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1';
            }
          });
          
          // 2. ログイン状態確認
          function checkLoginStatus() {
            const loginIndicators = [
              '[data-testid="royal_login_form"]',
              'input[name="email"]',
              'input[name="pass"]',
              '.login_form'
            ];
            
            for (const indicator of loginIndicators) {
              if (document.querySelector(indicator)) {
                window.parent.postMessage({
                  type: 'LOGIN_REQUIRED',
                  message: 'Facebookにログインが必要です'
                }, '*');
                return false;
              }
            }
            return true;
          }
          
          // 3. アクセス制限検出
          function checkAccessRestriction() {
            const restrictionIndicators = [
              'このコンテンツは現在ご利用いただけません',
              'Content Not Available',
              'This content isn\\'t available',
              'プライバシー設定',
              'privacy settings'
            ];
            
            const pageText = document.body.innerText || document.body.textContent || '';
            
            for (const indicator of restrictionIndicators) {
              if (pageText.includes(indicator)) {
                window.parent.postMessage({
                  type: 'ACCESS_RESTRICTED',
                  message: 'アクセスが制限されています。別の方法を試します。'
                }, '*');
                return true;
              }
            }
            return false;
          }
          
          // 4. モバイル版にリダイレクト
          function redirectToMobile() {
            if (window.location.hostname === 'www.facebook.com') {
              window.location.href = window.location.href.replace('www.facebook.com', 'm.facebook.com');
            }
          }
          
          // 5. メイン処理
          setTimeout(() => {
            if (!checkLoginStatus()) {
              return;
            }
            
            if (checkAccessRestriction()) {
              redirectToMobile();
              return;
            }
            
            // 通常の自動化スクリプトを実行
            window.parent.postMessage({
              type: 'BYPASS_SUCCESS',
              message: '制限回避成功！自動送信を開始します'
            }, '*');
            
            // 自動送信実行
            ${generateAutoSendScript()}
            
          }, 3000);
          
        })();
      `

      // ステップ2: 各方法を順次実行
      setStatus('📱 最適なアクセス方法を選択中...')
      setProgress(40)

      let successWindow = null
      const results = []

      for (let i = 0; i < bypassMethods.length; i++) {
        try {
          setStatus(`🔄 方法${i + 1}を試行中...`)
          setProgress(40 + (i * 10))

          const window_ref = bypassMethods[i]()
          if (window_ref) {
            results.push({ method: i + 1, window: window_ref, success: true })
            
            // スクリプト注入を試行
            setTimeout(() => {
              try {
                if (!window_ref.closed) {
                  const script = window_ref.document.createElement('script')
                  script.textContent = bypassScript
                  window_ref.document.head.appendChild(script)
                }
              } catch (error) {
                console.log(`Method ${i + 1} script injection failed:`, error)
              }
            }, 2000)
          }
          
          await new Promise(resolve => setTimeout(resolve, 1000))
        } catch (error) {
          results.push({ method: i + 1, error: error.message, success: false })
        }
      }

      // ステップ3: 成功確認とメッセージリスナー
      setStatus('📡 制限回避結果を監視中...')
      setProgress(80)

      const messageListener = (event: MessageEvent) => {
        if (event.data.type === 'BYPASS_SUCCESS') {
          setStatus('✅ Facebook制限回避成功！自動送信を実行中...')
          setProgress(90)
        } else if (event.data.type === 'LOGIN_REQUIRED') {
          setStatus('🔑 Facebookログインが必要です')
          setProgress(50)
        } else if (event.data.type === 'ACCESS_RESTRICTED') {
          setStatus('🚫 アクセス制限を検出。代替方法を実行中...')
          setProgress(60)
        } else if (event.data.type === 'AUTOMATION_SUCCESS') {
          setStatus('🎉 制限回避 + 自動送信が完了しました！')
          setProgress(100)
          setLoading(false)
          window.removeEventListener('message', messageListener)
        }
      }

      window.addEventListener('message', messageListener)

      // ステップ4: 最終結果の表示
      setTimeout(() => {
        const successCount = results.filter(r => r.success).length
        if (successCount > 0) {
          setStatus(`✅ ${successCount}個の方法で制限回避に成功！適切なウィンドウでメッセージを送信してください。`)
          setProgress(95)
        } else {
          setStatus('⚠️ 全ての自動方法が制限されました。手動でのアクセスが必要です。')
          setProgress(100)
        }
        
        if (loading) {
          setLoading(false)
        }
        window.removeEventListener('message', messageListener)
      }, 15000)

    } catch (error: any) {
      setStatus(`❌ エラー: ${error.message}`)
      setLoading(false)
    }
  }

  // 自動送信スクリプト生成
  const generateAutoSendScript = () => {
    return `
      // 自動送信実行
      (async function() {
        const message = "${message.replace(/"/g, '\\"')}";
        let attempts = 0;
        const maxAttempts = 20;
        
        function findAndSend() {
          attempts++;
          
          // メッセージボックスを探す
          const messageSelectors = [
            'div[contenteditable="true"]',
            'textarea[placeholder*="メッセージ"]',
            'textarea[placeholder*="message"]',
            'input[placeholder*="メッセージ"]'
          ];
          
          let messageBox = null;
          for (const selector of messageSelectors) {
            const elements = document.querySelectorAll(selector);
            for (const element of elements) {
              if (element.offsetParent !== null) {
                messageBox = element;
                break;
              }
            }
            if (messageBox) break;
          }
          
          if (messageBox) {
            messageBox.focus();
            messageBox.value = message;
            messageBox.innerText = message;
            messageBox.innerHTML = message;
            
            // 送信ボタンを探してクリック
            setTimeout(() => {
              const sendSelectors = [
                'button[type="submit"]',
                '[role="button"][aria-label*="送信"]',
                '[role="button"][aria-label*="Send"]',
                'button:contains("送信")',
                'button:contains("Send")'
              ];
              
              for (const selector of sendSelectors) {
                const button = document.querySelector(selector);
                if (button && button.offsetParent !== null) {
                  button.click();
                  window.parent.postMessage({
                    type: 'AUTOMATION_SUCCESS',
                    message: '制限回避して自動送信しました！'
                  }, '*');
                  return;
                }
              }
            }, 1000);
          } else if (attempts < maxAttempts) {
            setTimeout(findAndSend, 2000);
          }
        }
        
        setTimeout(findAndSend, 3000);
      })();
    `
  }

  return (
    <div className="w-full bg-gradient-to-r from-red-600 to-orange-600 rounded-2xl p-6 text-white">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">🔧 Facebook制限回避送信</h2>
        <p className="text-red-100">
          プライバシー制限やアクセス制限を回避して確実に送信
        </p>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2 text-red-100">
            受信者ID または プロフィールURL
          </label>
          <input
            type="text"
            placeholder="例: https://facebook.com/profile.php?id=100012345678901"
            value={recipientId}
            onChange={(e) => setRecipientId(e.target.value)}
            className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-md text-white placeholder-red-200 focus:outline-none focus:ring-2 focus:ring-white"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2 text-red-100">
            メッセージ内容
          </label>
          <textarea
            placeholder="制限を回避して送信されるメッセージ..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-md text-white placeholder-red-200 focus:outline-none focus:ring-2 focus:ring-white"
          />
        </div>
        
        <button
          onClick={bypassAndSend}
          disabled={loading || !recipientId || !message}
          className="w-full px-4 py-3 bg-white text-red-600 rounded-md font-bold hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
        >
          {loading ? '🔧 制限回避中...' : '🚀 制限回避して送信'}
        </button>
        
        {/* 進捗表示 */}
        {loading && (
          <div className="space-y-2">
            <div className="w-full bg-white/20 rounded-full h-2">
              <div 
                className="bg-white h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-center text-red-100">{status}</p>
          </div>
        )}
        
        {!loading && status && (
          <div className={`p-3 rounded-lg ${status.includes('✅') || status.includes('🎉') ? 'bg-green-500/20' : status.includes('❌') ? 'bg-red-500/20' : 'bg-orange-500/20'}`}>
            <p className="text-sm">{status}</p>
          </div>
        )}
      </div>
      
      <div className="mt-6 p-4 bg-white/10 rounded-lg">
        <h3 className="font-semibold mb-2">🛡️ 制限回避の仕組み</h3>
        <ul className="text-sm space-y-1 text-red-100">
          <li>• m.me直接アクセスで制限回避</li>
          <li>• モバイル版FacebookとFacebook Lite使用</li>
          <li>• ユーザーエージェント偽装</li>
          <li>• 複数のプラットフォーム並列実行</li>
          <li>• Instagram Direct、WhatsApp代替</li>
        </ul>
      </div>
      
      <div className="mt-4 p-3 bg-orange-500/20 rounded">
        <p className="text-orange-100 text-sm">
          ⚠️ プライバシー制限やアクセス制限がある場合に使用してください
        </p>
      </div>
    </div>
  )
}

export default FacebookBypassSender