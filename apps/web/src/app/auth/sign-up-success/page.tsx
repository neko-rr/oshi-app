import Link from "next/link";

export default function SignUpSuccessPage() {
  return (
    <main className="mx-auto flex min-h-svh max-w-md flex-col justify-center gap-4 px-4">
      <h1 className="text-2xl font-semibold">確認メールを送信しました</h1>
      <p className="text-sm text-black/70">
        Supabase のメール確認設定に従ってリンクを開いてください。
      </p>
      <Link href="/auth/login" className="underline">
        ログインへ
      </Link>
    </main>
  );
}
