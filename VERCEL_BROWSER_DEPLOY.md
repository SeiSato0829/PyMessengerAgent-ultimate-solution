# 🌐 Vercel ブラウザから直接デプロイする方法

## 認証コード方式がうまくいかない場合

### 方法1：GitHubから直接インポート（最も簡単）

1. **Vercelにアクセス**
   https://vercel.com

2. **「Start Deploying」または「New Project」をクリック**

3. **GitHubアカウントでログイン**
   - 「Continue with GitHub」をクリック
   - GitHubの認証を許可

4. **リポジトリをインポート**
   - 「Import Git Repository」
   - `SeiSato0829/PyMessengerAgent-ultimate-solution` を検索
   - 「Import」をクリック

5. **環境変数を設定**（自動で設定される場合もある）
   ```
   FACEBOOK_APP_ID = 1074848747815619
   FACEBOOK_APP_SECRET = ae554f1df345416e5d6d08c22d07685d
   NEXT_PUBLIC_SUPABASE_URL = https://rxipbozxhkzvlekrbjud.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4aXBib3p4aGt6dmxla3JianVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjU2MDg0NzgsImV4cCI6MjA0MTE4NDQ3OH0.vTWRLqpPjUGTH2U0TBRZLM5N3r86O9E6Eq5INIoL7jY
   ```

6. **「Deploy」をクリック**
   - 約2-3分でデプロイ完了

7. **完了！**
   - URLが表示されます
   - 例：`https://pymessenger-agent.vercel.app`

---

### 方法2：ローカルファイルをアップロード

1. **プロジェクトをZIP化**
   ```bash
   # .nextとnode_modulesを除外してZIP作成
   zip -r project.zip . -x ".next/*" -x "node_modules/*"
   ```

2. **Vercelダッシュボード**
   - https://vercel.com/new
   - 「Upload」タブを選択

3. **ZIPファイルをドラッグ&ドロップ**

4. **自動でデプロイ開始**

---

### 方法3：Vercel CLIトークンを手動設定

1. **Vercelダッシュボードでトークン作成**
   - https://vercel.com/account/tokens
   - 「Create Token」
   - トークンをコピー

2. **ターミナルで設定**
   ```bash
   export VERCEL_TOKEN="your-token-here"
   npx vercel --prod --token $VERCEL_TOKEN
   ```

---

## 🎯 最も簡単な方法

**GitHubインポート（方法1）が最速です！**

1. https://vercel.com
2. GitHubでログイン
3. リポジトリを選択
4. Deploy！

3分で完了します。