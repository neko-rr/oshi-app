# Expo モバイルアプリ（Phase 4）

**製品:** Oshihaven（https://oshihaven.com）

Web API と同じ Auth + Bearer を使う。**現時点では配置枠 + デザイン契約の仕組みのみ。**

## デザイン連携（着手時）

1. skill **`design-mobile`** / `official-docs-first`
2. `pnpm sync:design-icons` → `src/lib/icons.ts`（`lucide-react-native`）
3. 依存に `lucide-react-native` を追加してから import
4. トークン名は `docs/design/meta/tokens.json` と揃える（検査は Web CSS: `pnpm check:design-tokens`）
5. 推し色は `docs/design/oshi-accents.md`（カラータグと別）
6. **後回し:** Lab のセーフエリア（ノッチ）線（fb-001）— 画面実装が本番に近くなったら

詳細: `.cursor/rules/mobile.mdc` / `docs/design/README.md`

## アプリから開くリンク

本線は独自スキームではなく **公式URL**（`https://oshihaven.com`）。

| 例 | 用途 |
|----|------|
| `https://oshihaven.com/ja/gallery` | ギャラリー |
| `https://oshihaven.com/ja/register` | 登録 |

ストア公開時に、同じホストへ Universal Links（`apple-app-site-association`）と App Links（`assetlinks.json`）を足す。`oshihaven://` は補助に留め、メールや共有の正にはしない。
