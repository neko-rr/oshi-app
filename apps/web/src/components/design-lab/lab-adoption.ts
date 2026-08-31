import type { LabVariantId } from "@/components/design-lab/lab-meta";
import { LAB_ADOPTION_STORAGE_KEY } from "@/components/design-lab/lab-meta";

export type LabAdoptionMemo = {
  provisional_variant: LabVariantId | "";
  note: string;
  updated_at: string;
};

export function loadAdoptionMemo(): LabAdoptionMemo {
  const empty: LabAdoptionMemo = {
    provisional_variant: "",
    note: "",
    updated_at: "",
  };
  try {
    const raw = localStorage.getItem(LAB_ADOPTION_STORAGE_KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as Partial<LabAdoptionMemo>;
    return {
      provisional_variant:
        parsed.provisional_variant === "a" ||
        parsed.provisional_variant === "b" ||
        parsed.provisional_variant === "c"
          ? parsed.provisional_variant
          : "",
      note: typeof parsed.note === "string" ? parsed.note.slice(0, 500) : "",
      updated_at:
        typeof parsed.updated_at === "string" ? parsed.updated_at : "",
    };
  } catch {
    return empty;
  }
}

export function saveAdoptionMemo(memo: LabAdoptionMemo): void {
  try {
    localStorage.setItem(LAB_ADOPTION_STORAGE_KEY, JSON.stringify(memo));
  } catch {
    /* ignore quota */
  }
}
