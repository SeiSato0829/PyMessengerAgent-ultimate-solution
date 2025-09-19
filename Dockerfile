# Railway用 マルチステージビルド Dockerfile

# ===== ビルドステージ =====
FROM node:18-alpine AS builder

# 作業ディレクトリ設定
WORKDIR /app

# パッケージファイルをコピー
COPY package.json package-lock.json* ./

# 依存関係インストール
RUN npm ci --only=production && \
    npm cache clean --force

# ソースコードをコピー
COPY . .

# 環境変数設定（ビルド時）
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG FACEBOOK_APP_ID
ARG FACEBOOK_APP_SECRET

ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV FACEBOOK_APP_ID=$FACEBOOK_APP_ID
ENV FACEBOOK_APP_SECRET=$FACEBOOK_APP_SECRET

# Next.jsアプリケーションをビルド
RUN npm run build

# ===== 実行ステージ =====
FROM node:18-alpine AS runner

# セキュリティアップデート
RUN apk add --no-cache libc6-compat

# アプリケーション用ユーザー作成
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

WORKDIR /app

# ビルド成果物をコピー（standalone出力を使用）
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# ユーザー切り替え
USER nextjs

# ポート公開
EXPOSE 3000

# 環境変数設定（実行時）
ENV PORT=3000
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Railway環境変数を使用
ENV RAILWAY_ENVIRONMENT=production

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# アプリケーション起動
CMD ["node", "server.js"]