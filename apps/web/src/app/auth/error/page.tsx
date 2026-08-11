export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="mx-auto flex min-h-svh max-w-md flex-col justify-center gap-4 px-4">
      <h1 className="text-2xl font-semibold">認証エラー</h1>
      <p className="text-sm text-red-600">{error ?? "不明なエラー"}</p>
    </main>
  );
}
