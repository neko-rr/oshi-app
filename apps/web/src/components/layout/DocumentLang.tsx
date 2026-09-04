"use client";

import { useEffect } from "react";

/** ルート html の lang を locale に合わせる */
export function DocumentLang({ locale }: { locale: string }) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return null;
}
