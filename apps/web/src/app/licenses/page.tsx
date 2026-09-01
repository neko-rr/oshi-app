import type { Metadata } from "next";
import Link from "next/link";
import notices from "@/data/generated/third_party_notices.json";

export const metadata: Metadata = {
  title: "ライセンス・表記 | oshi-app",
  description: "オープンソース依存と外部サービスの表示メモ",
};

type NoticePackage = {
  name: string;
  version: string;
  license: string;
  ecosystem: string;
  homepage?: string;
};

type NoticeService = {
  id: string;
  name_ja: string;
  attribution_required: boolean;
  status: string;
  note_ja: string;
  docs_url: string | null;
};

export default function LicensesPage() {
  const packages = notices.packages as NoticePackage[];
  const services = notices.services as NoticeService[];
  const generatedAt = notices.generated_at as string;

  return (
    <article className="flex flex-col gap-6 py-6 text-sm leading-relaxed text-foreground">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          ライセンス・表記
        </h1>
        <p className="mt-2 text-muted-foreground">
          依存一覧の生成時刻 (UTC): {generatedAt}
        </p>
      </div>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">アプリ本体</h2>
        <p>{notices.app_notice_ja}</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">オープンソース依存</h2>
        <p className="text-muted-foreground">
          npm（Web）と pip（API）の直接依存です。依存を増やしたあと、リポジトリで
          生成スクリプトを回すとこの一覧が更新されます。
        </p>
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full min-w-[28rem] border-collapse text-left text-xs sm:text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-2 font-medium">名前</th>
                <th className="px-3 py-2 font-medium">版</th>
                <th className="px-3 py-2 font-medium">ライセンス</th>
                <th className="px-3 py-2 font-medium">系統</th>
              </tr>
            </thead>
            <tbody>
              {packages.map((p) => (
                <tr key={`${p.ecosystem}:${p.name}`} className="border-t border-border">
                  <td className="px-3 py-2">
                    {p.homepage ? (
                      <a
                        href={p.homepage}
                        className="text-primary underline-offset-4 hover:underline"
                        rel="noopener noreferrer"
                        target="_blank"
                      >
                        {p.name}
                      </a>
                    ) : (
                      p.name
                    )}
                  </td>
                  <td className="px-3 py-2 font-mono text-[11px] sm:text-xs">
                    {p.version || "—"}
                  </td>
                  <td className="px-3 py-2">{p.license}</td>
                  <td className="px-3 py-2">{p.ecosystem}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">外部サービス</h2>
        <p className="text-muted-foreground">
          API・ブランドガイドライン上の表示メモです。楽天など「要表示」のサービスは、
          LIVE 利用時に公式規定どおりロゴ／クレジットを別途実装します。
        </p>
        {services.map((s) => (
          <div
            key={s.id}
            className="rounded-md border border-border bg-card px-4 py-3 text-card-foreground"
          >
            <h3 className="font-semibold">{s.name_ja}</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              状態: {s.status}
              {s.attribution_required ? " · 要表示（利用時）" : " · ロゴ必須ではない"}
            </p>
            <p className="mt-2">{s.note_ja}</p>
            {s.docs_url ? (
              <p className="mt-2">
                <a
                  href={s.docs_url}
                  className="text-primary underline-offset-4 hover:underline"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  参考リンク
                </a>
              </p>
            ) : null}
          </div>
        ))}
      </section>

      <p className="flex flex-wrap gap-4">
        <Link href="/privacy" className="text-primary underline-offset-4 hover:underline">
          プライバシーポリシー
        </Link>
        <Link href="/" className="text-primary underline-offset-4 hover:underline">
          ホームへ戻る
        </Link>
      </p>
    </article>
  );
}
