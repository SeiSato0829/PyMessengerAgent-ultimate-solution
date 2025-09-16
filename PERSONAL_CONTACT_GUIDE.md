# 個人連絡用メッセージシステム - 正当な使用ガイド

## 🎯 個人的な連絡目的での適切な使用方法

### ✅ 推奨される使用パターン
- 友人・知人との個人的な連絡
- ビジネス関係者との適切なコミュニケーション
- 既に関係のある人への連絡（同意がある）

### 🚫 避けるべき使用パターン
- 見知らぬ人への大量メッセージ
- 宣伝・営業目的での使用
- 相手の同意なしでの連絡

## 📋 セットアップ手順

### Step 1: Facebook Pageの作成
```bash
1. Facebook Pageを作成
   - https://www.facebook.com/pages/create
   - カテゴリ：「個人ブログ」または「コミュニティ」を選択

2. Page設定
   - Page名：個人名またはニックネーム
   - 説明：「個人的な連絡用」
```

### Step 2: Page Access Tokenの取得
```bash
1. Facebook Developer Console
   - https://developers.facebook.com/
   - Apps > あなたのApp > Messenger > Settings

2. Page Access Token生成
   - 作成したPageを選択
   - Tokenを生成・コピー
```

### Step 3: 環境変数設定
```bash
# .env.local または Render.com環境変数
PAGE_ACCESS_TOKEN=あなたのPageAccessToken
FB_APP_ID=1074848747815619
FB_APP_SECRET=ae554f1df345416e5d6d08c22d07685d
```

## 🔧 使用方法

### 基本的な送信
```javascript
// フロントエンドから
const sendPersonalMessage = async (recipientId, message) => {
  const response = await fetch('/api/messages/send-page', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      recipientId: recipientId,
      message: message
    })
  });
  
  const result = await response.json();
  return result;
};

// 使用例
sendPersonalMessage('61578211067618', 'こんにちは！元気ですか？');
```

### 連絡先リスト管理
```javascript
// 友人・知人の連絡先を管理
const contacts = [
  {
    name: "田中さん",
    facebookId: "61578211067618",
    relationship: "友人",
    lastContact: "2025-01-15"
  },
  {
    name: "佐藤さん", 
    facebookId: "123456789",
    relationship: "同僚",
    lastContact: "2025-01-10"
  }
];
```

## 🛡️ 適切な使用のガイドライン

### 1. 頻度制限
```
✅ 1人につき1日1-2件まで
✅ 全体で1日10件以下
✅ 送信間隔：最低30分以上
```

### 2. メッセージ内容
```
✅ 個人的で自然な内容
✅ 相手に合わせた個別メッセージ
✅ 適切な敬語・言葉遣い
❌ コピペした同じ内容
❌ 営業・宣伝的な内容
```

### 3. 相手への配慮
```
✅ 相手からの返信があった場合のみ継続
✅ 「返信不要」など相手への配慮
✅ 適切な時間帯（9:00-21:00）
❌ 深夜・早朝の送信
❌ 一方的な連続送信
```

## 📊 使用例テンプレート

### 友人への連絡
```
こんにちは！久しぶりです😊
最近どうですか？
時間あるときにお返事いただければ嬉しいです。
```

### ビジネス関係者への連絡
```
お疲れ様です。
先日の件でご連絡いたします。
お忙しい中恐縮ですが、お時間のあるときにご確認いただけますでしょうか。
```

### 初回連絡
```
はじめまして。
〇〇の件でご連絡させていただきました。
もしご都合が悪ければ、お気になさらず削除してください。
```

## 🔍 トラブルシューティング

### エラー対応
```javascript
// 24時間制限エラー
if (error.includes('24 hour')) {
  console.log('相手からの最初のメッセージを待つ必要があります');
  // 解決：相手に「まずPageにメッセージを送ってもらう」
}

// Token無効エラー
if (error.includes('token')) {
  console.log('Page Access Tokenを更新してください');
  // 解決：Developer Consoleで新しいTokenを取得
}
```

## 🎯 成功のコツ

1. **関係構築重視**
   - まず手動でコンタクトを取る
   - 相手の反応を見て継続判断
   - 自動化は補助的に使用

2. **個別対応**
   - テンプレートは参考程度
   - 相手に合わせたメッセージ
   - 一人一人を大切に

3. **適度な距離感**
   - 押し付けがましくない
   - 相手のペースを尊重
   - 「NO」を受け入れる

**重要：このツールは人と人との繋がりを大切にするために使用してください。**