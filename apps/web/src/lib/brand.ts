/**
 * 製品ブランド（ユーザー向け表示名）。
 * リポジトリ／npm 名 `oshi-app` とは別。
 * localStorage / sessionStorage の接頭辞は `oshihaven:`（旧 `oshiapp:` は読まない）。
 */
export const PRODUCT_NAME = "Oshihaven";

/** 公式サイト（取得済みドメイン）。アプリのリンクもこのオリジンを使う */
export const PRODUCT_ORIGIN = "https://oshihaven.com";

/**
 * 検索エンジンへ載せるか。公開日に true へ変える。
 * false のあいだは meta robots と /robots.txt の両方が noindex。
 */
export const SITE_INDEXABLE = false;

/** 仮アイコン・マニフェストの地色（既定テーマの背景に近い。CSS変数は画像に載せられない） */
export const BRAND_MARK_BACKGROUND = "#f6f5f2";
/** 仮アイコンの文字色（既定テーマの文字色に近い） */
export const BRAND_MARK_FOREGROUND = "#37332e";

/** ブラウザ保存キーの接頭辞 */
export const LOCAL_STORAGE_PREFIX = "oshihaven:";

/** 初回描画前スクリプトと hooks で共有する見た目キー */
export const THEME_LOCAL_KEY = `${LOCAL_STORAGE_PREFIX}themeId`;
export const MASCOT_LOCAL_KEY = `${LOCAL_STORAGE_PREFIX}mascotId`;
export const DISPLAY_SETTINGS_LOCAL_KEY = `${LOCAL_STORAGE_PREFIX}displaySettings`;
