# 📝 Supabase SQL 段階的セットアップ手順

## 🎯 推奨方法：段階的に実行

Supabaseの**SQL Editor**で以下の手順を**1つずつ順番に**実行してください。

---

## Step 1: プロファイルテーブル
**ファイル**: `step1_profiles.sql`

1. SQL Editorを開く
2. `step1_profiles.sql`の内容をコピー＆ペースト
3. **Run**をクリック
4. ✅ **Success. No rows returned** が表示されることを確認

---

## Step 2: Facebookアカウントテーブル
**ファイル**: `step2_facebook_accounts.sql`

1. SQL Editorをクリア（Clear）
2. `step2_facebook_accounts.sql`の内容をコピー＆ペースト
3. **Run**をクリック
4. ✅ **Success. No rows returned** が表示されることを確認

---

## Step 3: タスクテーブル
**ファイル**: `step3_tasks.sql`

1. SQL Editorをクリア
2. `step3_tasks.sql`の内容をコピー＆ペースト
3. **Run**をクリック
4. ✅ **Success. No rows returned** が表示されることを確認

---

## Step 4: ワーカーとログテーブル
**ファイル**: `step4_workers_logs.sql`

1. SQL Editorをクリア
2. `step4_workers_logs.sql`の内容をコピー＆ペースト
3. **Run**をクリック
4. ✅ **Success. No rows returned** が表示されることを確認

---

## Step 5: セキュリティ設定（RLS）
**ファイル**: `step5_security.sql`

1. SQL Editorをクリア
2. `step5_security.sql`の内容をコピー＆ペースト
3. **Run**をクリック
4. ✅ 各ポリシー作成で **Success** が表示されることを確認

⚠️ **注意**: もし「policy already exists」エラーが出た場合は、そのポリシーは既に作成されているので無視してOK

---

## Step 6: インデックス作成
**ファイル**: `step6_indexes.sql`

1. SQL Editorをクリア
2. `step6_indexes.sql`の内容をコピー＆ペースト
3. **Run**をクリック
4. ✅ **Success** が表示されることを確認

---

## Step 7: ビューとトリガー
**ファイル**: `step7_views_triggers.sql`

1. SQL Editorをクリア
2. `step7_views_triggers.sql`の内容をコピー＆ペースト
3. **Run**をクリック
4. ✅ **Success** が表示されることを確認

---

## ✅ 確認方法

すべてのステップが完了したら、以下のSQLを実行してテーブルが作成されたか確認：

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

以下のテーブルが表示されればOK：
- execution_logs
- facebook_accounts
- profiles
- task_statistics (VIEW)
- tasks
- worker_connections

---

## 🚨 エラーが出た場合

### よくあるエラーと対処法

#### 1. "relation already exists"
→ テーブルが既に存在しています。問題ありません。

#### 2. "permission denied"
→ Supabaseダッシュボードの権限を確認してください。

#### 3. "syntax error"
→ SQLを正確にコピーできているか確認してください。

#### 4. "foreign key constraint"
→ テーブルを作成する順番を守ってください（Step1から順番に）。

---

## 📊 ファイル一覧

```
supabase/
├── step1_profiles.sql         # プロファイルテーブル
├── step2_facebook_accounts.sql # Facebookアカウント
├── step3_tasks.sql            # タスク管理
├── step4_workers_logs.sql     # ワーカーとログ
├── step5_security.sql         # RLS設定
├── step6_indexes.sql          # インデックス
└── step7_views_triggers.sql   # ビューとトリガー
```

---

## 次のステップ

データベースセットアップが完了したら：

1. **API Keys**を取得（Settings → API）
2. **.env.local**ファイルを作成
3. **npm run dev**でアプリを起動

成功をお祈りしています！🚀