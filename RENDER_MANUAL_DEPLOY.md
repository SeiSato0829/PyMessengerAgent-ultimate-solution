# Render手動デプロイ手順（ビルド分数制限回避）

## 🚀 今すぐ手動デプロイする方法

### ステップ1: Renderダッシュボードにログイン
1. https://dashboard.render.com にアクセス
2. ログイン

### ステップ2: サービスを選択
1. `PyMessengerAgent-ultimate-solution` をクリック

### ステップ3: 手動デプロイ実行
1. 右上の **「Manual Deploy」** ボタンをクリック
2. ドロップダウンから **「Deploy latest commit」** を選択
3. コミット `5758088` を確認
4. **「Deploy」** をクリック

### ステップ4: ビルドログ確認
1. 「Events」タブでビルド進行状況を確認
2. 約3-5分でデプロイ完了

---

## 🔧 自動デプロイを一時的に無効化

### 設定変更手順
1. Renderダッシュボード → Settings
2. **Build & Deploy** セクション
3. **Auto-Deploy** を **「No」** に設定
4. **「Save Changes」**

これで毎回のプッシュでビルド分数を消費しません。

---

## 📊 ビルド分数の確認

### 使用状況チェック
1. Renderダッシュボード → **Billing**
2. **Usage** タブ
3. 以下を確認：
   - Used Build Minutes: XX/2,000
   - Reset Date: 毎月1日
   - Current Period: 9/1 - 9/30

---

## 💡 ビルド分数を節約する設定

### render.yaml を最適化
```yaml
services:
  - type: web
    name: pymessenger-agent
    env: node
    buildCommand: yarn install --production --frozen-lockfile && yarn build
    startCommand: yarn start
    envVars:
      - key: NODE_ENV
        value: production
      - key: SKIP_BUILD_STATIC_GENERATION
        value: true
```

### 不要なビルドトリガーを削除
1. プルリクエストの自動ビルドを無効化
2. ブランチフィルターを設定（mainのみ）
3. 依存関係の更新を手動化

---

## 🆘 Renderサポートへの連絡テンプレート

```
Subject: Professional Plan - Build Minutes Exhausted Issue

Hi Render Support Team,

I'm experiencing an issue with my Professional plan where build minutes are exhausted despite the 2,000-minute limit.

Account Details:
- Plan: Professional ($19/month)
- Service: PyMessengerAgent-ultimate-solution
- Expected: 2,000 build minutes/month
- Issue: "Pipeline minutes exhausted" error

Recent Changes:
- Added yarn.lock to reduce build time
- Build time reduced from 10min to 3min
- Still getting blocked

Could you please:
1. Check my actual usage breakdown
2. Reset or provide additional minutes for this month
3. Investigate any account/billing issues

Thank you for your assistance.

Best regards,
[Your Name]
```

メール送信先: support@render.com

---

## 🔄 代替デプロイ方法

### GitHub Actions経由でデプロイ
```yaml
# .github/workflows/deploy.yml
name: Deploy to Render
on:
  workflow_dispatch:
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Render
        run: |
          curl -X POST \
            https://api.render.com/v1/services/${{ secrets.RENDER_SERVICE_ID }}/deploys \
            -H "Authorization: Bearer ${{ secrets.RENDER_API_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{"clearCache": false}'
```

これで手動でGitHub Actionsからデプロイ可能。