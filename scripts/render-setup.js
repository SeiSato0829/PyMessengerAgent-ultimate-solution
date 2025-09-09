#!/usr/bin/env node

/**
 * Render無料プラン用 自動セットアップスクリプト
 * 必要な環境変数をコピーして設定を完了させる
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Render無料プラン セットアップ開始');

// .env.renderの内容を.env.localにコピー
const envRenderPath = path.join(__dirname, '..', '.env.render');
const envLocalPath = path.join(__dirname, '..', '.env.local');

try {
  if (!fs.existsSync(envRenderPath)) {
    console.error('❌ .env.render ファイルが見つかりません');
    process.exit(1);
  }

  // 既存の.env.localをバックアップ
  if (fs.existsSync(envLocalPath)) {
    const backupPath = `${envLocalPath}.backup.${Date.now()}`;
    fs.copyFileSync(envLocalPath, backupPath);
    console.log(`📁 既存の .env.local を ${path.basename(backupPath)} にバックアップしました`);
  }

  // .env.renderの内容を.env.localにコピー
  fs.copyFileSync(envRenderPath, envLocalPath);
  console.log('✅ 環境変数設定完了: .env.local');

  // dataディレクトリ作成確認
  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('📁 データディレクトリ作成: data/');
  }

  // .gitignore更新
  const gitignorePath = path.join(__dirname, '..', '.gitignore');
  let gitignoreContent = '';
  
  if (fs.existsSync(gitignorePath)) {
    gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  }

  const entriesToAdd = [
    '# SQLite Database',
    'data/',
    '*.db',
    '*.db-*',
    '',
    '# Environment variables',
    '.env.local',
    '.env.*.local'
  ];

  let updated = false;
  entriesToAdd.forEach(entry => {
    if (!gitignoreContent.includes(entry)) {
      gitignoreContent += entry + '\n';
      updated = true;
    }
  });

  if (updated) {
    fs.writeFileSync(gitignorePath, gitignoreContent);
    console.log('✅ .gitignore 更新完了');
  }

  console.log('');
  console.log('🎉 セットアップ完了！');
  console.log('');
  console.log('次のステップ:');
  console.log('1. npm install     # パッケージインストール');
  console.log('2. npm run dev     # Web UI 起動');
  console.log('3. npm run worker:sqlite  # ワーカー起動（別ターミナル）');
  console.log('');
  console.log('確認URL:');
  console.log('- http://localhost:3002           # メインアプリ');
  console.log('- http://localhost:3002/api/ping  # Keep-Alive状況');
  console.log('');

} catch (error) {
  console.error('❌ セットアップエラー:', error.message);
  process.exit(1);
}