/**
 * マスコット選択（端末 localStorage）。
 * サーバー保存は未着手。
 */

import { MASCOT_LOCAL_KEY } from "@/lib/brand";
import {
  DEFAULT_MASCOT_ID,
  sanitizeMascotId,
  type MascotId,
} from "@/lib/mascotCatalog";

export { MASCOT_LOCAL_KEY };

export function readLocalMascotId(): MascotId {
  try {
    if (typeof window === "undefined") return DEFAULT_MASCOT_ID;
    const raw = localStorage.getItem(MASCOT_LOCAL_KEY);
    if (!raw) return DEFAULT_MASCOT_ID;
    return sanitizeMascotId(raw);
  } catch {
    return DEFAULT_MASCOT_ID;
  }
}

export function writeLocalMascotId(id: MascotId): void {
  try {
    if (typeof window === "undefined") return;
    const clean = sanitizeMascotId(id);
    localStorage.setItem(MASCOT_LOCAL_KEY, clean);
  } catch {
    /* ignore */
  }
}

export function applyMascotToDocument(id: MascotId): void {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-mascot", sanitizeMascotId(id));
}
