/**
 * Design Lab 用の文字パック候補。本番6＋旧組み合わせの提案。
 * ライセンスは Google Fonts の SIL OFL のみ。
 */

export type LabFontPackCandidateId =
  | "prod_clean"
  | "prod_soft"
  | "prod_magazine"
  | "prod_readable"
  | "prod_story"
  | "prod_notebook"
  | "alt_clean_noto"
  | "alt_soft_maru"
  | "alt_magazine_gothic"
  | "alt_readable_atkinson"
  | "alt_festival"
  | "alt_geometry";

export type LabFontPackRole = "ui" | "display";

export type LabFontPackCandidate = {
  id: LabFontPackCandidateId;
  name_ja: string;
  intent_ja: string;
  in_production: boolean;
  /** 本番の font_pack 値。提案は置き換え先の意図 */
  production_id:
    | "clean"
    | "soft"
    | "magazine"
    | "readable"
    | "story"
    | "notebook"
    | null;
  role: LabFontPackRole;
  heading_ja: string;
  heading_en: string;
  body_ja: string;
  body_en: string;
  reason_ja: string;
  license: "OFL";
};

export type LabFontPackIntentGroup = {
  id: string;
  title_ja: string;
  hint_ja: string;
  candidate_ids: LabFontPackCandidateId[];
};

export const LAB_FONT_PACK_CANDIDATES: readonly LabFontPackCandidate[] = [
  {
    id: "prod_clean",
    name_ja: "清潔・端が立つ",
    intent_ja: "清潔",
    in_production: true,
    production_id: "clean",
    role: "ui",
    heading_ja: "IBM Plex Sans JP",
    heading_en: "IBM Plex Sans",
    body_ja: "IBM Plex Sans JP",
    body_en: "IBM Plex Sans",
    reason_ja:
      "同じ清潔でも、Plex は字の端と数字が立つ。SaaS既定の汎用ゴシックより「この製品の本文」に見える。長文と価格の相性がよい。",
    license: "OFL",
  },
  {
    id: "alt_clean_noto",
    name_ja: "清潔・汎用ゴシック",
    intent_ja: "清潔",
    in_production: false,
    production_id: "clean",
    role: "ui",
    heading_ja: "Noto Sans JP",
    heading_en: "Plus Jakarta Sans",
    body_ja: "Noto Sans JP",
    body_en: "Plus Jakarta Sans",
    reason_ja:
      "以前の本番。どちらも汎用ゴシックなので「選んだ」感じが薄い。器としては正しいが、他パックと並ぶと差が出にくい。",
    license: "OFL",
  },
  {
    id: "prod_soft",
    name_ja: "やわらか・丸がはっきり",
    intent_ja: "やわらか",
    in_production: true,
    production_id: "soft",
    role: "ui",
    heading_ja: "Kiwi Maru",
    heading_en: "Nunito Sans",
    body_ja: "Noto Sans JP",
    body_en: "Nunito Sans",
    reason_ja:
      "Kiwi Maru は丸みが見出しで一発で分かる。本文は読みやすいゴシックのまま。20代後半の「やさしい」を、子供絵本まで落とさない距離。",
    license: "OFL",
  },
  {
    id: "alt_soft_maru",
    name_ja: "やわらか・UI丸ゴ",
    intent_ja: "やわらか",
    in_production: false,
    production_id: "soft",
    role: "ui",
    heading_ja: "Zen Maru Gothic",
    heading_en: "Nunito Sans",
    body_ja: "Noto Sans JP",
    body_en: "Nunito Sans",
    reason_ja:
      "以前の本番。Zen Maru は丸ゴだが骨格が UI ゴシックに近い。本文が Noto のままなので、清潔との差が画面全体では出にくい。",
    license: "OFL",
  },
  {
    id: "prod_magazine",
    name_ja: "雑誌・見出し明朝",
    intent_ja: "雑誌",
    in_production: true,
    production_id: "magazine",
    role: "display",
    heading_ja: "Kaisei Decol",
    heading_en: "Newsreader",
    body_ja: "Zen Kaku Gothic New",
    body_en: "Figtree",
    reason_ja:
      "本物の雑誌は見出しと本文の書体が違う。Decol＋Newsreader が見出し、Zen Kaku＋Figtree が本文。大人の推し活カタログに近い。",
    license: "OFL",
  },
  {
    id: "alt_magazine_gothic",
    name_ja: "雑誌・ゴシックのみ",
    intent_ja: "雑誌",
    in_production: false,
    production_id: "magazine",
    role: "ui",
    heading_ja: "Zen Kaku Gothic New",
    heading_en: "Figtree",
    body_ja: "Zen Kaku Gothic New",
    body_en: "Figtree",
    reason_ja:
      "以前の本番。見出しも本文も同じゴシック。誌面の対比が無いので、清潔・やわらかの隣ではトーンが潰れやすい。",
    license: "OFL",
  },
  {
    id: "prod_readable",
    name_ja: "読みやすい・字が広い",
    intent_ja: "読みやすい",
    in_production: true,
    production_id: "readable",
    role: "ui",
    heading_ja: "BIZ UDPGothic",
    heading_en: "Lexend",
    body_ja: "BIZ UDPGothic",
    body_en: "Lexend",
    reason_ja:
      "Lexend は読みやすさ用に字幅が広い。BIZ の和文と「詰まりにくい」印象が揃う。一覧・設定の長文向き。飾りにはしない。",
    license: "OFL",
  },
  {
    id: "alt_readable_atkinson",
    name_ja: "読みやすい・Atkinson",
    intent_ja: "読みやすい",
    in_production: false,
    production_id: "readable",
    role: "ui",
    heading_ja: "BIZ UDPGothic",
    heading_en: "Atkinson Hyperlegible",
    body_ja: "BIZ UDPGothic",
    body_en: "Atkinson Hyperlegible",
    reason_ja:
      "以前の本番。意図は正しいが、画面の字サイズでは Atkinson の特徴が小さい。他パックと同サイズで並べると差が薄い。",
    license: "OFL",
  },
  {
    id: "prod_story",
    name_ja: "物語",
    intent_ja: "物語",
    in_production: true,
    production_id: "story",
    role: "display",
    heading_ja: "Shippori Antique",
    heading_en: "Fraunces",
    body_ja: "IBM Plex Sans JP",
    body_en: "IBM Plex Sans",
    reason_ja:
      "見出しだけアンティーク。本文は清潔のままなので、画面の作業性を落とさず情緒だけ足せる。日記・コレクション名に効く。",
    license: "OFL",
  },
  {
    id: "prod_notebook",
    name_ja: "手帳・手書き見出し",
    intent_ja: "手帳",
    in_production: true,
    production_id: "notebook",
    role: "display",
    heading_ja: "Klee One",
    heading_en: "Shantell Sans",
    body_ja: "IBM Plex Sans JP",
    body_en: "IBM Plex Sans",
    reason_ja:
      "まつりほど叫ばず、物語ほど古くない。文具・手帳シールの距離。本文は清潔。手書き本文は設定画面で疲れるので禁止。",
    license: "OFL",
  },
  {
    id: "alt_festival",
    name_ja: "まつり",
    intent_ja: "まつり",
    in_production: false,
    production_id: "notebook",
    role: "display",
    heading_ja: "Dela Gothic One",
    heading_en: "Dela Gothic One",
    body_ja: "IBM Plex Sans JP",
    body_en: "IBM Plex Sans",
    reason_ja:
      "以前の飾り字案。見出しだけ極太ディスプレイ。ライブグッズの熱はあるが、日常の設定・一覧では叫びすぎる。",
    license: "OFL",
  },
  {
    id: "alt_geometry",
    name_ja: "幾何・ファッションUI",
    intent_ja: "幾何",
    in_production: false,
    production_id: null,
    role: "ui",
    heading_ja: "M PLUS 2",
    heading_en: "Outfit",
    body_ja: "M PLUS 2",
    body_en: "Outfit",
    reason_ja:
      "清潔の別解。丸みのない幾何サンセリフで、2020年代のファッションアプリに近い。Plex より「今っぽい器」。数字とナビ向き。",
    license: "OFL",
  },
];

export const LAB_FONT_PACK_INTENT_GROUPS: readonly LabFontPackIntentGroup[] = [
  {
    id: "clean",
    title_ja: "清潔（器）",
    hint_ja: "毎日の一覧・設定。差は「既定に見えるか／選んだ本文に見えるか」。",
    candidate_ids: ["prod_clean", "alt_clean_noto"],
  },
  {
    id: "soft",
    title_ja: "やわらか",
    hint_ja: "見出しの丸みが画面で分かるか。本文は読みやすさを残す。",
    candidate_ids: ["prod_soft", "alt_soft_maru"],
  },
  {
    id: "magazine",
    title_ja: "雑誌",
    hint_ja: "誌面は見出しと本文の書体が違う。同じゴシック同士だと潰れる。",
    candidate_ids: ["prod_magazine", "alt_magazine_gothic"],
  },
  {
    id: "readable",
    title_ja: "読みやすい",
    hint_ja: "小さい字でも「広い／詰まらない」が分かるか。",
    candidate_ids: ["prod_readable", "alt_readable_atkinson"],
  },
  {
    id: "display",
    title_ja: "飾り字（見出しだけ）",
    hint_ja: "本文は清潔のまま。物語／手帳が本番。まつりは提案として残す。",
    candidate_ids: ["prod_story", "prod_notebook", "alt_festival"],
  },
  {
    id: "geometry",
    title_ja: "別軸・幾何",
    hint_ja: "清潔を置き換えるなら Plex 以外の「今っぽい器」。",
    candidate_ids: ["alt_geometry"],
  },
];

const BY_ID = new Map(
  LAB_FONT_PACK_CANDIDATES.map((c) => [c.id, c] as const),
);

export function listLabFontPackCandidates(): LabFontPackCandidate[] {
  return [...LAB_FONT_PACK_CANDIDATES];
}

export function findLabFontPackCandidate(
  id: string,
): LabFontPackCandidate | undefined {
  return BY_ID.get(id as LabFontPackCandidateId);
}
