# 推し活グッズ管理アプリ DESIGN.md

このファイルは、推し活グッズ管理アプリの UI を一貫して実装するためのデザインシステム定義です。  
AI エージェント・開発者・デザイナーが同じ基準で画面を作れるよう、公式 DESIGN.md の構成（Colors / Typography / Spacing / Components / Elevation / Guidelines）に合わせて定義します。

## Product Context

- **対象ユーザー**: 10代〜30代女性（日本の推し活ユーザー）
- **体験の目的**: グッズ管理を効率化しつつ、推し活らしい気分の上がる見た目を維持する
- **利用シーン**: 外出先でのスマホ片手操作を基本とする
- **技術前提**: Dash + dash-bootstrap-components + Bootswatch + Bootstrap Icons
- **テーマ方針**: Bootswatch テーマは全件選択可能
- **可愛らしさの表現**: 色の固定ではなく、角丸・ボタン形状・影（Elevation）で表現する

| 公式セクション | このアプリで主に扱う内容 |
|---|---|
| Colors | テーマ依存のセマンティックカラー、推し色アクセント |
| Typography | 日本語可読性を優先した文字階層 |
| Spacing | スマホ優先の余白・タップ領域 |
| Components | 登録フロー、ギャラリー、設定で使う共通部品 |
| Elevation | ライト/ダーク両対応の影と奥行き |
| Guidelines | Do/Don't、視認性チェック、運用ルール |

## Colors

### 1) 基本方針

- 色は原則として **テーマ変数依存** にする
- 固定 hex の直接指定は最小限（ブランド記号・状態色など）に限定する
- 推し色は「面全体」より **アクセント用途** を優先する
- **画面背景とカード面は必ず視覚的に分離**する（同色で一体化させない）
- 主要情報カードは **色付きカード（primary/secondary/info/success/warning/danger）** を基本とする

### 2) セマンティックトークン

以下は DESIGN 上の意味トークン名。実装時は Bootswatch/Bootstrap 変数へマッピングする。

| トークン | 用途 |
|---|---|
| `color-bg` | 画面背景 |
| `color-surface` | カード、パネル、モーダル面 |
| `color-text-primary` | 主本文 |
| `color-text-secondary` | 補助文 |
| `color-border` | 枠線、区切り線 |
| `color-primary` | 主要アクション |
| `color-primary-contrast` | 主要ボタン上の文字色 |
| `color-accent-oshi` | 推し色アクセント（バッジ、タグ、小面積強調） |
| `color-success` | 成功状態 |
| `color-warning` | 注意状態 |
| `color-danger` | 破壊的操作・エラー |
| `card-primary-bg` | 主要カード背景（`color-primary` 相当） |
| `card-primary-text` | 主要カード文字色（`color-primary-contrast` 相当） |
| `card-primary-border` | 主要カード境界色 |
| `card-secondary-bg` | 補助カード背景（`color-secondary` 相当） |
| `card-secondary-text` | 補助カード文字色（**本文色**。Bootstrap の `card bg-secondary` と同様に `text-white` は付けない） |
| `card-warning-text` | 注意カード文字色（原則は白文字。可読性が足りないテーマでは濃色へ切替可） |
| `card-info-bg` | 情報カード背景 |
| `card-success-bg` | 成功カード背景 |
| `card-warning-bg` | 注意カード背景 |
| `card-danger-bg` | 危険カード背景 |

### 2.1) 実装補助トークン（CSSで直接使う想定）

| トークン | 目安値/参照 | 用途 |
|---|---|---|
| `surface-border-default` | `1px solid color-border` | カード・入力・区切りの基本境界 |
| `surface-shadow-1` | `0 2px 8px` 相当 | 日常カードの影 |
| `surface-shadow-2` | `0 8px 24px` 相当 | モーダル・重なり要素の影 |
| `focus-ring-color` | `color-primary` 由来 | キーボードフォーカスの可視化 |
| `focus-ring-width` | `2px` | フォーカスリングの太さ |
| `interactive-hover-bg` | `color-surface` より僅かに濃淡差 | Hover時の面変化 |
| `interactive-active-scale` | `0.98` | 押下感の統一 |
| `input-bg` | Bootstrap `--bs-body-bg`（または入力専用に `--bs-secondary-bg`） | 入力欄の面。カード面上では `color-surface` と同色近傍でもよいが、**文字との差**を優先 |
| `input-text` | Bootstrap `--bs-body-color` | **入力値（typed text）**の色。本文と同等のコントラストを確保する |
| `input-placeholder` | Bootstrap `--bs-secondary-color` 相当 | プレースホルダー。**入力値より弱い階層**にしつつ、背景上で判読できること |
| `input-caret` | 原則 `input-text` と同系（`caret-color`） | キャレットが背景に埋もれないこと |

### 2.3) 色付きカードのセット運用ルール

- 背景色トークン（`card-*-bg`）を使う場合は、**対応する文字色トークンも必ずセット**で適用する
- 主要カードは次の優先順で利用する
  1. `card-primary-*`（最重要情報）
  2. `card-secondary-*`（補助情報）
  3. `card-info/success/warning/danger`（状態付き情報）
- **Bootstrap の色付きカード例との対応（意味の一致）**  
  Dash では `card-main-*` クラスで再現する。`bg-*` だけ・文字色なしの運用は禁止（既存の Don't も参照）。

| Bootstrap 例（意味） | アプリのクラス | 文字色の方針 |
|---|---|---|
| `text-white bg-primary` など強い面色 | `card-main-primary` / `info` / `success` / `danger` | 白系（コントラスト用の on-color） |
| `bg-secondary`（`text-white` なし＝薄い補助面） | `card-main-secondary` | **本文色**（薄い面上に白文字を置かない） |
| `text-white bg-warning` | `card-main-warning` | 原則は白系。テーマでコントラスト不足なら濃色文字へ切替可 |
| `bg-light` の中立面 | `card-custom`（NeutralCard） | 本文色（色付き主要カードの代替ではなく中立面） |
- `warning` は Bootstrap 例に合わせ **白文字を原則** とする。特定テーマで AA が厳しい場合は、`card-warning-text` を濃色側に寄せる例外を許可する（リリース前 QA で確認）

### 2.2) 背景とカードの分離ルール（必須・数値化）

- `color-bg` と `color-surface` が近いテーマでは、次の 2 つを必須にする
  - `1px` の境界線（`color-border`）
  - カードの最低 Elevation（Level 1）
- 背景は必要に応じて `color-bg` をわずかに着色（オフホワイト寄り）し、白カードとの差を作る
- 「背景白 × カード白」になる場合は、**境界線のみで済ませず**、影か背景トーン差を併用する
- 主要コンテンツカードは、近色テーマ時に `border` なしを禁止する
- 判定基準（簡易）:
  - カード輪郭が 1 秒以内に判別できない場合は不合格
  - `/register/review`, `/gallery`, `/settings` のいずれかで同化したら不合格

### 3) 推し色の使い方

- 推し色は次に限定して使う
  - タグバッジ
  - 選択中インジケータ
  - ボタンの副次アクセント（主ボタン全面には多用しない）
- 推し色を広い背景面へ使う場合は、必ず文字コントラストを確認する

### 4) 視認性目標

- 通常本文は WCAG AA 相当を目標にする（テーマ由来で未達の組み合わせは既知制約として扱う）
- リンク・ボタン・入力欄は背景との差が視認できること
- ダークテーマ時は「境界線 + 影 + ハイライト」を組み合わせ、面の分離を明確にする
- 背景とカードの関係は、初見で「土台」と「情報面」が判別できることを合格条件にする

## Typography

### 1) フォント方針

- 本文は日本語可読性を優先し、システムフォントスタックを基本とする
- 装飾的フォントは使わず、情報量の多い画面で読みやすさを優先する

推奨フォントスタック:
`"Hiragino Kaku Gothic ProN", "Yu Gothic UI", "Yu Gothic", "Meiryo", "Noto Sans JP", sans-serif`

### 2) タイプスケール（rem 基準）

| 用途 | サイズ | ウェイト | 行間 |
|---|---:|---:|---:|
| ページタイトル | 1.5rem | 700 | 1.35 |
| セクション見出し | 1.25rem | 700 | 1.4 |
| カード見出し | 1.125rem | 600 | 1.45 |
| 本文 | 1rem | 400 | 1.6 |
| 補助文・注釈 | 0.875rem | 400 | 1.5 |
| 数値強調（価格等） | 1.125rem | 700 | 1.3 |

### 3) 表記ルール

- 価格・数量など重要数値は太字で視線誘導する
- 補助文は小さくしすぎない（0.875rem 未満は原則禁止）
- 1 行の最大行長はスマホ基準でおおむね 18〜28 文字を目安にする
- カード内の 1 ブロックに詰める情報は原則 6 行以内に収め、超える場合は折りたたみや分割を検討する

## Spacing

### 1) 余白基準

- 基準単位は `8px`
- 余白スケール: `4 / 8 / 12 / 16 / 24 / 32 / 40`
- 余白は偶数単位で統一し、見た目のリズムを崩さない

### 2) レイアウト方針（スマホ優先）

- スマホ縦画面を第一基準に設計する
- 主要操作ボタンは片手操作を想定し、画面下部寄りに配置可能な構成を優先する
- カード間隔は詰めすぎず、誤タップ防止を優先する
- 主要 CTA は可能な限り「画面下 1/3」から到達しやすい位置に配置する
- 破壊的操作（削除等）と主要操作（保存等）は近接配置しない

### 3) タップ領域

- 主要ボタン・入力の最小タップ領域は **44px 以上**
- アイコン単体操作は 40px 以上のヒットエリアを確保する
- 連続する操作ボタン間は最小 `8px` 以上の間隔を確保する

### 4) セーフエリア対応（必須）

- 下部固定ナビ・下部固定 CTA を使う画面では `safe-area-inset-bottom` を考慮する
- 上端に固定要素がある場合は `safe-area-inset-top` を考慮する
- iOS ノッチ端末でも、主要操作が欠けないことを確認する

## Components

### 1) Buttons（可愛らしさの中心）

#### Primary Button
- 用途: 保存、登録、次へ、確定など主要行動
- 形状: 角丸 `12px`
- 高さ: `44px` 以上
- 余白: `0 16px`
- 状態:
  - `default`: `color-primary` 背景
  - `hover`: `interactive-hover-bg` または明度差をつける
  - `active`: `interactive-active-scale` を適用
  - `focus-visible`: `focus-ring-width` + `focus-ring-color`
  - `disabled`: コントラストを保ったまま視覚的に非活性化

#### Secondary / Outline Button
- 用途: 補助行動、戻る、再試行
- 形状: 角丸 `12px`
- 枠線で階層を表現する
- 状態:
  - `default`: 面は控えめ、`surface-border-default` を基本
  - `hover`: 背景を薄く変化
  - `focus-visible`: Primary と同じ規格で表示

#### Soft / Ghost Button
- 用途: 軽微な選択、タグ編集、フィルタ
- 形状: 角丸 `999px`（ピル型可）
- 背景は薄い面色を利用し、押下時に面の変化を出す
- 状態:
  - `default`: 装飾を抑える
  - `hover/active`: 形は維持しつつ面変化で反応を示す

### 2) Cards

- 用途: グッズ一覧、詳細サマリー、設定項目
- 形状: 角丸 `16px`
- 内側余白: `16px`
- 境界: 1px ボーダーまたは Elevation Level 1
- 画像カードは情報を詰め込みすぎず、サムネイルを主役にする
- カード種別（優先順）:
  - **PrimarySurfaceCard**: `card-main-primary`（主要情報・導線）
  - **SecondarySurfaceCard**: `card-main-secondary`（補助説明・フィルタ。`bg-secondary` 相当の面色＋**本文色**、白文字は使わない）
  - **NeutralCard**: `card-custom`（入力補助・長文・明細などの例外領域）
- 状態:
  - `default`: `surface-border-default` + `surface-shadow-1`
  - `hover`: Elevation を 1 段上げる（過剰な浮き上がり禁止）
  - `active`: 影を弱めて押下を示す
  - `disabled`: 重要情報の可読性を維持したまま抑制

### 3) Form Controls

- 入力欄は角丸 `12px`
- エラー表示は入力欄直下に表示し、色だけに頼らず文言で説明する
- 必須項目はラベルで明示し、プレースホルダーのみで意味を持たせない
- 入力種別に応じて最適なキーボード（数字・メール等）を使う
- 状態:
  - `default`: `surface-border-default`
  - `focus-visible`: `focus-ring-width` + `focus-ring-color`
  - `error`: `color-danger` の境界 + エラーメッセージ併記
  - `disabled`: 入力不可を明確にしつつ文字可読性を保つ

#### 3.1) 入力文字が確実に表示できる設定（必須）

テーマや親要素の背景が変わっても、**ユーザーが打った文字（入力値）**が読めることを最優先にする。

- **背景と文字は必ずセットで決める**
  - 入力欄の背景は `input-bg`、入力中の文字は `input-text` を正本とする
  - 実装では Bootswatch の **`--bs-body-bg` / `--bs-body-color`** を使うか、親が色付きカード（`card-main-*`）のときは **面と十分なコントラストになる組**を明示する（`bg` だけ変更して `color` を未指定にしない）
- **色付きカード上の入力（dbc.Input / textarea 等）**
  - カードの `card-*-text` と入力文字色が同化しないこと。同化しそうなときは **`input-custom` クラス**（`assets/styles.css`）のように、`background` と `color` をテーマ変数で固定し、境界は `surface-border-default` を用いる
- **プレースホルダー**
  - `input-placeholder` は補助階層とし、**入力値より薄くてよい**が、背景との差が弱すぎて判読できない状態にしない
  - 意味の主担当はラベル・見出しとし、プレースホルダーだけで必須・制約を伝えない（既存ルールと併用）
- **フォントサイズ（スマホ）**
  - 主要入力欄は **16px 以上**を推奨（iOS Safari のフォーカス時の自動ズーム抑制と可読性の両立）
- **ブラウザのオートフィル**
  - 背景が上書きされて文字が薄くなるテーマがあるため、必要な画面では **`-webkit-autofill` 向けの `box-shadow` / `caret-color`** 等で **入力値の色が読める**ことを確認する（共通 CSS に寄せるのが望ましい）
- **Dash / dbc 実装メモ**
  - `dbc.Input` は親の文字色を継承する。色付き面の直下では **`className` で `input-custom` 相当の色指定**、またはラップ要素で `text-body` を切らないよう親子の色関係を設計する
  - `style` で `backgroundColor` / `color` を直接指定する場合も、**両方**をテーマに沿った値にそろえる

### 4) Tags / Badges

- 推し色はタグ・バッジに優先適用する
- テキスト可読性を保つため、背景色が強い場合は濃色文字/白文字を使い分ける

### 5) Navigation

- 下層ページの戻る導線を明確にする
- アイコンは Bootstrap Icons のみ使用し、意味が曖昧な場合はラベル併記する

### 6) 画面とコンポーネントの対応

| 画面領域 | 主要コンポーネント | デザイン注力点 |
|---|---|---|
| 登録フロー（/register/*） | Primary/Secondary Button、Form、Step用カード | 操作優先、押し間違い防止、ローディング時の状態明確化 |
| ギャラリー（/gallery, /gallery/detail） | 画像カード、タグバッジ、戻るナビ | サムネ主役、情報過密を避ける、一覧と詳細の連続性 |
| 設定（/settings/*） | リストカード、トグル/選択UI、補助説明テキスト | テーマ変更時の可読性維持、誤操作を避ける導線 |

### 7) 外出先利用を前提にした状態設計

- 通信不安定時:
  - 読み込み中は処理中の意味が分かる文言を表示する
  - 失敗時は「再試行」導線を必ず表示する
- オフライン/低速時:
  - 保存不可状態を明示し、入力内容が失われない導線を優先する
- カメラ/アップロード時:
  - 権限拒否時の再許可導線を表示する
  - 撮影失敗・アップロード失敗時は即時再試行を可能にする
  - 画像取得不可でも手入力へ進める導線を保持する

## Elevation

可愛らしさと情報の階層を、影と境界で表現する。

### Level 0（フラット）

- 通常背景
- 影なし

### Level 1（日常カード）

- 用途: 一覧カード、入力グループ
- 例: 軽い影または細い境界線
- 目安: `0 2px 8px` 前後の柔らかい影
- 背景とカードが近色のテーマでは、`1px` 境界線 + Level 1 影をセットで使う
- 実装トークン: `surface-shadow-1`

### Level 2（注目・重なり）

- 用途: モーダル、重要アクション周辺、浮いた操作要素
- 目安: `0 8px 24px` 前後の影
- 実装トークン: `surface-shadow-2`

### ダークテーマでの「怪しい可愛さ」

- 影を強くしすぎず、次を組み合わせる
  - 薄い外側グロー
  - 細いハイライト枠
  - 面の明暗差
- 色相を増やしすぎず、形と光で雰囲気を作る

## Guidelines

### Design Principles

1. 写真とグッズ情報を主役にする  
2. テーマ差を尊重しつつ、可読性を最優先にする  
3. 可愛らしさは形・ボタン・影で一貫して表現する  
4. 情報密度よりも誤操作防止と視線誘導を優先する  

### Do

- セマンティックトークン経由で色を使う
- 角丸・余白・影の規則を守る
- 主要情報カードは `card-main-*` 系を優先し、`card-custom` は例外用途に限定する
- テーマ切替後に主要画面（登録/ギャラリー/設定）を必ず確認する
- 文字コントラストとタップ領域をチェックする
- 入力欄では **`input-bg` + `input-text`**（実装では `body-bg` + `body-color` 等）をセットで指定し、テーマ切替後も**打鍵中の文字**が読めることを確認する
- 背景とカードの分離（トーン差 / 境界線 / 影）を毎画面で確認する
- 外出先利用を想定し、通信不安定時と権限拒否時の復帰導線を確認する

### Don't

- コンポーネント内に場当たり的な hex を直接埋め込まない
- 可愛さのために過剰な装飾や過度な影を使わない
- 色だけで状態を伝えない
- 小さすぎる文字や狭い操作領域を作らない
- オフラインや低速時に、再試行手段が無い状態を放置しない
- 背景色だけを変えて文字色を調整しない運用をしない（`bg-*` 単独適用禁止）

### Theme QA Checklist

#### A. 可読性

- 本文が読みづらい箇所がないか
- 背景面とカード面が同化していないか（少なくとも境界線または影で分離）
- ダークテーマ時にカード境界が判別できるか
- 推し色が情報可読性を壊していないか
- `card-main-secondary` が薄い `secondary` 面色でも **白文字になっていない**か（`text-muted` 含む）
- 主要フォームで **入力値の文字**が背景・カード面色に埋もれていないか（ライト/ダーク・数テーマで目視）

#### B. 操作性

- 主ボタンと副ボタンの区別が視覚的に明確か
- `focus-visible` が見えるか（キーボード操作で確認）
- 入力欄エラーが色覚差に依存せず理解できるか
- タップ領域が最小値を満たしているか
- 片手操作で主要フロー（`/register/review`）を完了できるか
- セーフエリアで下部 CTA やナビが欠けていないか

#### B-2. 通信・権限

- 低速/通信失敗時に再試行導線が表示されるか
- オフライン想定で入力内容の喪失を防ぐ導線があるか
- カメラ権限拒否時にユーザーが次の行動を選べるか

#### C. 世界観（可愛さの一貫性）

- 角丸スケールが画面内で一貫しているか
- 影の強さが過剰でなく、階層表現として機能しているか
- 色だけでなく形・影・余白で可愛さを表現できているか

## Appendix: 主要URLと優先画面

`file_structure.md` / `spec.md` を基にした、デザイン確認の優先対象。

| 優先度 | URL | 主目的 |
|---|---|---|
| 高 | `/register/select` | 登録分岐の起点。選択ボタン群の視認性・タップ性が重要 |
| 高 | `/register/barcode` | 登録STEP1。入力・再試行・スキップ導線の明確化 |
| 高 | `/register/photo` | 登録STEP2。撮影/アップロード導線、ローディングの安心感 |
| 高 | `/register/review` | 登録STEP3。フォーム可読性、確定操作の安全性 |
| 高 | `/gallery` | 画像一覧の可読性・視線誘導 |
| 中 | `/gallery/detail` | 詳細表示と戻る導線の一貫性 |
| 中 | `/settings` | テーマ変更や設定一覧の理解しやすさ |
| 中 | `/settings/color_tags` | 推し色・タグ操作の見分けやすさ |
| 中 | `/` | 機能導線の入口としての分かりやすさ |
| 低 | `/dashboard` | 情報量の整理、視認性重視の表示設計 |

### Appendix A: 画面ごとの可愛さ強度

| 画面カテゴリ | 強度 | 形・影・余白の方針 |
|---|---|---|
| 登録系（/register/*） | 低〜中 | 迷わない操作優先。角丸は維持しつつ装飾を抑える |
| ギャラリー系（/gallery*） | 高 | カードと余白で魅せる。ホバー時の Elevation で軽い高揚感 |
| 設定系（/settings*） | 低 | 情報優先。視認性と誤操作防止を最優先 |

### Appendix C: カード種別の画面適用

| 画面 | 主要カード | 補助カード | 例外（中立カード） |
|---|---|---|---|
| `/` | `card-main-primary` | `card-main-secondary` | 統計表や長文は `card-custom` 可 |
| `/register/*` | `card-main-primary` | `card-main-info` / `card-main-secondary` | 入力フォーム本体・明細は `card-custom` 可 |
| `/gallery` | `card-main-secondary` | `card-main-info` | サムネイルグリッド本体は中立可 |
| `/settings` | `card-main-secondary` | `card-main-info` | 認証情報・長文説明は中立可 |

### Appendix B: DESIGN token と styles.css 対応

| DESIGNトークン | 主な適用先クラス | 備考 |
|---|---|---|
| `color-surface` | `.card-custom`, `.photo-card`, `.stat-box`, `.theme-card` | カード面の基本色 |
| `surface-border-default` | `.card-custom`, `.theme-card`, `.input-custom` | 近色テーマで必須 |
| `surface-shadow-1` | `.card-custom`, `.photo-card`, `.stat-box` | 日常カードの影 |
| `surface-shadow-2` | `.photo-card:hover`, モーダル系 | 強調時に使用 |
| `focus-ring-color`, `focus-ring-width` | `.input-custom:focus`, ボタン focus-visible | 固定青の直接指定を避ける |
| `input-bg`, `input-text`, `input-placeholder` | `.input-custom`（`background` / `color`） | 入力値の可読性。`var(--bs-body-bg)` / `var(--bs-body-color)` でテーマ追従 |
| `interactive-hover-bg` | `.upload-area:hover`, ボタン hover | 面変化の統一 |
| `card-primary-bg/card-primary-text` | `.card-main-primary` | 主要カードの基本セット |
| `card-secondary-bg/card-secondary-text` | `.card-main-secondary` | 補助カード（面色は `secondary`、字は本文色） |
| `card-info/success/warning/danger` | `.card-main-info/success/warning/danger` | 状態付きカード（`warning` は原則白文字） |

---

最終更新: 2026-04-18  
バージョン: 1.4
