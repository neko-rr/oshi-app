import Link from "next/link";

export default function HomePage() {
  return (
    <main className="relative mx-auto flex min-h-svh max-w-2xl flex-col justify-center gap-6 px-6">
      <p className="text-sm uppercase tracking-[0.2em] text-black/50">
        oshi-app v2
      </p>
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
        推し活グッズ管理
      </h1>
      <p className="max-w-md text-base leading-relaxed text-black/70">
        Next.js + FastAPI monorepo 骨格。認証は Supabase Auth、業務 API は
        Bearer JWT。
      </p>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/auth/login"
          className="rounded bg-zinc-900 px-4 py-2 text-sm text-white"
        >
          ログイン
        </Link>
        <Link
          href="/me"
          className="rounded border border-black/15 px-4 py-2 text-sm"
        >
          /me 確認
        </Link>
      </div>
    </main>
  );
}
