# 📘 Render新規プロジェクト作成 - ゼロから完全ガイド

## 🎯 前提条件チェック
- [ ] GitHubアカウント持っている
- [ ] Renderアカウント作成済み（Starter $7登録済み）
- [ ] リポジトリ: https://github.com/SeiSato0829/PyMessengerAgent-ultimate-solution

---

## 📝 STEP 1: Renderダッシュボードにログイン

### 1-1. アクセス
```
https://dashboard.render.com
```

### 1-2. ログイン
- Email/Password または
- GitHub連携でログイン（推奨）

---

## 🆕 STEP 2: 新規Webサービス作成

### 2-1. New → Web Service
```
1. ダッシュボード右上の「New +」ボタンをクリック
2. ドロップダウンから「Web Service」を選択
```

### 2-2. GitHubリポジトリ接続
```
画面が表示されたら：

1. "Connect a GitHub repository" セクション
2. 「Configure GitHub App」をクリック（初回のみ）
3. GitHubにリダイレクトされる
```

---

## 🔗 STEP 3: GitHub連携設定

### 3-1. GitHub認証
```
1. GitHubにログイン（必要な場合）
2. "Install Render" 画面が表示
3. Repository accessで選択：
   - All repositories（全リポジトリ）
   - Only select repositories（特定のみ）← 推奨
```

### 3-2. リポジトリ選択
```
Only select repositoriesを選んだ場合：
1. "Select repositories" ドロップダウン
2. "PyMessengerAgent-ultimate-solution" を探して選択
3. 緑の「Install」ボタンをクリック
```

---

## 🎮 STEP 4: サービス設定

### 4-1. リポジトリ選択
```
Renderに戻ると：
1. 連携したリポジトリ一覧が表示
2. "PyMessengerAgent-ultimate-solution" の「Connect」をクリック
```

### 4-2. 基本設定入力
```yaml
Name: pymessenger-agent-pro
# ↑ これがURLになる: pymessenger-agent-pro.onrender.com

Region: Oregon (US West)
# ↑ 日本からならOregonが最速

Branch: main
# ↑ デプロイするブランチ

Root Directory: （空欄のまま）
# ↑ リポジトリのルートを使用

Runtime: Node
# ↑ 自動検出されるはず
```

---

## 💰 STEP 5: プラン選択【重要】

### 5-1. Instance Type選択
```
スクロールして "Instance Type" セクション：

❌ Free ($0/month) - 選ばない！
✅ Starter ($7/month) - これを選択！
⭕ Standard ($25/month) - 必要に応じて
⭕ Pro ($85/month) - 大規模な場合
```

### 5-2. Starterプランの確認
```
Starter選択後に表示される内容：
- 1 GB RAM
- 0.5 CPU
- No sleep（常時稼働）
- $7.00/month
```

---

## 🔧 STEP 6: ビルド＆デプロイ設定

### 6-1. Build Command
```bash
# 自動検出されるが、念のため確認：
npm ci && npm run build
```

### 6-2. Start Command
```bash
# 自動検出されるが、念のため確認：
npm start
```

### 6-3. 環境変数（ここで設定 or 後で設定）
```
"Environment Variables" セクション
→ 今は「Add Environment Variable」をスキップしてもOK
→ 後でダッシュボードから追加可能
```

---

## 🚀 STEP 7: サービス作成

### 7-1. Create Web Service
```
画面下部の紫色のボタン：
「Create Web Service」をクリック
```

### 7-2. 初回ビルド開始
```
自動的に：
1. ビルドが開始される
2. Logsタブに切り替わる
3. ビルドログが流れ始める
```

---

## 📊 STEP 8: ビルド監視

### 8-1. ビルドログ確認
```
==> Cloning from https://github.com/...
==> Checking out commit xxx in branch main
==> Detected Node version 18.x
==> Running build command...
```

### 8-2. エラーが出た場合
```
❌ Build failed と表示されたら：
1. ログを確認
2. 多くの場合は環境変数未設定が原因
3. 次のSTEPで環境変数を設定
```

---

## 🔑 STEP 9: 環境変数設定【必須】

### 9-1. Environment タブへ
```
左サイドメニューから：
Environment → Environment Variables
```

### 9-2. 必須環境変数を追加
```bash
# "Add Environment Variable" を1つずつクリックして追加

# Supabase（必須 - あなたの値に変更）
NEXT_PUBLIC_SUPABASE_URL = https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGc...
SUPABASE_SERVICE_KEY = eyJhbGc...

# セキュリティ（このままコピペOK）
ENCRYPTION_KEY = d7f8a9b3c2e1f4g5h6i7j8k9l0m1n2o3p4q5r6s7t8u9v0w1
JWT_SECRET = super-secret-jwt-key-minimum-32-characters-long-2024

# Facebook（一時的にダミー値でOK）
FACEBOOK_APP_ID = temp_app_id
FACEBOOK_APP_SECRET = temp_secret
FACEBOOK_PAGE_ACCESS_TOKEN = temp_token
FACEBOOK_VERIFY_TOKEN = webhook_verify_2024

# パフォーマンス
NODE_OPTIONS = --max-old-space-size=800
```

### 9-3. 保存して再デプロイ
```
1. 「Save Changes」をクリック
2. Manual Deploy → Deploy latest commit
```

---

## ✅ STEP 10: 動作確認

### 10-1. Service URLを確認
```
画面上部に表示される：
https://pymessenger-agent-pro.onrender.com
```

### 10-2. ヘルスチェック
```bash
# ブラウザでアクセス：
https://pymessenger-agent-pro.onrender.com/api/health

# 成功レスポンス：
{"status":"ok","timestamp":"2024-xx-xx"}
```

### 10-3. ダッシュボードアクセス
```
https://pymessenger-agent-pro.onrender.com
→ ログイン画面が表示されれば成功！
```

---

## 🚨 トラブルシューティング

### よくある問題

#### 1. "Build failed"
```bash
# 原因: package.jsonの問題
# 解決: GitHubで最新版を確認
git pull origin main
git push origin main
```

#### 2. "Application failed to respond"
```bash
# 原因: 環境変数未設定
# 解決: 必須環境変数をすべて設定
```

#### 3. "This site can't be reached"
```bash
# 原因: デプロイがまだ完了していない
# 解決: 5分待つ or Logsタブで状況確認
```

---

## 📈 完了後の最適化

### 1. カスタムドメイン設定
```
Settings → Custom Domains
→ あなたのドメインを追加
```

### 2. 自動デプロイ設定
```
Settings → Build & Deploy
→ Auto-Deploy: On（デフォルト）
```

### 3. 通知設定
```
Settings → Notifications
→ Deploy失敗時のEmail通知をON
```

---

## 🎯 チェックリスト

### 作成前
- [ ] GitHubリポジトリ準備OK
- [ ] Renderアカウント作成済み
- [ ] Supabase環境変数準備済み

### 作成中
- [ ] Web Service選択
- [ ] GitHub連携完了
- [ ] Starterプラン選択
- [ ] サービス名入力

### 作成後
- [ ] 環境変数設定完了
- [ ] ビルド成功確認
- [ ] /api/health アクセス可能
- [ ] ダッシュボード表示確認

---

## 💡 プロのコツ

### DO
- ✅ Starterプラン($7)を最初から選択
- ✅ 環境変数は慎重にコピペ
- ✅ ビルドログを必ず確認
- ✅ エラーが出たらログを読む

### DON'T
- ❌ Freeプランで始めない
- ❌ 環境変数に余計なスペースを入れない
- ❌ SUPABASE_URLの末尾に/を付けない
- ❌ エラーを無視して進めない

---

## 📊 時間目安

| ステップ | 所要時間 |
|---------|---------|
| GitHub連携 | 2分 |
| サービス設定 | 3分 |
| 環境変数設定 | 5分 |
| 初回ビルド | 5-7分 |
| 動作確認 | 2分 |
| **合計** | **約20分** |

---

## 🎉 完成！

これで Render Starter プランでの本番環境が稼働開始です！

次のステップ：
1. Supabaseでユーザー作成
2. Facebook Developer設定
3. 本格運用開始

---

⚠️ **最重要ポイント**: 
- 環境変数のSUPABASE設定が最も重要
- コピペミスが90%の失敗原因
- ログを見れば答えがある