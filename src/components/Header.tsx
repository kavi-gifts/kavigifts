"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { LanguageSwitcher } from "./LanguageSwitcher";

export function Header({
  whatsappUrl,
}: {
  whatsappUrl?: string;
}) {
  const t = useTranslations("nav");
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        {/* Brand / Logo */}
        <div className="flex items-center gap-6">
          <Link href="/" className="group flex items-center py-0.5" aria-label="KaVi Gifts">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="KaVi"
              className="h-12 w-auto object-contain transition-transform group-hover:scale-105 sm:h-14"
            />
          </Link>

          {/* Desktop Nav links */}
          <nav className="hidden items-center gap-5 text-sm font-medium text-foreground/80 md:flex">
            <Link href="/" className="hover:text-foreground">
              {t("home")}
            </Link>
            <Link href="/about" className="hover:text-foreground">
              {t("about")}
            </Link>
            <Link href="/contact" className="hover:text-foreground">
              {t("contact")}
            </Link>
          </nav>
        </div>

        {/* Search Bar */}
        <form
          onSubmit={handleSearch}
          className="relative hidden max-w-md flex-1 sm:block"
        >
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full rounded-full border border-border bg-background/80 py-2 pl-4 pr-10 text-sm outline-none transition-all placeholder:text-foreground/40 focus:border-gold focus:bg-surface focus:ring-2 focus:ring-gold/20"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-foreground/50 hover:text-foreground"
            title={t("search")}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z"
              />
            </svg>
          </button>
        </form>

        {/* Right tools: Language Switcher + WhatsApp quick button + Mobile Toggle */}
        <div className="flex items-center gap-3">
          <LanguageSwitcher />

          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden items-center gap-1.5 rounded-full bg-[#25D366]/15 px-3.5 py-1.5 text-xs font-semibold text-[#128C7E] transition-transform hover:scale-105 sm:inline-flex"
            >
              <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.587-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.079-2.115-.512-1.815-.755-2.986-2.607-3.076-2.727-.089-.12-1.077-1.433-1.077-2.732 0-1.301.683-1.939.924-2.204.24-.265.526-.331.701-.331.175 0 .351.002.506.01.164.009.385-.062.602.46.222.535.759 1.849.825 1.983.067.135.112.293.022.472-.089.179-.134.291-.268.448-.134.156-.282.348-.403.468-.134.133-.274.278-.119.544.156.266.691 1.139 1.482 1.843 1.016.905 1.872 1.185 2.138 1.318.266.133.423.111.58-.069.156-.179.667-.777.845-1.045.178-.268.356-.223.593-.134.237.089 1.503.708 1.762.837.259.13.43.193.493.303.064.108.064.629-.08 1.034z" />
              </svg>
              <span>WhatsApp</span>
            </a>
          )}

          {/* Mobile menu trigger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-foreground/70 hover:bg-background md:hidden"
            aria-label="Menyu"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Drawer / Search Bar */}
      {mobileMenuOpen && (
        <div className="border-t border-border bg-surface px-4 py-4 md:hidden">
          <form onSubmit={handleSearch} className="mb-4">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-gold"
            />
          </form>
          <nav className="flex flex-col space-y-2 text-base font-medium">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-md px-2 py-1.5 hover:bg-background"
            >
              {t("home")}
            </Link>
            <Link
              href="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-md px-2 py-1.5 hover:bg-background"
            >
              {t("about")}
            </Link>
            <Link
              href="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-md px-2 py-1.5 hover:bg-background"
            >
              {t("contact")}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
