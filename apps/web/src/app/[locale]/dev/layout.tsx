import type { ReactNode } from "react";

/**
 * Design Lab など開発専用画面用。
 * ルート layout の max-w 制約を避け、ビューポート全面で比較できるようにする。
 */
export default function DevLayout({ children }: { children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-[100] overflow-auto bg-zinc-100">
      {children}
    </div>
  );
}
