"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  /** 検索送信先（既定 /search） */
  actionPath?: string;
  initialQuery?: string;
};

export function ProductSearchForm({
  actionPath = "/search",
  initialQuery = "",
}: Props) {
  const router = useRouter();
  const [q, setQ] = useState(initialQuery);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = q.trim();
    const url = trimmed
      ? `${actionPath}?q=${encodeURIComponent(trimmed)}`
      : actionPath;
    router.push(url);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex w-full max-w-md flex-col gap-2 sm:flex-row sm:items-end"
      role="search"
    >
      <div className="grid flex-1 gap-1">
        <Label htmlFor="product_search_q" className="sr-only">
          製品を検索
        </Label>
        <Input
          id="product_search_q"
          name="q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="名前・カテゴリ・収納場所"
          autoComplete="off"
        />
      </div>
      <Button type="submit" className="shrink-0">
        検索
      </Button>
    </form>
  );
}
