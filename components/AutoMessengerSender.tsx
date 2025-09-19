'use client'

import React, { useState } from 'react'

export function AutoMessengerSender() {
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

  // 自動送信を実行
  const sendAutoMessage = async () => {
    if (!recipientId || !message) {
      alert('受信者IDとメッセージは必須です')
      return
    }

    setLoading(true)
    setProgress(0)
    setStatus('🚀 自動送信を開始します...')

    try {
      const processedId = extractIdFromUrl(recipientId)
      
      // ステップ1: 制限検出とMessengerウィンドウを開く
      setStatus('🔍 アクセス制限をチェック中...')
      setProgress(10)
      
      // 複数のアクセス方法を試行
      const accessMethods = [
        {
          name: 'm.me (最も制限が少ない)',
          url: `https://m.me/${processedId}`,
          options: 'width=600,height=700,scrollbars=yes,resizable=yes'
        },
        {
          name: 'Facebook Lite',
          url: `https://mbasic.facebook.com/messages/thread/${processedId}`,
          options: 'width=800,height=600,scrollbars=yes,resizable=yes'
        },
        {
          name: 'Facebook Mobile',
          url: `https://m.facebook.com/messages/thread/${processedId}`,
          options: 'width=600,height=700,scrollbars=yes,resizable=yes'
        },
        {
          name: 'Facebook Desktop (標準)',
          url: `https://www.facebook.com/messages/t/${processedId}`,
          options: 'width=1000,height=800,scrollbars=yes,resizable=yes'
        }
      ]
      
      setStatus('📱 最適なアクセス方法でMessengerを開いています...')
      setProgress(20)
      
      let messengerWindow = null
      let successMethod = null
      
      // 順番に試行
      for (let i = 0; i < accessMethods.length; i++) {
        const method = accessMethods[i]
        try {
          setStatus(`🔄 ${method.name}でアクセス中...`)
          
          messengerWindow = window.open(
            method.url,
            `auto_messenger_${i}`,
            method.options
          )
          
          if (messengerWindow) {
            successMethod = method
            break
          }
        } catch (error) {
          console.log(`Method ${i + 1} failed:`, error)
          continue
        }
      }

      if (!messengerWindow) {
        throw new Error('すべてのアクセス方法が失敗しました。ポップアップを許可してください。')
      }
      
      setStatus(`✅ ${successMethod?.name}でアクセス成功`)
      setProgress(25)

      // ステップ2: ウィンドウの読み込み待機
      setStatus('⏳ Messengerの読み込みを待機中...')
      setProgress(40)
      
      await new Promise(resolve => setTimeout(resolve, 5000))

      // ステップ3: 自動化スクリプトを注入
      setStatus('🔧 自動化スクリプトを注入中...')
      setProgress(60)

      const automationScript = `
        (function() {
          console.log('🤖 Messenger自動化スクリプト開始');
          
          const message = "${message.replace(/"/g, '\\"')}";
          let attempts = 0;
          const maxAttempts = 30;
          
          function findAndFillMessage() {
            attempts++;
            console.log('試行回数:', attempts);
            
            // 複数のセレクタを試す
            const selectors = [
              'div[contenteditable="true"][data-testid]',
              'div[contenteditable="true"][aria-label*="メッセージ"]',
              'div[contenteditable="true"][aria-label*="message"]',
              'div[contenteditable="true"][role="textbox"]',
              'div[aria-describedby*="placeholder"]',
              'div[data-testid="composer-input"]',
              'div.notranslate'
            ];
            
            let messageBox = null;
            
            for (const selector of selectors) {
              const elements = document.querySelectorAll(selector);
              for (const element of elements) {
                if (element.offsetParent !== null) { // 要素が表示されているかチェック
                  messageBox = element;
                  break;
                }
              }
              if (messageBox) break;
            }
            
            if (messageBox) {
              console.log('✅ メッセージボックスを発見:', messageBox);
              
              // フォーカスを当てる
              messageBox.focus();
              messageBox.click();
              
              // テキストを入力
              messageBox.innerHTML = message;
              messageBox.innerText = message;
              
              // 入力イベントを発火
              const inputEvent = new Event('input', { bubbles: true });
              messageBox.dispatchEvent(inputEvent);
              
              // 少し待ってから送信ボタンを探す
              setTimeout(() => {
                findAndClickSend();
              }, 1000);
              
              return true;
            }
            
            if (attempts < maxAttempts) {
              setTimeout(findAndFillMessage, 1000);
            } else {
              console.log('❌ メッセージボックスが見つかりませんでした');
              window.parent.postMessage({
                type: 'AUTOMATION_ERROR',
                message: 'メッセージボックスが見つかりませんでした'
              }, '*');
            }
            
            return false;
          }
          
          function findAndClickSend() {
            console.log('🔍 送信ボタンを探しています...');
            
            const sendSelectors = [
              'div[aria-label*="送信"]',
              'div[aria-label*="Send"]',
              'button[aria-label*="送信"]',
              'button[aria-label*="Send"]',
              'div[role="button"][aria-label*="送信"]',
              'div[role="button"][aria-label*="Send"]'
            ];
            
            let sendButton = null;
            
            for (const selector of sendSelectors) {
              const buttons = document.querySelectorAll(selector);
              for (const button of buttons) {
                if (button.offsetParent !== null) {
                  sendButton = button;
                  break;
                }
              }
              if (sendButton) break;
            }
            
            if (sendButton) {
              console.log('✅ 送信ボタンを発見:', sendButton);
              sendButton.click();
              
              window.parent.postMessage({
                type: 'AUTOMATION_SUCCESS',
                message: 'メッセージを自動送信しました！'
              }, '*');
              
            } else {
              console.log('❌ 送信ボタンが見つかりませんでした');
              window.parent.postMessage({
                type: 'AUTOMATION_ERROR',
                message: '送信ボタンが見つかりませんでした'
              }, '*');
            }
          }
          
          // 自動化開始
          setTimeout(findAndFillMessage, 2000);
        })();
      `;

      // ステップ4: 高度な自動化APIを使用
      setStatus('🤖 高度な自動化を実行中...')
      setProgress(80)

      try {
        // サーバーサイド自動化APIを呼び出し
        const response = await fetch('/api/messages/auto-send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipientId: processedId,
            message
          })
        })

        const data = await response.json()

        if (response.ok && data.success) {
          // 自動化スクリプトを実行
          setStatus('🔧 自動化スクリプトを注入中...')
          setProgress(85)

          // 高度な自動化ライブラリを読み込み
          const automationLibScript = await fetch('/utils/messengerAutomation.js').then(r => r.text())
          
          // メッセージリスナーを設定
          const messageListener = (event: MessageEvent) => {
            if (event.data.type === 'AUTOMATION_SUCCESS') {
              setStatus('✅ 完全自動送信が成功しました！')
              setProgress(100)
              setLoading(false)
              window.removeEventListener('message', messageListener)
              
              setTimeout(() => {
                if (!messengerWindow.closed) {
                  messengerWindow.close()
                }
              }, 5000)
            } else if (event.data.type === 'AUTOMATION_ERROR') {
              setStatus(`❌ エラー: ${event.data.message}`)
              setLoading(false)
              window.removeEventListener('message', messageListener)
            } else if (event.data.type === 'AUTOMATION_PROGRESS') {
              setStatus(event.data.status)
              setProgress(event.data.percentage)
            }
          }
          
          window.addEventListener('message', messageListener)

          // 自動化ライブラリとスクリプトを注入
          const fullAutomationScript = `
            ${automationLibScript}
            
            // 制限検出付き自動化実行
            (async function() {
              try {
                // 1. Facebook制限検出
                function detectRestrictions() {
                  const restrictionIndicators = [
                    'このコンテンツは現在ご利用いただけません',
                    'Content Not Available',
                    'This content isn\\'t available',
                    'プライバシー設定',
                    'privacy settings',
                    'フィードに移動',
                    'Go to Feed'
                  ];
                  
                  const pageText = document.body.innerText || document.body.textContent || '';
                  
                  for (const indicator of restrictionIndicators) {
                    if (pageText.includes(indicator)) {
                      return {
                        restricted: true,
                        reason: indicator,
                        suggestion: 'm.me URLまたはモバイル版を試してください'
                      };
                    }
                  }
                  
                  return { restricted: false };
                }
                
                // 2. ログイン状態確認
                function checkLoginStatus() {
                  const loginSelectors = [
                    'input[name="email"]',
                    'input[name="pass"]',
                    '[data-testid="royal_login_form"]',
                    '.login_form'
                  ];
                  
                  for (const selector of loginSelectors) {
                    if (document.querySelector(selector)) {
                      return { loggedIn: false, needsLogin: true };
                    }
                  }
                  
                  return { loggedIn: true, needsLogin: false };
                }
                
                // 3. 初期チェック
                setTimeout(() => {
                  const restrictionCheck = detectRestrictions();
                  const loginCheck = checkLoginStatus();
                  
                  if (restrictionCheck.restricted) {
                    window.parent.postMessage({
                      type: 'AUTOMATION_ERROR',
                      message: \`アクセス制限: \${restrictionCheck.reason}. \${restrictionCheck.suggestion}\`
                    }, '*');
                    return;
                  }
                  
                  if (!loginCheck.loggedIn) {
                    window.parent.postMessage({
                      type: 'AUTOMATION_ERROR',
                      message: 'Facebookにログインが必要です。ログイン後に再試行してください。'
                    }, '*');
                    return;
                  }
                  
                  // 制限なし - 通常の自動化を実行
                  executeAutomation();
                  
                }, 3000);
                
                // 4. 自動化実行
                function executeAutomation() {
                  const automator = new MessengerAutomator();
                  
                  // プログレスコールバック設定
                  const progressCallback = (step, percentage, status) => {
                    window.parent.postMessage({
                      type: 'AUTOMATION_PROGRESS',
                      step: step,
                      percentage: percentage,
                      status: status
                    }, '*');
                  };
                  
                  // 自動送信実行
                  automator.sendMessage('${processedId}', \`${message.replace(/`/g, '\\`')}\`, {
                    progressCallback: progressCallback,
                    timeout: 60000
                  }).then(result => {
                    window.parent.postMessage({
                      type: 'AUTOMATION_SUCCESS',
                      message: '完全自動送信が成功しました！',
                      result: result
                    }, '*');
                  }).catch(error => {
                    console.error('自動化エラー:', error);
                    window.parent.postMessage({
                      type: 'AUTOMATION_ERROR',
                      message: \`自動化失敗: \${error.message}\`
                    }, '*');
                  });
                }
                
              } catch (error) {
                console.error('制限検出エラー:', error);
                window.parent.postMessage({
                  type: 'AUTOMATION_ERROR',
                  message: \`制限検出エラー: \${error.message}\`
                }, '*');
              }
            })();
          `

          // スクリプト注入を試行
          setTimeout(() => {
            try {
              if (!messengerWindow.closed) {
                // 直接注入を試行
                const script = messengerWindow.document.createElement('script')
                script.textContent = fullAutomationScript
                messengerWindow.document.head.appendChild(script)
                setStatus('🚀 高度な自動化スクリプトを注入しました')
              }
            } catch (error) {
              console.log('Direct injection failed, using fallback')
              
              // フォールバック: クリップボードにコピー
              navigator.clipboard.writeText(fullAutomationScript).then(() => {
                setStatus('📋 高度な自動化スクリプトをクリップボードにコピーしました。開いたウィンドウのコンソール(F12)に貼り付けて実行してください。')
              }).catch(() => {
                setStatus('⚠️ 手動実行が必要です。開いたウィンドウで手動でメッセージを送信してください。')
              })
            }
          }, 2000)

        } else {
          throw new Error(data.error || 'API呼び出しに失敗しました')
        }
      } catch (apiError: any) {
        console.error('API Error:', apiError)
        setStatus('⚠️ APIエラー。従来の方法で実行します...')
        
        // フォールバック: 従来のスクリプト
        const fallbackScript = automationScript
        navigator.clipboard.writeText(fallbackScript).then(() => {
          setStatus('📋 フォールバックスクリプトをクリップボードにコピーしました。F12でコンソールに貼り付けてください。')
        })
      }

      // タイムアウト設定
      setTimeout(() => {
        if (loading) {
          setStatus('⏰ タイムアウト: 手動で送信を完了してください')
          setLoading(false)
          window.removeEventListener('message', messageListener)
        }
      }, 30000)

    } catch (error: any) {
      setStatus(`❌ エラー: ${error.message}`)
      setLoading(false)
    }
  }

  return (
    <div className="w-full bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl p-6 text-white">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">🤖 完全自動メッセージ送信</h2>
        <p className="text-green-100">
          Messengerを開いて自動でメッセージを入力・送信します
        </p>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2 text-green-100">
            受信者ID または プロフィールURL
          </label>
          <input
            type="text"
            placeholder="例: https://facebook.com/profile.php?id=100012345678901"
            value={recipientId}
            onChange={(e) => setRecipientId(e.target.value)}
            className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-md text-white placeholder-green-200 focus:outline-none focus:ring-2 focus:ring-white"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2 text-green-100">
            メッセージ内容
          </label>
          <textarea
            placeholder="自動で入力・送信されるメッセージを入力..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded-md text-white placeholder-green-200 focus:outline-none focus:ring-2 focus:ring-white"
          />
        </div>
        
        <button
          onClick={sendAutoMessage}
          disabled={loading || !recipientId || !message}
          className="w-full px-4 py-3 bg-white text-green-600 rounded-md font-bold hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105"
        >
          {loading ? '🤖 自動送信中...' : '🚀 完全自動送信を開始'}
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
            <p className="text-sm text-center text-green-100">{status}</p>
          </div>
        )}
        
        {!loading && status && (
          <div className={`p-3 rounded-lg ${status.includes('✅') ? 'bg-green-500/20' : status.includes('❌') ? 'bg-red-500/20' : 'bg-blue-500/20'}`}>
            <p className="text-sm">{status}</p>
          </div>
        )}
      </div>
      
      <div className="mt-6 p-4 bg-white/10 rounded-lg">
        <h3 className="font-semibold mb-2">🎯 自動化の仕組み</h3>
        <ul className="text-sm space-y-1 text-green-100">
          <li>• Messengerウィンドウを自動で開きます</li>
          <li>• JavaScriptでメッセージボックスを自動検出</li>
          <li>• メッセージを自動入力します</li>
          <li>• 送信ボタンを自動でクリックします</li>
          <li>• 完全にハンズフリーで送信完了</li>
        </ul>
      </div>
      
      <div className="mt-4 p-3 bg-yellow-500/20 rounded">
        <p className="text-yellow-100 text-sm">
          ⚠️ ポップアップブロッカーを無効にし、このサイトでの自動化を許可してください
        </p>
      </div>
    </div>
  )
}

export default AutoMessengerSender