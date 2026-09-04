import { redirectTo } from "@/i18n/redirect";

/** 互換用 /protected は /me に寄せる */
export default async function ProtectedPage() {
  await redirectTo("/me");
}
