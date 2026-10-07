import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AppEmotionalStatusScreen } from "@/components/feedback/AppEmotionalStatusScreen";

/** ロケール外（未知の言語コードなど）。設定が読めなければ風ねこ（おとな） */
export default function RootNotFound() {
  return (
    <AppEmotionalStatusScreen
      kind="not_found"
      title="ページが見つかりません"
      body="アドレスが違うか、このページはもうありません。"
    >
      <Button asChild>
        <Link href="/">ホーム</Link>
      </Button>
    </AppEmotionalStatusScreen>
  );
}
