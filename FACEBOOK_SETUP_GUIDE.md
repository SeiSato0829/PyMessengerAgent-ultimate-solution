# 📱 Facebook Messenger実送信セットアップガイド

## 🎯 推奨方法：Facebook Pageを使用したメッセージ送信

### ステップ1: Facebook Pageの作成

1. **Facebookにログイン**
   - https://facebook.com にアクセス
   - アカウントにログイン

2. **ページを作成**
   ```
   https://www.facebook.com/pages/create
   ```
   - 「ビジネスまたはブランド」を選択
   - ページ名: 例）「PyMessenger Bot」
   - カテゴリ: 「ソフトウェア」
   - 説明: 「メッセージ送信テスト用ページ」

3. **ページ情報を設定**
   - プロフィール画像をアップロード
   - カバー画像を設定（任意）
   - 基本情報を入力

### ステップ2: Facebook開発者アプリの設定

1. **Facebook開発者サイトにアクセス**
   ```
   https://developers.facebook.com/apps/1074848747815619
   ```

2. **Messenger設定**
   - 左メニューから「Messenger」→「設定」
   - 「ページアクセストークン」セクション
   - 作成したページを選択
   - **Page Access Token**をコピー

### ステップ3: アプリの環境変数を更新

Render.comのダッシュボードで以下を追加：

```
PAGE_ACCESS_TOKEN=<取得したPage Access Token>
PAGE_ID=<ページのID>
```

### ステップ4: Webhookの設定

1. **Webhook URL**
   ```
   https://pymessengeragent-ultimate-solution.onrender.com/api/webhook/facebook
   ```

2. **Verify Token**
   ```
   pymessenger_webhook_verify_token_2024
   ```

3. **購読フィールド**
   - ✅ messages
   - ✅ messaging_postbacks
   - ✅ messaging_optins

## 🧪 実送信テスト手順

### 方法A: ページ経由の送信（推奨）

1. **ユーザーからページにメッセージを送信**
   - Facebookで作成したページを検索
   - 「メッセージ」ボタンをクリック
   - 任意のメッセージを送信（例：「Hello」）

2. **24時間以内にページから返信**
   - PyMessengerアプリから返信メッセージを送信
   - 受信者ID = ユーザーのFacebook User ID

### 方法B: テストユーザー間の送信

1. **Facebook開発者ダッシュボード**
   ```
   https://developers.facebook.com/apps/1074848747815619/roles/test-users/
   ```

2. **テストユーザーを作成**
   - 「テストユーザーを追加」
   - 少なくとも2人のテストユーザーを作成

3. **テストユーザー同士でメッセージ送信**

## 🔧 実装例

### Page Access Tokenを使用した送信

```typescript
// /api/messages/send-page/route.ts
const response = await fetch(`https://graph.facebook.com/v18.0/me/messages`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${pageAccessToken}` // Page Access Token使用
  },
  body: JSON.stringify({
    recipient: { id: recipientId },
    message: { text: message },
    messaging_type: 'RESPONSE'
  })
})
```

## 🚨 重要な注意事項

### 24時間ポリシー
- ユーザーが最後にページにメッセージを送信してから24時間以内のみ返信可能
- 24時間を過ぎた場合は、ユーザーからの新しいメッセージが必要

### 権限について
- **User Access Token**: 個人間メッセージ（pages_messaging権限必要・App Review必須）
- **Page Access Token**: ページ経由メッセージ（すぐに利用可能）

### App Review不要で使える機能
- ページから顧客への返信
- テストユーザー間のメッセージ
- Webhook経由の受信

## 📞 次のアクション

1. **Facebook Pageを作成** ⭐ 推奨
2. **Page Access Tokenを取得**
3. **Render.comに環境変数を追加**
4. **実送信テストを実行**

この方法なら**App Review不要**で今すぐ実送信テストが可能です！