"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AppEmotionalStatusScreen } from "@/components/feedback/AppEmotionalStatusScreen";
import "./globals.css";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

/** ルートが壊れたとき。intl なし。設定が読めなければ風ねこ（おとな） */
export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    console.error(error.message);
  }, [error]);

  return (
    <html lang="ja">
      <body>
        <AppEmotionalStatusScreen
          kind="error"
          title="表示できませんでした"
          body="時間をおいて、もう一度お試しください。"
        >
          <Button type="button" onClick={reset}>
            再試行
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">ホーム</Link>
          </Button>
        </AppEmotionalStatusScreen>
      </body>
    </html>
  );
}
