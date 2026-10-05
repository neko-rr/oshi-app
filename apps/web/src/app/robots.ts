import type { MetadataRoute } from "next";
import { SITE_INDEXABLE } from "@/lib/brand";

/** 未公開のあいだは全拒否。SITE_INDEXABLE を true にしたら通常許可に戻る */
export default function robots(): MetadataRoute.Robots {
  if (!SITE_INDEXABLE) {
    return {
      rules: { userAgent: "*", disallow: "/" },
    };
  }
  return {
    rules: { userAgent: "*", allow: "/" },
  };
}
