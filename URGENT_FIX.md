# 🚨 緊急対応 - 環境変数を今すぐ修正してください！

## 問題の原因（確定）

Render.comに以下の**無効な環境変数**が設定されています：
- `FACEBOOK_APP_ID` = "temp..." などの仮の値（11文字）
- `FACEBOOK_APP_SECRET` = 仮の値（11文字）

これらの無効な値でFacebook APIを呼び出しているため、
「アプリIDが無効」エラーが表示されます。

## 今すぐ実行すべき対応

### 方法1: 環境変数を削除（デモモードにする）

1. https://dashboard.render.com にログイン
2. あなたのサービスを選択
3. **Environment** タブを開く
4. 以下の環境変数を**削除**：
   - `FACEBOOK_APP_ID` → 削除ボタンをクリック
   - `FACEBOOK_APP_SECRET` → 削除ボタンをクリック
5. **Save Changes** をクリック
6. 自動的に再デプロイが始まります
7. 5分待つ
8. デモページが表示されるようになります

### 方法2: 強制デモモードを設定（即効性あり）

1. https://dashboard.render.com にログイン
2. あなたのサービスを選択
3. **Environment** タブを開く
4. **Add Environment Variable** をクリック
5. 以下を追加：
   - Key: `FORCE_DEMO_MODE`
   - Value: `true`
6. **Save Changes** をクリック
7. 自動的に再デプロイが始まります
8. 5分待つ
9. デモページが表示されるようになります

## なぜこうなったか

おそらく以前のテストで以下のような仮の値を設定：
- `FACEBOOK_APP_ID` = "temp_app_id" または "test123" など
- `FACEBOOK_APP_SECRET` = "temp_secret" など

これらは有効なFacebook App IDではないため、エラーになります。

## 確認方法

環境変数削除後、以下にアクセス：
```
https://pymessengeragent-ultimate-solution.onrender.com/api/auth/facebook/debug
```

`shouldBeInDemoMode: true` になっていれば成功です。

---

**⚠️ 重要**: コードは正しいです。問題は環境変数の設定だけです。