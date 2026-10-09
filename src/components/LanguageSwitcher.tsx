"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useTransition } from "react";

const LOCALES = [
  { code: "az", label: "AZ" },
  { code: "ru", label: "RU" },
  { code: "en", label: "EN" },
] as const;

export function LanguageSwitcher() {
  const currentLocale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function onSelect(code: "az" | "ru" | "en") {
    if (code === currentLocale) return;
    startTransition(() => {
      router.replace(pathname, { locale: code });
    });
  }

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-border bg-surface p-0.5 text-xs">
      {LOCALES.map((l) => {
        const active = l.code === currentLocale;
        return (
          <button
            key={l.code}
            type="button"
            disabled={isPending}
            onClick={() => onSelect(l.code)}
            className={`rounded-full px-2.5 py-1 font-medium transition-colors ${
              active
                ? "bg-foreground text-surface shadow-xs"
                : "text-foreground/60 hover:text-foreground"
            }`}
          >
            {l.label}
          </button>
        );
      })}
    </div>
  );
}
