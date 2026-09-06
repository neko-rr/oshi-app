"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import ProductPhotoLightbox from "@/components/gallery/ProductPhotoLightbox";
import { Button } from "@/components/ui/button";

type Props = {
  imageUrl: string | null;
  alt: string;
  emptyLabel: string;
};

/**
 * 詳細ヒーロー。タップでフルスクリーン拡大。
 */
export function ProductDetailHero({ imageUrl, alt, emptyLabel }: Props) {
  const t = useTranslations("ProductDetail");
  const [open, setOpen] = useState(false);

  if (!imageUrl) {
    return (
      <div className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border">
        <div className="flex aspect-[4/5] max-h-[min(70vh,36rem)] items-center justify-center bg-muted landscape:aspect-[16/10] landscape:max-h-[min(55vh,24rem)] sm:aspect-[16/10] sm:max-h-[28rem]">
          <p className="text-sm text-muted-foreground">{emptyLabel}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-border">
        <Button
          type="button"
          variant="ghost"
          className="h-auto w-full cursor-zoom-in rounded-none p-0 hover:bg-transparent"
          onClick={() => setOpen(true)}
          aria-label={t("openLightbox")}
        >
          <div className="aspect-[4/5] max-h-[min(70vh,36rem)] w-full bg-muted landscape:aspect-[16/10] landscape:max-h-[min(55vh,24rem)] sm:aspect-[16/10] sm:max-h-[28rem]">
            {/* eslint-disable-next-line @next/next/no-img-element -- signed URL */}
            <img
              src={imageUrl}
              alt={alt}
              className="h-full w-full object-contain"
            />
          </div>
        </Button>
        <p className="border-t border-border px-3 py-2 text-center text-xs text-muted-foreground">
          {t("tapToExpand")}
        </p>
      </div>
      <ProductPhotoLightbox
        src={imageUrl}
        alt={alt}
        open={open}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
