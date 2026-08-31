import { redirect } from "next/navigation";

/** 公式 block の /protected は /me に寄せる */
export default function ProtectedPage() {
  redirect("/me");
}
