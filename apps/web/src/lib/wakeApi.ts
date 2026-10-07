/**
 * Render Free API のコールドスタート対策（認証直後に GET /health）。
 *
 * **有料の常時起動プランに上げたら:**
 * - `NEXT_PUBLIC_API_WAKE_ON_AUTH=0` にするか、本モジュール呼び出しを削除する
 * - 手順は `docs/deploy/README.md`（API 起床）を正とする
 */

/** packages/shared の API_PATHS.health と同じ（node:test で workspace 解決しない） */
const HEALTH_PATH = "/health";

/** `0` のとき起こししない（有料化後）。未設定・他値は起こす。 */
export function shouldWakeApiOnAuth(
  envValue: string | undefined = process.env.NEXT_PUBLIC_API_WAKE_ON_AUTH,
): boolean {
  return envValue !== "0";
}

/** ベース URL から /health の絶対 URL。未設定・空は null。 */
export function wakeApiHealthUrl(apiBase: string | undefined): string | null {
  const base = apiBase?.trim().replace(/\/$/, "") ?? "";
  if (!base) return null;
  return `${base}${HEALTH_PATH}`;
}

type WakeOptions = {
  /** 待機上限。OAuth callback では短め、ログイン後は待たず fire-and-forget 可 */
  timeoutMs?: number;
  /** テスト用。省略時は NEXT_PUBLIC_API_BASE_URL */
  apiBase?: string;
  /** テスト用。省略時は shouldWakeApiOnAuth() */
  enabled?: boolean;
  fetchImpl?: typeof fetch;
};

/**
 * API を起こす。失敗しても投げない（ログイン自体は止めない）。
 */
export async function wakeApi(options: WakeOptions = {}): Promise<void> {
  const enabled =
    options.enabled ?? shouldWakeApiOnAuth();
  if (!enabled) return;

  const url = wakeApiHealthUrl(
    options.apiBase ?? process.env.NEXT_PUBLIC_API_BASE_URL,
  );
  if (!url) return;

  const timeoutMs = options.timeoutMs ?? 8_000;
  const fetchImpl = options.fetchImpl ?? fetch;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    await fetchImpl(url, {
      method: "GET",
      cache: "no-store",
      signal: ctrl.signal,
    });
  } catch {
    /* コールド中・オフラインは無視 */
  } finally {
    clearTimeout(timer);
  }
}

/** ログイン後など、遷移をブロックしたくないとき */
export function wakeApiInBackground(options: WakeOptions = {}): void {
  void wakeApi(options);
}
