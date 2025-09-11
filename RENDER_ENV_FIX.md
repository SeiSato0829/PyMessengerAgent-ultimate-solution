# Render.com 環境変数設定 - 完全修正ガイド

## 問題の根本原因
Render.comで環境変数が反映されない理由：
1. **ビルド時キャッシュ** - 古いビルドキャッシュが残っている
2. **環境変数のタイミング** - `NEXT_PUBLIC_*`変数はビルド時に必要
3. **設定の反映遅延** - 環境変数変更後、再デプロイが必要

## 完全修正手順

### ステップ1: 環境変数の設定確認
Render.comダッシュボードで：
1. **Environment** タブを開く
2. 以下の変数が設定されているか確認：
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-actual-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
3. **Save Changes** をクリック

### ステップ2: ビルドキャッシュのクリア
1. **Settings** タブへ移動
2. **Build & Deploy** セクション
3. **Clear build cache and deploy** ボタンをクリック

### ステップ3: 強制的な再デプロイ
以下のコマンドをローカルで実行：
```bash
# ダミーコミットを作成して強制デプロイ
git add .
git commit -m "Force rebuild with environment variables"
git push origin main
```

### ステップ4: ビルドログの確認
デプロイ中のログで以下を確認：
```
============================================================
Next.js Config - 環境変数状態:
NEXT_PUBLIC_SUPABASE_URL: ✅ 設定済み
NEXT_PUBLIC_SUPABASE_ANON_KEY: ✅ 設定済み
============================================================
```

## トラブルシューティング

### まだ`xxxxx.supabase.co`エラーが出る場合
1. **Manual Deploy** → **Clear cache and deploy** を実行
2. 環境変数の値に改行や余分なスペースがないか確認
3. 環境変数の値全体をコピーし直して再設定

### 環境変数検証スクリプトのエラー
ビルドログに以下が表示される場合：
```
❌ NEXT_PUBLIC_SUPABASE_URL: 未設定
```
→ Render.comの環境変数設定画面で再度設定し、Save Changesを忘れずに

### デバッグ用コマンド
ローカルでテスト：
```bash
export NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
export NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key-here
npm run build
```

## 重要な注意点
- 環境変数変更後は**必ず**再デプロイが必要
- `NEXT_PUBLIC_*`はビルド時に静的に埋め込まれる
- ランタイムでの変更は反映されない
- キャッシュクリアが最も重要