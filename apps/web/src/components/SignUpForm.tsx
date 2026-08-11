"use client";

import { createClient } from "@/lib/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function SignUpForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: signError } = await supabase.auth.signUp({
        email,
        password,
      });
      if (signError) throw signError;
      router.push("/auth/sign-up-success");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "登録に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto flex w-full max-w-sm flex-col gap-4"
    >
      <h1 className="text-2xl font-semibold tracking-tight">新規登録</h1>
      <label className="grid gap-1 text-sm">
        メール
        <input
          className="rounded border border-black/15 px-3 py-2"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </label>
      <label className="grid gap-1 text-sm">
        パスワード
        <input
          className="rounded border border-black/15 px-3 py-2"
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="rounded bg-zinc-900 px-4 py-2 text-white disabled:opacity-50"
      >
        {loading ? "送信中..." : "登録"}
      </button>
      <p className="text-sm">
        ログインは{" "}
        <Link href="/auth/login" className="underline">
          こちら
        </Link>
      </p>
    </form>
  );
}
