import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

/**
 * Puppeteerを使用してMessengerでメッセージを自動送信
 * サーバーサイドでブラウザを操作
 */
export async function POST(request: NextRequest) {
  // Renderではpuppeteerを使用できないため、代替方法を使用
  console.log('Puppeteer automation is not available on Render')
  return alternativeAutomation(request)

  try {
    const body = await request.json()
    const { recipientId, message } = body

    console.log('Starting Puppeteer automation for:', recipientId)

    // ブラウザを起動（ヘッドレスモード）
    const browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920,1080'
      ],
      // Renderの場合、Chromiumのパスを指定
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH ||
        '/usr/bin/chromium-browser' ||
        puppeteer.executablePath()
    })

    const page = await browser.newPage()

    // ユーザーエージェントを設定（Botと判定されないように）
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')

    // Cookieを取得してFacebookにログイン済み状態を復元
    const cookieStore = cookies()
    const fbCookies = cookieStore.getAll()

    if (fbCookies.length > 0) {
      const cookies = fbCookies.map(cookie => ({
        name: cookie.name,
        value: cookie.value,
        domain: '.facebook.com',
        path: '/',
        httpOnly: true,
        secure: true
      }))
      await page.setCookie(...cookies)
    }

    // recipientIdの処理
    let processedId = recipientId
    if (recipientId.includes('facebook.com')) {
      const match = recipientId.match(/(?:profile\.php\?id=|facebook\.com\/)([^/?&]+)/)
      if (match) {
        processedId = match[1]
      }
    }

    // Messengerページに移動
    const messengerUrl = `https://www.messenger.com/t/${processedId}`
    console.log('Navigating to:', messengerUrl)

    await page.goto(messengerUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000
    })

    // ログインが必要な場合の処理
    const needsLogin = await page.evaluate(() => {
      return document.querySelector('input[name="email"]') !== null
    })

    if (needsLogin) {
      console.log('Login required, attempting automated login')

      // 環境変数から認証情報を取得（セキュアに管理）
      const email = process.env.FB_EMAIL
      const password = process.env.FB_PASSWORD

      if (!email || !password) {
        await browser.close()
        return NextResponse.json({
          success: false,
          error: 'Login required but credentials not configured'
        })
      }

      // ログインフォームに入力
      await page.type('input[name="email"]', email)
      await page.type('input[name="pass"]', password)
      await page.click('button[type="submit"]')

      // ログイン完了を待つ
      await page.waitForNavigation({
        waitUntil: 'networkidle2',
        timeout: 30000
      })

      // 再度Messengerページに移動
      await page.goto(messengerUrl, {
        waitUntil: 'networkidle2',
        timeout: 30000
      })
    }

    // メッセージ入力欄を探す（複数のセレクタを試す）
    const messageSelectors = [
      'div[role="textbox"][aria-label*="メッセージ"]',
      'div[role="textbox"][aria-label*="Message"]',
      'div[contenteditable="true"][data-lexical-editor="true"]',
      'div[contenteditable="true"]',
      'textarea[name="message_text"]',
      'input[placeholder*="メッセージ"]'
    ]

    let messageBox = null
    for (const selector of messageSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 })
        messageBox = await page.$(selector)
        if (messageBox) {
          console.log('Found message box with selector:', selector)
          break
        }
      } catch {
        continue
      }
    }

    if (!messageBox) {
      // メッセージボックスが見つからない場合、「メッセージ」ボタンをクリック
      const messageButtonSelectors = [
        'a[href*="/messages/t/"]',
        'button:has-text("メッセージ")',
        'button:has-text("Message")',
        'div[role="button"]:has-text("メッセージ")'
      ]

      for (const selector of messageButtonSelectors) {
        try {
          await page.click(selector)
          await page.waitForTimeout(2000)
          break
        } catch {
          continue
        }
      }

      // 再度メッセージボックスを探す
      for (const selector of messageSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 5000 })
          messageBox = await page.$(selector)
          if (messageBox) break
        } catch {
          continue
        }
      }
    }

    if (!messageBox) {
      await browser.close()
      return NextResponse.json({
        success: false,
        error: 'Could not find message input field',
        suggestion: 'The user might have privacy settings that prevent messaging'
      })
    }

    // メッセージを入力
    console.log('Typing message...')
    await messageBox.click()
    await page.keyboard.type(message, { delay: 50 }) // 人間らしいタイピング速度

    // 送信ボタンを探してクリック、またはEnterキーを押す
    const sendButtonSelectors = [
      'button[aria-label*="送信"]',
      'button[aria-label*="Send"]',
      'button[type="submit"]',
      'div[role="button"][aria-label*="送信"]'
    ]

    let sent = false
    for (const selector of sendButtonSelectors) {
      try {
        await page.click(selector)
        sent = true
        console.log('Clicked send button')
        break
      } catch {
        continue
      }
    }

    if (!sent) {
      // 送信ボタンが見つからない場合、Enterキーを押す
      console.log('Pressing Enter to send')
      await page.keyboard.press('Enter')
    }

    // 送信完了を待つ
    await page.waitForTimeout(3000)

    // 送信確認（メッセージが表示されているか）
    const sentConfirmed = await page.evaluate((msg) => {
      const messages = document.querySelectorAll('div[dir="auto"]')
      return Array.from(messages).some(el => el.textContent?.includes(msg))
    }, message)

    await browser.close()

    return NextResponse.json({
      success: true,
      method: 'Puppeteer Automation',
      confirmed: sentConfirmed,
      recipientId: processedId,
      message: 'Message sent successfully via browser automation'
    })

  } catch (error: any) {
    console.error('Puppeteer error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Puppeteer automation failed',
      details: 'Browser automation encountered an error. This might be due to Facebook security measures.'
    }, { status: 500 })
  }
}

/**
 * Puppeteerが使用できない場合の代替方法
 */
async function alternativeAutomation(request: NextRequest) {
  const body = await request.json()
  const { recipientId, message } = body

  // Renderでは直接のブラウザ自動化は不可能
  // 代わりにAPIベースの方法を提案
  // 最終的なフォールバック
  return NextResponse.json({
    success: false,
    error: 'Server-side automation not available',
    suggestion: 'Please use the Graph API method or manual sending',
    alternatives: [
      'Graph API with proper Page Access Token',
      'Manual sending via messenger.com',
      'Mobile app integration'
    ]
  })
}