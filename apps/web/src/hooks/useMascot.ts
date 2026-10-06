"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  DEFAULT_MASCOT_ID,
  type MascotId,
} from "@/lib/mascotCatalog";
import {
  applyMascotToDocument,
  readLocalMascotId,
  writeLocalMascotId,
} from "@/lib/mascotPrefs";
import { runAfterTick } from "@/lib/runAfterTick";

export type MascotContextValue = {
  mascotId: MascotId;
  setMascotId: (id: MascotId) => void;
};

export const MascotContext = createContext<MascotContextValue | null>(null);

export function useMascotState(): MascotContextValue {
  const [mascotId, setMascotIdState] = useState<MascotId>(DEFAULT_MASCOT_ID);

  useEffect(
    () =>
      runAfterTick(() => {
        const id = readLocalMascotId();
        setMascotIdState(id);
        applyMascotToDocument(id);
      }),
    [],
  );

  const setMascotId = useCallback((id: MascotId) => {
    writeLocalMascotId(id);
    applyMascotToDocument(id);
    setMascotIdState(id);
  }, []);

  return useMemo(
    () => ({ mascotId, setMascotId }),
    [mascotId, setMascotId],
  );
}

export function useMascot(): MascotContextValue {
  const ctx = useContext(MascotContext);
  if (!ctx) {
    throw new Error("useMascot は MascotRoot 内で使ってください");
  }
  return ctx;
}
