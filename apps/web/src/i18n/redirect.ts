import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";

/** Server Components 用。現在の locale を付けて next-intl redirect */
export async function redirectTo(href: string): Promise<never> {
  const locale = await getLocale();
  redirect({ href, locale });
  throw new Error("unreachable");
}
