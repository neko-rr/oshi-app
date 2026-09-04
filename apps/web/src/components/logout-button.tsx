"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { createClient } from "@/lib/client";
import { Button } from "@/components/ui/button";

type Props = {
  variant?: "default" | "outline" | "ghost" | "destructive" | "secondary";
  className?: string;
};

export function LogoutButton({ variant = "outline", className }: Props) {
  const t = useTranslations("Nav");
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/auth/login");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      className={className}
      disabled={loading}
      onClick={() => void logout()}
    >
      {loading ? t("loggingOut") : t("logout")}
    </Button>
  );
}
