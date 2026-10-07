/**
 * 404・障害など「感情点」画面のマスコット。
 * ユーザー設定（端末）が読めない／未保存のときは風ねこ（おとな）。
 * サーバー同期は未着手。DB を見られないときも同じフォールバック。
 */

import {
  parseMascotId,
  type MascotId,
  type MascotPoseId,
} from "@/lib/mascotCatalog";

export const UNKNOWN_PREFERENCE_MASCOT_ID: MascotId = "kaze_neko_adult";

export type EmotionalSceneKind = "not_found" | "error";

export function resolveMascotIdForEmotionalScene(
  raw: unknown,
): MascotId {
  return parseMascotId(raw) ?? UNKNOWN_PREFERENCE_MASCOT_ID;
}

export function poseForEmotionalScene(
  kind: EmotionalSceneKind,
): MascotPoseId {
  void kind;
  return "not_found";
}
