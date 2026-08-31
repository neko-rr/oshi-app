"use client";

import { useEffect, useState } from "react";
import {
  loadAdoptionMemo,
  saveAdoptionMemo,
  type LabAdoptionMemo,
} from "@/components/design-lab/lab-adoption";
import { LAB_VARIANTS, type LabVariantId } from "@/components/design-lab/lab-meta";

export default function LabAdoptionMemoPanel() {
  const [memo, setMemo] = useState<LabAdoptionMemo>({
    provisional_variant: "",
    note: "",
    updated_at: "",
  });
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    setMemo(loadAdoptionMemo());
  }, []);

  const persist = (next: LabAdoptionMemo) => {
    const withTime = {
      ...next,
      updated_at: new Date().toISOString(),
    };
    setMemo(withTime);
    saveAdoptionMemo(withTime);
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 1200);
  };

  return (
    <section
      className="rounded-lg border border-zinc-200 bg-white p-3 text-sm"
      aria-label="仮採用メモ"
    >
      <p className="text-xs font-semibold text-zinc-800">仮採用メモ</p>
      <p className="mt-0.5 text-[11px] text-zinc-500">
        本決定はチャットで。ここはローカルメモ（このブラウザのみ）。
      </p>
      <div className="mt-2 flex flex-wrap gap-1" role="group" aria-label="仮採用案">
        <button
          type="button"
          aria-pressed={memo.provisional_variant === ""}
          onClick={() =>
            persist({ ...memo, provisional_variant: "" })
          }
          className={
            memo.provisional_variant === ""
              ? "rounded-md bg-zinc-900 px-2 py-1 text-[11px] text-white"
              : "rounded-md border border-zinc-300 px-2 py-1 text-[11px] text-zinc-700"
          }
        >
          未定
        </button>
        {LAB_VARIANTS.map((v) => (
          <button
            key={v.id}
            type="button"
            aria-pressed={memo.provisional_variant === v.id}
            onClick={() =>
              persist({
                ...memo,
                provisional_variant: v.id as LabVariantId,
              })
            }
            className={
              memo.provisional_variant === v.id
                ? "rounded-md bg-zinc-900 px-2 py-1 text-[11px] text-white"
                : "rounded-md border border-zinc-300 px-2 py-1 text-[11px] text-zinc-700"
            }
          >
            仮採用 {v.title}
          </button>
        ))}
      </div>
      <label className="mt-2 block text-[11px] text-zinc-600">
        メモ
        <textarea
          value={memo.note}
          onChange={(e) =>
            setMemo((m) => ({ ...m, note: e.target.value.slice(0, 500) }))
          }
          onBlur={() => persist(memo)}
          rows={2}
          className="mt-1 w-full rounded border border-zinc-300 px-2 py-1 text-xs text-zinc-800"
          placeholder="例: Aの配置 + Cの余白が好み。モバイルは要確認"
        />
      </label>
      <div className="mt-1 flex items-center justify-between gap-2 text-[10px] text-zinc-500">
        <span>
          {memo.updated_at
            ? `保存: ${new Date(memo.updated_at).toLocaleString("ja-JP")}`
            : "未保存"}
        </span>
        {savedFlash ? (
          <span className="font-medium text-emerald-700" role="status">
            保存しました
          </span>
        ) : (
          <button
            type="button"
            className="underline"
            onClick={() => persist(memo)}
          >
            今すぐ保存
          </button>
        )}
      </div>
    </section>
  );
}
