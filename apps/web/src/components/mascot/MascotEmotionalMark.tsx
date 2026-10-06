"use client";

import { useEffect, useState } from "react";
import {
  mascotSceneUrl,
  poseForEmotionalScene,
  resolveMascotIdForEmotionalScene,
  UNKNOWN_PREFERENCE_MASCOT_ID,
  type EmotionalSceneKind,
  type MascotId,
} from "@/lib/mascotCatalog";
import { readLocalMascotPreferenceRaw } from "@/lib/mascotPrefs";

type Props = {
  kind: EmotionalSceneKind;
};

/**
 * 404・障害用の場面絵。未選択・読めないときは風ねこ（おとな）。
 * global-error でも使えるよう next/image は使わない。
 */
export function MascotEmotionalMark({ kind }: Props) {
  const [mascotId, setMascotId] = useState<MascotId>(
    UNKNOWN_PREFERENCE_MASCOT_ID,
  );

  useEffect(() => {
    setMascotId(
      resolveMascotIdForEmotionalScene(readLocalMascotPreferenceRaw()),
    );
  }, []);

  const src = mascotSceneUrl(mascotId, poseForEmotionalScene(kind));
  if (!src) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element -- 障害画面でも描画できるよう素の img
    <img
      src={src}
      alt=""
      width={192}
      height={192}
      className="mx-auto size-40 object-contain sm:size-48"
    />
  );
}
