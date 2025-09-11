#!/usr/bin/env node
/**
 * 環境変数検証スクリプト
 * Render.comのビルド時に環境変数が正しく設定されているか確認
 */

console.log('='.repeat(60))
console.log('環境変数検証開始')
console.log('='.repeat(60))

const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY'
]

const warnings = []
const errors = []

// 必須環境変数のチェック
required.forEach(key => {
  const value = process.env[key]
  
  if (!value) {
    errors.push(`❌ ${key}: 未設定`)
  } else if (value.includes('xxxxx') || value.includes('your-project') || value.includes('demo-')) {
    warnings.push(`⚠️  ${key}: ダミー値が設定されています (${value.substring(0, 50)}...)`)
  } else {
    console.log(`✅ ${key}: ${value.substring(0, 30)}...`)
  }
})

// ビルド環境の情報
console.log('\n' + '='.repeat(60))
console.log('ビルド環境情報:')
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'not set'}`)
console.log(`RENDER: ${process.env.RENDER || 'not set'}`)
console.log(`IS_PULL_REQUEST: ${process.env.IS_PULL_REQUEST || 'not set'}`)
console.log('='.repeat(60))

// エラーがあればビルドを停止
if (errors.length > 0) {
  console.error('\n❌ 環境変数エラー:')
  errors.forEach(err => console.error(err))
  console.error('\nRender.comのダッシュボードで環境変数を設定してください:')
  console.error('1. Environment タブを開く')
  console.error('2. Environment Variables セクションで追加')
  console.error('3. Save Changes をクリック')
  console.error('4. Manual Deploy → Deploy latest commit')
  process.exit(1)
}

// 警告があれば表示
if (warnings.length > 0) {
  console.warn('\n⚠️  警告:')
  warnings.forEach(warn => console.warn(warn))
}

console.log('\n✅ 環境変数検証完了\n')