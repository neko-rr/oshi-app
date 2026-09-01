import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "プライバシーポリシー | oshi-app",
  description: "oshi-app のプライバシー方針",
};

export default function PrivacyPage() {
  return (
    <article className="flex flex-col gap-6 py-6 text-sm leading-relaxed text-foreground">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          プライバシーポリシー
        </h1>
        <p className="mt-2 text-muted-foreground">最終更新: 2026-09-01</p>
      </div>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">概要</h2>
        <p>
          oshi-app（以下「本サービス」）は、推し活グッズの登録・整理を目的とした
          Web アプリです。本ページでは、取り扱う情報と利用目的を説明します。
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">取得する情報</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>アカウント情報（メールアドレス等。認証は Supabase Auth）</li>
          <li>登録したグッズ情報・タグ・収納場所・メモ</li>
          <li>アップロードした製品写真</li>
          <li>サービス改善に必要な技術ログ（認証トークン全文は含めません）</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">利用目的</h2>
        <p>
          取得した情報は、本サービスの提供（登録・一覧・検索・設定）および
          セキュリティ・障害対応のためにのみ利用します。
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">写真・学習について</h2>
        <p>
          アップロードされた写真を、第三者の機械学習モデルの
          <strong>再学習・データセット化の目的で外部に残す実装は行いません</strong>
          。アシスト機能（画像説明など）を利用する場合でも、本保存は利用者の操作に
          依存し、外部アシストの成功を必須にしません。
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">データの分離</h2>
        <p>
          各利用者のデータはログインユーザー（JWT の{" "}
          <code className="rounded bg-muted px-1">members_id</code>
          ）単位で分離され、他の利用者からは見えません（Row Level Security）。
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">お問い合わせ</h2>
        <p>
          本方針に関するお問い合わせは、アプリ運営者までご連絡ください。
          （連絡先の詳細は今後の公開時に追記します。）
        </p>
      </section>

      <p className="flex flex-wrap gap-4">
        <Link href="/licenses" className="text-primary underline-offset-4 hover:underline">
          ライセンス・表記
        </Link>
        <Link href="/" className="text-primary underline-offset-4 hover:underline">
          ホームへ戻る
        </Link>
      </p>
    </article>
  );
}
