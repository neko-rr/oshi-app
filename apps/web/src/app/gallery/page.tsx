export default function GalleryPage() {
  return (
    <main className="mx-auto flex min-h-svh max-w-2xl flex-col justify-center gap-4 px-6">
      <h1 className="text-3xl font-semibold">ギャラリー</h1>
      <p className="text-sm text-black/70">
        製品一覧 API (`GET /products`) 接続は Supabase / JWT 設定後に実装します。
      </p>
    </main>
  );
}
