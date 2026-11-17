/**
 * Render Free API のコールドスタート対策（認証直後に GET /health）。
 *
 * **有料の常時起動プランに上げたら:**
 * - `NEXT_PUBLIC_API_WAKE_ON_AUTH=0` にするか、本モジュール呼び出しを削除する
 * - 手順は `docs/deploy/README.md`（API 起床）を正とする
 */

/** packages/shared の API_PATHS.health と同じ（node:test で workspace 解決しない） */
const HEALTH_PATH = "/health";

/** 待ち UI を出すまでの遅延。起きているときはこれ未満で終わる想定。 */
export const API_WAKE_OVERLAY_DELAY_MS = 400;

/** スリープ明け待ちの上限（Render Free の起き上がり目安）。 */
export const API_WAKE_MAX_MS = 60_000;

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

/** 経過が遅延以上ならオーバーレイを出す。 */
export function shouldShowApiWakeOverlay(
  elapsedMs: number,
  delayMs: number = API_WAKE_OVERLAY_DELAY_MS,
): boolean {
  return elapsedMs >= delayMs;
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

export type WaitForApiReadyOptions = {
  /** 全体の上限。既定 API_WAKE_MAX_MS */
  maxMs?: number;
  /** 1 回の /health タイムアウト */
  attemptTimeoutMs?: number;
  /** 失敗後の再試行間隔 */
  intervalMs?: number;
  apiBase?: string;
  enabled?: boolean;
  fetchImpl?: typeof fetch;
  /** テスト用の sleep */
  sleepImpl?: (ms: number) => Promise<void>;
};

export type WaitForApiReadyResult = {
  ready: boolean;
  elapsedMs: number;
  attempts: number;
};

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * API を起こす。失敗しても投げない（ログイン自体は止めない）。
 */
export async function wakeApi(options: WakeOptions = {}): Promise<void> {
  const enabled = options.enabled ?? shouldWakeApiOnAuth();
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

/**
 * /health が成功するまで待つ。有料化（enabled=false）や URL 未設定は即 ready。
 * 失敗しても投げない（呼び出し側で ready を見る）。
 */
export async function waitForApiReady(
  options: WaitForApiReadyOptions = {},
): Promise<WaitForApiReadyResult> {
  const started = Date.now();
  const enabled = options.enabled ?? shouldWakeApiOnAuth();
  if (!enabled) {
    return { ready: true, elapsedMs: 0, attempts: 0 };
  }

  const url = wakeApiHealthUrl(
    options.apiBase ?? process.env.NEXT_PUBLIC_API_BASE_URL,
  );
  if (!url) {
    return { ready: true, elapsedMs: 0, attempts: 0 };
  }

  const maxMs = options.maxMs ?? API_WAKE_MAX_MS;
  const attemptTimeoutMs = options.attemptTimeoutMs ?? 8_000;
  const intervalMs = options.intervalMs ?? 1_500;
  const fetchImpl = options.fetchImpl ?? fetch;
  const sleepImpl = options.sleepImpl ?? defaultSleep;

  let attempts = 0;
  while (Date.now() - started < maxMs) {
    attempts += 1;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), attemptTimeoutMs);
    try {
      const res = await fetchImpl(url, {
        method: "GET",
        cache: "no-store",
        signal: ctrl.signal,
      });
      if (res.ok) {
        return {
          ready: true,
          elapsedMs: Date.now() - started,
          attempts,
        };
      }
    } catch {
      /* コールド・タイムアウトは再試行 */
    } finally {
      clearTimeout(timer);
    }

    const remaining = maxMs - (Date.now() - started);
    if (remaining <= 0) break;
    await sleepImpl(Math.min(intervalMs, remaining));
  }

  return {
    ready: false,
    elapsedMs: Date.now() - started,
    attempts,
  };
}
