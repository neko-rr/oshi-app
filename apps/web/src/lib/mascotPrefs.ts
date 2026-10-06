/**
 * マスコット選択（端末 localStorage）。
 * サーバー保存は未着手。
 */

import { MASCOT_LOCAL_KEY } from "@/lib/brand";
import {
  sanitizeMascotId,
  type MascotId,
} from "@/lib/mascotCatalog";

export { MASCOT_LOCAL_KEY };

export function readLocalMascotPreferenceRaw(): string | null {
  try {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(MASCOT_LOCAL_KEY);
  } catch {
    return null;
  }
}

export function readLocalMascotId(): MascotId {
  return sanitizeMascotId(readLocalMascotPreferenceRaw());
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
