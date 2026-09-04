"use client";

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { ChevronDown } from "@/lib/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type SearchableSelectOption = {
  value: string;
  label: string;
  /** 追加の検索対象（IANA ID など） */
  keywords?: string;
  group?: string;
};

type SearchableSelectProps = {
  options: SearchableSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyLabel?: string;
  "aria-label"?: string;
  className?: string;
};

/**
 * 検索入力とプルダウンを合体したコンボボックス。
 * 依存追加なし・既存 Input トークンに合わせる。
 */
export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder,
  emptyLabel = "該当なし",
  "aria-label": ariaLabel,
  className,
}: SearchableSelectProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);

  const selected = options.find((o) => o.value === value) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => {
      const hay = `${o.label} ${o.value} ${o.keywords ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [options, query]);

  useEffect(() => {
    if (!open) return;
    setHighlight(0);
  }, [query, open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const pick = (next: string) => {
    onChange(next);
    setOpen(false);
    setQuery("");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      setHighlight((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0)));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const item = filtered[highlight];
      if (item) pick(item.value);
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      setQuery("");
    }
  };

  let lastGroup = "";

  return (
    <div ref={rootRef} className={cn("relative w-full", className)}>
      <div className="relative">
        <Input
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-label={ariaLabel}
          placeholder={placeholder}
          value={open ? query : (selected?.label ?? value)}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
            setQuery("");
          }}
          onKeyDown={onKeyDown}
          className="min-h-10 pr-9"
          autoComplete="off"
        />
        <ChevronDown
          aria-hidden
          className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
      </div>
      {open ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-md border border-border bg-popover text-popover-foreground shadow-md"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">{emptyLabel}</li>
          ) : (
            filtered.map((opt, index) => {
              const showGroup = Boolean(opt.group && opt.group !== lastGroup);
              if (opt.group) lastGroup = opt.group;
              return (
                <li key={opt.value} role="presentation">
                  {showGroup ? (
                    <div className="sticky top-0 bg-muted/80 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur-sm">
                      {opt.group}
                    </div>
                  ) : null}
                  <Button
                    type="button"
                    role="option"
                    variant="ghost"
                    aria-selected={opt.value === value}
                    className={cn(
                      "h-auto w-full flex-col items-start justify-start rounded-none px-3 py-2 text-left text-sm font-normal hover:bg-muted/60",
                      index === highlight && "bg-muted",
                      opt.value === value && "font-medium text-foreground",
                    )}
                    onMouseEnter={() => setHighlight(index)}
                    onClick={() => pick(opt.value)}
                  >
                    <span>{opt.label}</span>
                    {opt.keywords ? (
                      <span className="text-xs font-normal text-muted-foreground">
                        {opt.keywords}
                      </span>
                    ) : null}
                  </Button>
                </li>
              );
            })
          )}
        </ul>
      ) : null}
    </div>
  );
}
