"use client";

import { Link } from "@/i18n/navigation";
import { labFontPackVariableClassName } from "@/components/design-lab/lab-font-pack-fonts";
import {
  LAB_FONT_PACK_INTENT_GROUPS,
  findLabFontPackCandidate,
  type LabFontPackCandidate,
} from "@/components/design-lab/lab-font-pack-candidates";
import "@/components/design-lab/lab-font-packs.css";
import { useMemo, useState } from "react";

type FilterId = "all" | "production" | "proposal";

const SAMPLE_HEADING_JA = "推しのぬいぐるみ";
const SAMPLE_HEADING_EN = "Oshihaven Gallery";
const SAMPLE_BODY_JA =
  "収納タグで実物とデータをつなぐ。価格・日付・メモが並んでも、本文は迷わず読めること。";
const SAMPLE_BODY_EN =
  "Keep the body readable. Display faces belong on titles, not on settings.";
const SAMPLE_UI = "ギャラリー  ·  登録  ·  ¥2,420";

function SampleCard({ pack }: { pack: LabFontPackCandidate }) {
  const headingClass =
    pack.role === "display"
      ? "lab-font-sample-heading-display"
      : "lab-font-sample-heading";

  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 text-zinc-900 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold">{pack.name_ja}</h3>
        <span
          className={
            pack.in_production
              ? "rounded-full bg-zinc-900 px-2 py-0.5 text-[10px] font-medium text-white"
              : "rounded-full border border-zinc-300 px-2 py-0.5 text-[10px] font-medium text-zinc-600"
          }
        >
          {pack.in_production ? "本番" : "提案"}
        </span>
        {pack.role === "display" ? (
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-600">
            見出し飾り字
          </span>
        ) : (
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-600">
            UI本文
          </span>
        )}
      </div>

      <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-3">
        <p
          className={headingClass}
          data-lab-font-pack={pack.id}
          data-lab-font-role="heading"
        >
          {SAMPLE_HEADING_JA}
        </p>
        <p
          className={`${headingClass} mt-1 text-[1.15rem] font-semibold`}
          data-lab-font-pack={pack.id}
          data-lab-font-role="heading"
        >
          {SAMPLE_HEADING_EN}
        </p>
        <p
          className="lab-font-sample-body mt-3 text-zinc-700"
          data-lab-font-pack={pack.id}
          data-lab-font-role="body"
        >
          {SAMPLE_BODY_JA}
        </p>
        <p
          className="lab-font-sample-body text-zinc-600"
          data-lab-font-pack={pack.id}
          data-lab-font-role="body"
        >
          {SAMPLE_BODY_EN}
        </p>
        <p
          className="lab-font-sample-ui mt-2 text-zinc-500"
          data-lab-font-pack={pack.id}
          data-lab-font-role="body"
        >
          {SAMPLE_UI}
        </p>
      </div>

      <dl className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-zinc-600">
        <dt className="text-zinc-400">見出し和</dt>
        <dd>{pack.heading_ja}</dd>
        <dt className="text-zinc-400">見出し英</dt>
        <dd>{pack.heading_en}</dd>
        <dt className="text-zinc-400">本文和</dt>
        <dd>{pack.body_ja}</dd>
        <dt className="text-zinc-400">本文英</dt>
        <dd>{pack.body_en}</dd>
        <dt className="text-zinc-400">ライセンス</dt>
        <dd>{pack.license}</dd>
      </dl>

      <p className="text-xs leading-relaxed text-zinc-600">{pack.reason_ja}</p>
    </article>
  );
}

export default function LabFontPackStudio() {
  const [filter, setFilter] = useState<FilterId>("all");

  const groups = useMemo(() => {
    return LAB_FONT_PACK_INTENT_GROUPS.map((group) => {
      const packs = group.candidate_ids
        .map((id) => findLabFontPackCandidate(id))
        .filter((p): p is LabFontPackCandidate => Boolean(p))
        .filter((p) => {
          if (filter === "production") return p.in_production;
          if (filter === "proposal") return !p.in_production;
          return true;
        });
      return { group, packs };
    }).filter((row) => row.packs.length > 0);
  }, [filter]);

  return (
    <div className={`${labFontPackVariableClassName} min-h-full bg-zinc-100 text-zinc-900`}>
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-zinc-100/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Design Lab（開発用）
              </p>
              <h1 className="text-lg font-semibold tracking-tight sm:text-xl">
                文字パック候補スタジオ
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-zinc-600">
                本番の6パックと、差し替える前の組み合わせを方向ごとに並べています。まつりは提案として残しています。
              </p>
            </div>
            <nav className="flex flex-wrap gap-2 text-xs">
              <Link
                href="/dev/design-lab"
                className="rounded-full border border-zinc-300 bg-white px-3 py-1.5 font-medium text-zinc-800 hover:bg-zinc-50"
              >
                ← 3案比較 Lab
              </Link>
              <Link
                href="/dev/design-lab/theme-colors"
                className="rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-zinc-700 hover:bg-zinc-50"
              >
                テーマ色スタジオ
              </Link>
              <Link
                href="/settings/theme"
                className="rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-zinc-700 hover:bg-zinc-50"
              >
                本番の見た目設定
              </Link>
            </nav>
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="候補の絞り込み">
            {(
              [
                ["all", "全部"],
                ["production", "いまの本番"],
                ["proposal", "提案だけ"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                aria-pressed={filter === id}
                onClick={() => setFilter(id)}
                className={
                  filter === id
                    ? "rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white"
                    : "rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                }
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-[1600px] flex-col gap-10 px-4 py-6">
        {groups.map(({ group, packs }) => (
          <section key={group.id} className="flex flex-col gap-3">
            <div>
              <h2 className="text-base font-semibold">{group.title_ja}</h2>
              <p className="mt-0.5 text-sm text-zinc-600">{group.hint_ja}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {packs.map((pack) => (
                <SampleCard key={pack.id} pack={pack} />
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
