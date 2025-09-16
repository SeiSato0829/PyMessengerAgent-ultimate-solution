#!/usr/bin/env node
/**
 * Facebook User Access Tokenを使った認証テスト
 */

const USER_ACCESS_TOKEN = 'EAAPRkbnNAsMBPeFYPeK0pKHuWtFSX3DgZBVD8CTsG7lil2KDQSFGMVevrjVIuWM2Vo61tRFCpcYMHCjKQcyZBNtIyHtpzyzMsf5qMknYvn14hh0DwCwvAVbaNCumecidqJ3jChbDQmTiDeo3Tu5m4LNzgAkNQZBeeKC4jDO4T6gej8HSm5T2cQjn6GUQFT069VWQG0ZBjAZCP1QZAhI5XOr7sSBPGvrPsw0TDtoqG9h08CvH43EWxG6zqcbGTMEbNvZAfenZCfLg6IEUHwZDZD'

console.log('🧪 Facebook User Access Token テスト開始')
console.log('='.repeat(60))

async function testFacebookToken() {
  try {
    // 1. トークンの検証
    console.log('📝 Step 1: Access Token検証中...')
    const debugUrl = `https://graph.facebook.com/debug_token?input_token=${USER_ACCESS_TOKEN}&access_token=${USER_ACCESS_TOKEN}`
    const debugResponse = await fetch(debugUrl)
    const debugData = await debugResponse.json()

    if (!debugResponse.ok) {
      throw new Error(`Token Debug Error: ${debugData.error?.message}`)
    }

    console.log('✅ Token検証成功:')
    console.log(`   - App ID: ${debugData.data.app_id}`)
    console.log(`   - User ID: ${debugData.data.user_id}`)
    console.log(`   - Valid: ${debugData.data.is_valid}`)
    console.log(`   - Scopes: ${debugData.data.scopes?.join(', ')}`)
    console.log(`   - Expires: ${new Date(debugData.data.expires_at * 1000).toLocaleString()}`)

    // 2. ユーザー情報の取得
    console.log('\n📝 Step 2: ユーザー情報取得中...')
    const userUrl = `https://graph.facebook.com/me?access_token=${USER_ACCESS_TOKEN}&fields=id,name,email`
    const userResponse = await fetch(userUrl)
    const userData = await userResponse.json()

    if (!userResponse.ok) {
      throw new Error(`User Info Error: ${userData.error?.message}`)
    }

    console.log('✅ ユーザー情報取得成功:')
    console.log(`   - ID: ${userData.id}`)
    console.log(`   - Name: ${userData.name}`)
    console.log(`   - Email: ${userData.email || 'not provided'}`)

    // 3. 認証データの生成（実際のアプリで使用される形式）
    console.log('\n📝 Step 3: 認証データ生成...')
    const authData = {
      authenticated: true,
      userId: userData.id,
      userName: userData.name,
      accessToken: USER_ACCESS_TOKEN,
      expiresAt: new Date(debugData.data.expires_at * 1000).toISOString(),
      timestamp: new Date().toISOString(),
      scopes: debugData.data.scopes || ['public_profile']
    }

    console.log('✅ 認証データ生成完了:')
    console.log(JSON.stringify(authData, null, 2))

    // 4. LocalStorageシミュレーション用のスクリプト生成
    console.log('\n📝 Step 4: LocalStorage設定用スクリプト生成...')
    const script = `
// ブラウザのコンソールで実行してください
localStorage.setItem('facebook_auth', '${JSON.stringify(authData)}');
console.log('✅ Facebook認証データをLocalStorageに保存しました');
window.location.reload();
`

    console.log('✅ 以下のスクリプトをブラウザで実行してください:')
    console.log('='.repeat(60))
    console.log(script)
    console.log('='.repeat(60))

    console.log('\n🎉 Facebook認証テスト完了！')
    console.log('📌 次のステップ:')
    console.log('   1. https://pymessengeragent-ultimate-solution.onrender.com を開く')
    console.log('   2. F12でコンソールを開く')
    console.log('   3. 上記スクリプトを貼り付けて実行')
    console.log('   4. ページがリロードされ、認証済み状態になります')

  } catch (error) {
    console.error('❌ エラー発生:', error.message)
    console.log('\n🔧 対処法:')
    console.log('   - トークンの有効期限を確認')
    console.log('   - Graph API Explorerで新しいトークンを生成')
    console.log('   - public_profile権限が付与されているか確認')
  }
}

testFacebookToken()