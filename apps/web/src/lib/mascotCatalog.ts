/**
 * マスコットカタログ（docs/design/meta/mascots.json と揃える）。
 * グッズ DB の character とは別。
 *
 * フォルダ規約:
 * - こねこ/おとなあり: `<character>/{kit|adult}/scenes/`、部品は当面 `kit/parts/`
 * - 単系統: `<character>/scenes/` + `parts/`
 */

export const MASCOT_ASSET_ROOT = "/brand/mascots";

export const MASCOT_POSE_IDS = [
  "idle",
  "loading",
  "not_found",
  "celebrate",
] as const;

export type MascotPoseId = (typeof MASCOT_POSE_IDS)[number];

/** キャラ ID（none 除く） */
export const MASCOT_CHARACTER_IDS = [
  "kaze_neko",
  "kaze_neko_adult",
  "calico",
  "calico_adult",
  "scottish_fold",
  "scottish_fold_adult",
  "shiba",
  "shiba_adult",
  "pomeranian",
  "pomeranian_adult",
  "shimaenaga",
  "jellyfish",
  "bluebird",
] as const;

export type MascotCharacterId = (typeof MASCOT_CHARACTER_IDS)[number];

/** 設定で選べる値（キャラ無し含む） */
export const MASCOT_IDS = ["none", ...MASCOT_CHARACTER_IDS] as const;

export type MascotId = (typeof MASCOT_IDS)[number];

export const DEFAULT_MASCOT_ID: MascotId = "kaze_neko";

/** 旧 ID → 現行（端末に残った値の救済） */
const LEGACY_MASCOT_MAP: Record<string, MascotId> = {
  cat: "calico",
  dog: "shiba",
};

export type MascotAgeLine = "kit" | "adult" | "single";

export type MascotSceneLayout = "scenes";

export type MascotCatalogItem = {
  id: MascotCharacterId;
  name_ja: string;
  name_en: string;
  /** 公開パス上のキャラ根（例: kaze_neko） */
  character_folder: string;
  age_line: MascotAgeLine;
  scene_layout: MascotSceneLayout;
  parts_ready: boolean;
  scenes_ready: boolean;
  signature_part: string;
  done_part: string;
  preview_pose: MascotPoseId;
};

function ageItem(
  id: MascotCharacterId,
  character_folder: string,
  age_line: "kit" | "adult",
  name_ja: string,
  name_en: string,
  signature_part: string,
  done_part: string,
): MascotCatalogItem {
  return {
    id,
    name_ja,
    name_en,
    character_folder,
    age_line,
    scene_layout: "scenes",
    parts_ready: true,
    scenes_ready: true,
    signature_part,
    done_part,
    preview_pose: "idle",
  };
}

function singleItem(
  id: MascotCharacterId,
  character_folder: string,
  name_ja: string,
  name_en: string,
  signature_part: string,
  done_part: string,
): MascotCatalogItem {
  return {
    id,
    name_ja,
    name_en,
    character_folder,
    age_line: "single",
    scene_layout: "scenes",
    parts_ready: true,
    scenes_ready: true,
    signature_part,
    done_part,
    preview_pose: "idle",
  };
}

export const MASCOT_CATALOG: readonly MascotCatalogItem[] = [
  ageItem(
    "kaze_neko",
    "kaze_neko",
    "kit",
    "風ねこ（こねこ）",
    "Kaze Neko (kit)",
    "yarn_ball.png",
    "paw.png",
  ),
  ageItem(
    "kaze_neko_adult",
    "kaze_neko",
    "adult",
    "風ねこ（おとな）",
    "Kaze Neko (adult)",
    "yarn_ball.png",
    "paw.png",
  ),
  ageItem(
    "calico",
    "calico",
    "kit",
    "三毛猫（こねこ）",
    "Calico (kit)",
    "bell.png",
    "paw.png",
  ),
  ageItem(
    "calico_adult",
    "calico",
    "adult",
    "三毛猫（おとな）",
    "Calico (adult)",
    "bell.png",
    "paw.png",
  ),
  ageItem(
    "scottish_fold",
    "scottish_fold",
    "kit",
    "スコ（こねこ）",
    "Scottish Fold (kit)",
    "yarn_ball.png",
    "paw.png",
  ),
  ageItem(
    "scottish_fold_adult",
    "scottish_fold",
    "adult",
    "スコ（おとな）",
    "Scottish Fold (adult)",
    "yarn_ball.png",
    "paw.png",
  ),
  ageItem(
    "shiba",
    "shiba",
    "kit",
    "柴犬（こねこ）",
    "Shiba (pup)",
    "ball.png",
    "paw.png",
  ),
  ageItem(
    "shiba_adult",
    "shiba",
    "adult",
    "柴犬（おとな）",
    "Shiba (adult)",
    "ball.png",
    "paw.png",
  ),
  ageItem(
    "pomeranian",
    "pomeranian",
    "kit",
    "ポメ（こねこ）",
    "Pomeranian (pup)",
    "ball.png",
    "paw.png",
  ),
  ageItem(
    "pomeranian_adult",
    "pomeranian",
    "adult",
    "ポメ（おとな）",
    "Pomeranian (adult)",
    "ball.png",
    "paw.png",
  ),
  singleItem(
    "shimaenaga",
    "shimaenaga",
    "シマエナガ",
    "Shimaenaga",
    "seed.png",
    "fluff.png",
  ),
  singleItem(
    "jellyfish",
    "jellyfish",
    "くらげ",
    "Jellyfish",
    "bubble.png",
    "bubble_pop.png",
  ),
  singleItem(
    "bluebird",
    "bluebird",
    "幸せの青い鳥",
    "Bluebird",
    "feather.png",
    "letter.png",
  ),
] as const;

const CHARACTER_SET = new Set<string>(MASCOT_CHARACTER_IDS);
const ID_SET = new Set<string>(MASCOT_IDS);

export function isMascotId(value: string): value is MascotId {
  return ID_SET.has(value);
}

export function sanitizeMascotId(raw: unknown): MascotId {
  if (typeof raw !== "string") return DEFAULT_MASCOT_ID;
  const v = raw.trim();
  if (LEGACY_MASCOT_MAP[v]) return LEGACY_MASCOT_MAP[v];
  return isMascotId(v) ? v : DEFAULT_MASCOT_ID;
}

export function getMascotCatalogItem(
  id: MascotId,
): MascotCatalogItem | null {
  if (id === "none") return null;
  return MASCOT_CATALOG.find((item) => item.id === id) ?? null;
}

/** scenes の公開ディレクトリ（末尾スラッシュなし） */
export function mascotScenesDir(id: MascotId): string | null {
  const item = getMascotCatalogItem(id);
  if (!item) return null;
  if (item.age_line === "single") {
    return `${MASCOT_ASSET_ROOT}/${item.character_folder}/scenes`;
  }
  return `${MASCOT_ASSET_ROOT}/${item.character_folder}/${item.age_line}/scenes`;
}

/**
 * parts の公開ディレクトリ。おとな版も当面 kit/parts を共有。
 */
export function mascotPartsDir(id: MascotId): string | null {
  const item = getMascotCatalogItem(id);
  if (!item) return null;
  if (item.age_line === "single") {
    return `${MASCOT_ASSET_ROOT}/${item.character_folder}/parts`;
  }
  return `${MASCOT_ASSET_ROOT}/${item.character_folder}/kit/parts`;
}

/**
 * 場面イラストの公開 URL。none または未知は null。
 */
export function mascotSceneUrl(
  id: MascotId,
  pose: MascotPoseId = "idle",
): string | null {
  if (id === "none" || !CHARACTER_SET.has(id)) return null;
  const dir = mascotScenesDir(id);
  if (!dir) return null;
  return `${dir}/${pose}.png`;
}

/** parts 配下の公開 URL。none は null。 */
export function mascotPartUrl(
  id: MascotId,
  file: string,
): string | null {
  if (id === "none" || !CHARACTER_SET.has(id)) return null;
  const dir = mascotPartsDir(id);
  if (!dir) return null;
  const safe = file.replace(/^\/+/, "").replace(/\.\./g, "");
  return `${dir}/${safe}`;
}

/** シグネチャ小物（バーノブ等） */
export function mascotSignaturePartUrl(id: MascotId): string | null {
  const item = getMascotCatalogItem(id);
  if (!item) return null;
  return mascotPartUrl(id, item.signature_part);
}

/** 完了ワンショット部品 */
export function mascotDonePartUrl(id: MascotId): string | null {
  const item = getMascotCatalogItem(id);
  if (!item) return null;
  return mascotPartUrl(id, item.done_part);
}

/** 風ねこ（こねこ）loading 連番。他は単一 loading。 */
export function mascotLoadingFrameUrls(id: MascotId): string[] {
  if (id === "none") return [];
  if (id === "kaze_neko") {
    const dir = mascotScenesDir(id);
    if (!dir) return [];
    return [1, 2, 3].map((n) => `${dir}/loading_0${n}.png`);
  }
  const single = mascotSceneUrl(id, "loading");
  return single ? [single] : [];
}
