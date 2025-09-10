# 🔧 トラブルシューティング完全ガイド

## 🚨 エラー別対処法

### 1. ビルドエラー

#### ❌ "Cannot find module 'next'"
```bash
# 原因: package-lock.json問題
# 解決:
git rm package-lock.json
git add -A
git commit -m "Remove package-lock.json"
git push origin main
# Renderで再デプロイ
```

#### ❌ "JavaScript heap out of memory"
```bash
# 原因: メモリ不足
# 解決: 環境変数追加
NODE_OPTIONS=--max-old-space-size=900
```

#### ❌ "Build exceeded maximum allowed duration"
```bash
# 原因: ビルド時間超過（Starterなら問題ないはず）
# 解決: 
1. 不要なdevDependencies削除
2. .dockerignoreに追加:
   - node_modules
   - .next
   - .git
```

---

### 2. 起動エラー

#### ❌ "Application failed to respond"
```bash
# 原因1: ポート設定ミス
# 確認: 
PORT環境変数が設定されていないこと（Renderが自動設定）

# 原因2: 起動コマンドミス
# 確認:
startCommand: npm start が正しいか
```

#### ❌ "ECONNREFUSED supabase"
```bash
# 原因: Supabase接続失敗
# チェックリスト:
1. NEXT_PUBLIC_SUPABASE_URL末尾に/がない
2. URLがhttps://で始まっている
3. ANON_KEYが正しくコピーされている
```

#### ❌ "Invalid JWT"
```bash
# 原因: JWT設定ミス
# 解決:
JWT_SECRET=minimum-32-characters-super-secret-key-2024
```

---

### 3. 実行時エラー

#### ❌ ダッシュボードが白い画面
```bash
# 原因: CSR/SSRの問題
# 解決:
1. ブラウザのコンソールを確認
2. Network タブで404を探す
3. 環境変数NEXT_PUBLIC_*が設定されているか確認
```

#### ❌ "Too Many Requests"
```bash
# 原因: レート制限
# 解決:
RATE_LIMIT_MAX_REQUESTS=2000
```

#### ❌ ログインできない
```bash
# 原因: 認証設定ミス
# チェック:
1. Supabase Authenticationが有効
2. ENCRYPTION_KEYが正しい
3. ブラウザのCookieをクリア
```

---

## 🔍 デバッグ手順

### STEP 1: ログ確認
```bash
# Renderダッシュボード → Logs
# 探すキーワード:
- "error"
- "failed"
- "undefined"
- "ECONNREFUSED"
```

### STEP 2: 環境変数確認
```bash
# Renderダッシュボード → Environment
# 確認項目:
- スペースが入っていない
- クォートで囲まれていない
- 値が切れていない
```

### STEP 3: ヘルスチェック
```bash
curl https://your-app.onrender.com/api/health

# 期待: {"status":"ok"}
# エラー: Application error → 環境変数確認
```

---

## 💊 緊急対処法

### 完全にダメな時
```bash
# 1. 一旦無料版に戻す
git checkout ed4452e  # 無料版のコミット
git push origin main --force

# 2. デプロイ確認後、プロ版に戻す
git checkout main
git push origin main --force
```

### 部分的に動かない時
```bash
# 機能を段階的に有効化
ENABLE_ANALYTICS=false
ENABLE_REAL_TIME=false
# 動作確認後、1つずつtrueに
```

---

## 📝 チェックリスト

### ビルド前
- [ ] GitHubに最新版がプッシュされている
- [ ] package.jsonに構文エラーがない
- [ ] render.yamlのplan: starterになっている

### デプロイ前
- [ ] 必須環境変数がすべて設定されている
- [ ] Supabaseプロジェクトが稼働中
- [ ] GitHubとRenderが連携されている

### デプロイ後
- [ ] ビルドログにエラーがない
- [ ] Service is liveと表示されている
- [ ] /api/healthが200を返す
- [ ] ダッシュボードにアクセスできる

---

## 🎯 よくある質問

### Q: デプロイに何分かかる？
**A: 通常3-5分、初回は10分程度**

### Q: メモリはどれくらい使う？
**A: 通常300-500MB、ピーク時700MB**

### Q: エラーログはどこ？
**A: Renderダッシュボード → Logs → Filter: error**

### Q: 無料版に戻したい
**A: 可能。ただし機能制限あり**

---

## 🚀 成功の秘訣

### やるべきこと
1. **ログを必ず見る**
2. **エラーメッセージを読む**
3. **1つずつ確認する**

### やってはいけないこと
1. **適当に環境変数を設定**
2. **エラーを無視して進める**
3. **複数の変更を同時に行う**

---

## 📞 それでもダメなら

### 最終手段
1. すべての環境変数を削除
2. 必須変数だけ設定
3. 段階的に追加

### サポート
- Render Status: https://status.render.com
- Supabase Status: https://status.supabase.com

---

⚠️ **重要**: 90%の問題は環境変数の設定ミスです。落ち着いて1つずつ確認してください。