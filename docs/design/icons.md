<!-- 更新: 手 — 人が書いて直す。凡例: docs/README.md -->
# アイコン

**同じアイコンをアプリ全体で使い回す。** 一覧にないものは使わない（追加はフィードバックループ経由）。

## 原則

| 項目 | 内容 |
|------|------|
| ライブラリ | [lucide-react](https://lucide.dev/)（本リポ標準） |
| ライセンス | **ISC**（商用可。出典: lucide 公式） |
| 追加素材 | 著作権・ライセンスを [icons.md](icons.md) に書いてから一覧へ |
| 禁止 | ランダムな SVG 直書き、出典不明アイコン、絵文字を UI アイコン代わりに |

shadcn はベース。アイコンでブランド差を出しすぎない（**意味が分かる最小限**）。

## 使い方（コード）

**アプリコードは `@/lib/icons` から named import**（`lucide-react` 直 import は ESLint で禁止）。

```tsx
import { Plus, Settings } from "@/lib/icons";
// size / className は Tailwind トークンに合わせる（例: size-4 text-muted-foreground）
<Plus className="size-4 text-muted-foreground" aria-hidden />
```

- 装飾だけのアイコンを増やさない  
- ボタン内アイコン + ラベルは **ラベルを主**（アイコンだけボタンは `aria-label` 必須）

## パフォーマンス（レイテンシー）

| Do | Don't |
|----|-------|
| **`@/lib/icons` から使うアイコンだけ** named import | `import * as Icons from "lucide-react"` |
| **lucide の SVG コンポーネント**（追加 HTTP なし） | UI アイコンを PNG/SVG 画像として大量 lazy load |
| 一覧に載せたアイコンだけ追加 | `react-icons` 等の **巨大セット全体**を別パッケージで抱える |
| 新規は [採用一覧](#採用一覧アプリ共通) → **`meta/icons.json` 追加 + sync** | `public/` にナビ用アイコン PNG を増やす |

**仕組み:** lucide-react はアイコンごとに分割されており、Next.js ビルドは **import した分だけ** バンドルする（tree-shaking）。  
**正本:** `docs/design/meta/icons.json` → `python scripts/sync_design_icons.py` → `apps/web/src/lib/icons.ts` と下表。

### 禁止（ESLint も対象）

- `lucide-react` への **アプリ側** 直 import（`icons.ts` のみ例外）  
- `import *` による lucide 全件読み込み  
- `react-icons` / `@radix-ui/react-icons` など別アイコンセット  

### 画像アイコンが許される例外

- **favicon** / **OG 画像** / **ブランドロゴ**（1〜数点）  
- ユーザー写真（Storage — UI アイコンとは別）

## 採用一覧（アプリ共通）

<!-- AUTO:icons-catalog START — sync_design_icons.py。手編集禁止 -->
| 用途 | lucide 名 | メモ |
|------|-----------|------|
| 追加・登録 | `Plus` | 主 CTA の横は控えめ |
| 設定 | `Settings` | ナビ・設定入口 |
| ギャラリー・写真 | `Image` / `Images` | 一覧・サムネ欠け |
| 検索 | `Search` | 将来 |
| 戻る | `ChevronLeft` | 詳細・フォーム |
| 並び替え | `ChevronUp` / `ChevronDown` | 設定タグ一覧 |
| 閉じる | `X` | モーダル・トースト |
| 保存・完了 | `Check` | 成功フィードバック |
| 警告・エラー | `AlertCircle` | エラー状態 |
| 読込中 | `Loader2` | Loader2 + animate-spin（短時間のみ） |
| 削除 | `Trash2` | destructive 操作のみ |
| バーコード | `ScanBarcode` | 登録フロー |
| タグ・収納 | `Tag` / `MapPin` | タグ・場所 |
| タグ・収納ピッカー | `AlertCircle` / `Archive` / `Award` / `Badge` / `Bed` / `Bird` / `BookMarked` / `BookOpen` / `Bookmark` / `Box` / `BrickWall` / `Briefcase` / `Brush` / `Camera` / `Car` / `Cat` / `Check` / `Cherry` / `ChevronLeft` / `Circle` / `CircleDot` / `Cloud` / `Coffee` / `Crown` / `Dice5` / `Disc` / `Ellipsis` / `FileText` / `Fish` / `Flower2` / `Frame` / `GalleryVertical` / `Gamepad2` / `Gem` / `Gift` / `Glasses` / `Grid3x3` / `HandHeart` / `Headphones` / `Heart` / `Home` / `Image` / `Images` / `Inbox` / `KeyRound` / `Lamp` / `LampDesk` / `Laptop` / `Layers` / `LayoutGrid` / `Library` / `Link` / `Loader2` / `MapPin` / `Medal` / `Mic` / `Mic2` / `Moon` / `Music` / `Music2` / `Newspaper` / `Package` / `Palette` / `PartyPopper` / `Pen` / `Pencil` / `PersonStanding` / `PictureInPicture` / `Pin` / `Plane` / `Plus` / `Puzzle` / `Rabbit` / `Radio` / `Ribbon` / `ScanBarcode` / `Scissors` / `ScrollText` / `Search` / `Settings` / `Shirt` / `ShoppingBag` / `Smartphone` / `Smile` / `Sofa` / `Sparkles` / `Square` / `Star` / `Sticker` / `Store` / `Sun` / `Tag` / `Tags` / `Ticket` / `Train` / `Trash2` / `Trophy` / `Tv` / `Umbrella` / `UserRound` / `Video` / `Wand2` / `Warehouse` / `Watch` / `X` | lucide_icon_picker.json から自動同期 |
<!-- AUTO:icons-catalog END -->

## 追加するとき

1. [feedback/inbox.md](feedback/inbox.md) に要望（または会話）  
2. ライセンス確認 → **`docs/design/meta/icons.json`** の `catalog` に1行追加  
3. `python scripts/sync_design_icons.py`（`icons.ts` と上表を自動更新）  
4. skill `design-feedback` → 承認後 `feedback_items.json` / `decisions.md`  

## 関連

- 部品: [components.md](components.md)  
- a11y: [a11y.md](a11y.md)  
- フィードバック: [feedback/README.md](feedback/README.md)  
- 検査: `pnpm check:design`（`scripts/check_design_compliance.py`）  
