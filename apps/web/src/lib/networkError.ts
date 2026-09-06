/**
 * オフライン／電波弱の推定（ブラウザの TypeError / onLine）。
 * 実行: node --experimental-strip-types --test apps/web/src/lib/networkError.test.ts
 */

export function isLikelyOfflineError(error: unknown): boolean {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return true;
  }
  if (!(error instanceof Error)) return false;
  const name = error.name.toLowerCase();
  const message = error.message.toLowerCase();
  if (name === "typeerror") {
    return (
      message.includes("fetch") ||
      message.includes("network") ||
      message.includes("failed") ||
      message.includes("load")
    );
  }
  return (
    message.includes("failed to fetch") ||
    message.includes("networkerror") ||
    message.includes("network request failed") ||
    message.includes("load failed")
  );
}

export function networkUserMessage(
  error: unknown,
  copy: { offline: string; fallback: string },
): string {
  if (isLikelyOfflineError(error)) return copy.offline;
  if (error instanceof Error && error.message.trim()) return error.message;
  return copy.fallback;
}
