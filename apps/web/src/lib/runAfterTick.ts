/**
 * effect 同期本体での setState を避ける（react-hooks/set-state-in-effect）。
 * クリーンアップでキャンセルする。
 */
export function runAfterTick(fn: () => void): () => void {
  const id = window.setTimeout(fn, 0);
  return () => window.clearTimeout(id);
}
