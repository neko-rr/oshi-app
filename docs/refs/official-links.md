<!-- 更新: 手 — 人が書いて直す。凡例: docs/README.md -->
# 公式ドキュメント索引（索引のみ）

**判断の正本ではない。** 用途ルール（`.cursor/rules/*.mdc`）を先に読む。  
リンク切れ・仕様変更があり得るため、重要な変更の前に skill **`official-docs-first`** で該当ページを開き直す。  
DB 変更時は skill **`db-schema-change`** と [docs/db/security.md](../db/security.md) も読む。

## 認証・JWT・セッション

| 題材 | URL |
|------|-----|
| JWTs | https://supabase.com/docs/guides/auth/jwts |
| Signing Keys | https://supabase.com/docs/guides/auth/signing-keys |
| Sessions | https://supabase.com/docs/guides/auth/sessions |
| Password security | https://supabase.com/docs/guides/auth/password-security |
| Next.js SSR Auth | https://supabase.com/docs/guides/auth/server-side/nextjs |
| Next.js Quickstart | https://supabase.com/docs/guides/getting-started/quickstarts/nextjs |
| API Keys | https://supabase.com/docs/guides/api/api-keys |

## データ・RLS・Storage

| 題材 | URL |
|------|-----|
| Tables | https://supabase.com/docs/guides/database/tables |
| RLS | https://supabase.com/docs/guides/auth/row-level-security |
| Securing your API（GRANT + RLS） | https://supabase.com/docs/guides/api/securing-your-api |
| Database migrations | https://supabase.com/docs/guides/deployment/database-migrations |
| Connecting / pooling | https://supabase.com/docs/guides/database/connecting-to-postgres |
| Storage | https://supabase.com/docs/guides/storage |
| Product security | https://supabase.com/docs/guides/security/product-security |
| Changelog | https://supabase.com/changelog |

## プラットフォーム

| 題材 | URL |
|------|-----|
| Next.js Docs | https://nextjs.org/docs |
| FastAPI | https://fastapi.tiangolo.com/ |
| Expo | https://docs.expo.dev/ |
| Expo + Supabase Tutorial | https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native |
| Supabase Library（UI ブロック） | https://supabase.com/library |

## デプロイ

| 題材 | URL |
|------|-----|
| Render Docs | https://render.com/docs |
| Cloudflare Developers | https://developers.cloudflare.com/ |
| Cloudflare Pages | https://developers.cloudflare.com/pages/ |
| Next.js Deploy | https://nextjs.org/docs/app/getting-started/deploying |

## 外部アシスト（楽天ほか）

判断の正本は公式ページ。実装メモは [docs/migration/v2/assist_external_apis.md](../migration/v2/assist_external_apis.md)。  
**ブログ・二次記事を正にしない。**

| 題材 | URL |
|------|-----|
| 楽天ウェブサービス（トップ） | https://webservice.rakuten.co.jp/ |
| 楽天 Ichiba Item Search API（現行ドキュメント） | https://webservice.rakuten.co.jp/documentation/ichiba-item-search |
| 楽天 Developer Dashboard（アプリ一覧・再登録） | https://webservice.rakuten.co.jp/app/list |
| 楽天ウェブサービス お知らせ（移行案内など） | https://www.tumblr.com/rakuten-webservice/tagged/%E3%81%8A%E7%9F%A5%E3%82%89%E3%81%9B |

## アクセシビリティ・UX

**判断の正本は公式ページ。** 変更前に skill **`design-a11y`** で WebFetch せよ（索引だけを正にするな）。

| 題材 | URL |
|------|-----|
| WCAG 2.2（Recommendation） | https://www.w3.org/TR/WCAG22/ |
| WCAG Overview（バージョン案内） | https://www.w3.org/WAI/standards-guidelines/wcag/ |
| What's New in WCAG 2.2 | https://www.w3.org/WAI/standards-guidelines/wcag/new-in-22/ |
| Understanding Contrast | https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html |
| Focus Visible | https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html |
| Focus Not Obscured (Minimum) | https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html |
| Target Size (Minimum) | https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html |
| MDN: Color contrast | https://developer.mozilla.org/en-US/docs/Web/Accessibility/Understanding_WCAG/Perceivable/Color_contrast |
| MDN: prefers-reduced-motion | https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion |
| Use of Color（色だけに依存しない） | https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html |
| Chrome: CVD シミュレーション解説 | https://developer.chrome.com/docs/chromium/cvd |
| Apple HIG（モバイル参考） | https://developer.apple.com/design/human-interface-guidelines/accessibility |
| Material a11y（参考） | https://m3.material.io/foundations/accessibility/overview |

プロジェクト要約: [docs/design/a11y.md](../design/a11y.md)

## 対応ルール

| 索引の塊 | 用途ルール / skill |
|----------|-------------------|
| 認証・JWT | `auth.mdc` + `security.mdc` + `official-docs-first` |
| データ・RLS | `database.mdc` + `db-schema-change` + `docs/db/security.md` |
| プラットフォーム | `platform.mdc` / `mobile.mdc` |
| デプロイ | `deploy.mdc` |
| 外部アシスト（楽天） | `docs/migration/v2/assist_external_apis.md` + `official-docs-first` |
| Library UI | `supabase-library.mdc` |
| アクセシビリティ・UX | `design.mdc` + **`design-a11y`** + `docs/design/a11y.md` |
