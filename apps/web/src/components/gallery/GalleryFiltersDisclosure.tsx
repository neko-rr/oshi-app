"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";

type Props = {
  children: ReactNode;
};

/**
 * スマホではフィルタを折りたたみ開始（縦空間確保）。md+ では常に開く。
 */
export function GalleryFiltersDisclosure({ children }: Props) {
  const t = useTranslations("Gallery");
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => {
      setOpen(mq.matches);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return (
    <details
      open={open}
      onToggle={(e) => {
        const next = e.currentTarget.open;
        // lg+ では閉じさせない
        if (window.matchMedia("(min-width: 1024px)").matches) {
          e.currentTarget.open = true;
          setOpen(true);
          return;
        }
        setOpen(next);
      }}
      className="rounded-xl border border-border bg-card/40 open:pb-2 lg:border-0 lg:bg-transparent lg:open:pb-0"
    >
      <summary className="cursor-pointer list-none px-3 py-2.5 text-sm font-medium text-foreground marker:content-none lg:hidden [&::-webkit-details-marker]:hidden">
        {t("filtersToggle")}
      </summary>
      <div className="stack-density px-3 lg:px-0">{children}</div>
    </details>
  );
}
