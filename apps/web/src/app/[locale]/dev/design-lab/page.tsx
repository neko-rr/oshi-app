import { notFound } from "next/navigation";
import DesignLabView from "@/components/design-lab/DesignLabView";
import { PRODUCT_NAME } from "@/lib/brand";

export const metadata = {
  title: `Design Lab · ${PRODUCT_NAME}`,
  robots: { index: false, follow: false },
};

/**
 * 開発時のみ公開（未ログイン可）。見た目の本決定前に3案を並列比較する。
 * 本番（NODE_ENV=production）では 404。デザイン確認専用（業務データなし）。
 */
export default function DesignLabPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return <DesignLabView />;
}
