# 建設マッチング - 建設業ビジネスマッチングプラットフォーム

建設業に特化した会員制ビジネスマッチングWebサービスです。元請・下請企業のマッチングを促進します。

## 技術スタック

| レイヤー | 技術 |
|---|---|
| フロントエンド | Next.js 14+ (App Router) + TypeScript |
| スタイリング | カスタムCSS Modules（ネイビーグラデーションテーマ） |
| データベース | PostgreSQL via Supabase |
| 認証 | Supabase Auth（招待制登録） |
| リアルタイム | Supabase Realtime（メッセージ） |
| ファイルストレージ | Supabase Storage（ロゴ・工事写真） |
| デプロイ | Vercel + Supabase |

## セットアップ手順

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com) でアカウント作成
2. 新規プロジェクトを作成
3. Project URL と anon key をコピー

### 3. 環境変数の設定

`.env.local` を編集してSupabaseの情報を設定：

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. DBマイグレーションの実行

Supabase Studioの SQL Editor で以下を順番に実行：

1. `supabase/migrations/0001_initial_schema.sql`
2. `supabase/migrations/0002_rls_policies.sql`
3. `supabase/migrations/0003_seed_license_types.sql`
4. `supabase/migrations/0004_seed_prefectures.sql`
5. `supabase/migrations/0005_functions_triggers.sql`

### 5. Supabase Storage バケット作成

Supabase Studio > Storage で `company-assets` バケットを作成し、Public に設定。

### 6. 管理者アカウントの作成

Supabase Studio > Authentication > Users で最初のユーザーを作成し、
`public.users` テーブルの `role` カラムを `admin` に更新。

### 7. 開発サーバーの起動

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) でアプリが起動します。

---

## 主要機能

- **会員制アクセス**: 管理者招待による登録制
- **企業プロフィール**: 建設業許可（29業種）、得意工事、工事実績、求めること
- **マッチングシステム**: いいね → 相互いいねで自動マッチング
- **コンタクトリクエスト**: 承認制のビジネスコンタクト
- **リアルタイムメッセージング**: Supabase Realtime
- **AIレコメンド**: ルールベーススコアリング（役割・業種・地域・規模）
- **管理者ダッシュボード**: 企業・ユーザー・マッチング管理

## ディレクトリ構造

```
src/
├── app/
│   ├── (auth)/          # ログイン・登録・パスワードリセット
│   ├── (app)/           # 会員向けページ
│   │   ├── dashboard/
│   │   ├── companies/
│   │   ├── matches/
│   │   ├── likes/
│   │   ├── contacts/
│   │   ├── messages/
│   │   ├── notifications/
│   │   ├── profile/
│   │   └── settings/
│   ├── (admin)/         # 管理者専用ページ
│   └── api/             # APIルート
├── components/
│   ├── layout/          # Header, Sidebar, MobileNav
│   └── matching/        # LikeButton, ContactButton
└── lib/
    ├── supabase/        # クライアント設定
    ├── constants/       # 業種・都道府県マスタ
    └── utils/           # スコアリング・フォーマット
```

## レコメンドスコアリング

| 項目 | 配点 |
|---|---|
| 役割の相補性（元請↔下請） | 30点 |
| 建設業許可の一致 | 25点 |
| 地域の一致 | 20点 |
| 企業規模の相性 | 15点 |
| 求めること一致 | 10点 |

60点以上→強くおすすめ、40点以上→おすすめ

## デプロイ

### Vercel

```bash
npx vercel
```

環境変数をVercelダッシュボードで設定してください。
