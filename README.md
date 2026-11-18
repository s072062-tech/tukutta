# tukutta

つくったーのアプリ本体（Next.js App Router）。

## ローカル開発（Supabase Local）

開発は **Supabase Local**（DB + Auth + Storage）を使う。本番（Vercel）は Vercel の Environment Variables が指す本番 Supabase のまま（変更しない）。

詳細設計: [../screen_design/UI-Specs/14_supabase-local.md](../screen_design/UI-Specs/14_supabase-local.md)

### 前提

- Docker Desktop 起動済み
- 作業ディレクトリは必ず **`tukutta/`**（`supabase/` もこの配下）

### 手順

```powershell
cd C:\Udemy\org_app\tukutta

# 1. Local スタック起動
npx supabase start
npx supabase status

# 2. .env.local を用意（初回）
#    .env.example をコピーし、Publishable キーを status の値に合わせる
copy .env.example .env.local

# 3. スキーマ反映
npx prisma db push

# 4. アプリ起動
npm run dev
```

- Studio: http://127.0.0.1:54323
- アプリ: http://localhost:3000
- `.env` に本番接続文字列を残さない（誤って Prisma が本番を見ないよう、本番用はリポジトリ外へ退避）
- Cursor のクラウド向け Supabase MCP は本番監視用のまま。Local 操作は CLI / Studio で行う

### Google OAuth（Local）

1. Google Cloud Console の承認済みリダイレクト URI に追加:  
   `http://127.0.0.1:54321/auth/v1/callback`
2. `config.toml` の `[auth.external.google]` は有効済み。再起動時に Client ID / Secret を渡す:

```powershell
cd C:\Udemy\org_app\tukutta
$env:GOOGLE_CLIENT_ID="..."
$env:GOOGLE_CLIENT_SECRET="..."
npx supabase stop
npx supabase start
```

3. http://localhost:3000/login から Google ログインを確認する

### 日常コマンド

| 操作 | コマンド |
| --- | --- |
| 起動 | `npx supabase start` |
| 状態 | `npx supabase status` |
| 停止 | `npx supabase stop` |
| DB 破棄（Local のみ） | `npx supabase db reset` のあと `npx prisma db push` |

## Getting Started（汎用）

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
