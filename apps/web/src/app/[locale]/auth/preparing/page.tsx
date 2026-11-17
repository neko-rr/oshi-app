import { ApiPreparingClient } from "@/components/auth/ApiPreparingClient";
import { setRequestLocale } from "next-intl/server";

/**
 * Google OAuth 直後など、Render Free API の起床を待ってから着地へ進む。
 */
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;

  return (
    <div className="flex min-h-svh w-full items-center justify-center">
      <ApiPreparingClient nextPath={sp.next} />
    </div>
  );
}
