"use client";

import { useEffect, useState, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { buildWhatsAppProductUrl } from "@/lib/whatsapp";
import { pickL10n } from "@/lib/forms";
import { ProductCard, type ProductCardData } from "./ProductCard";

export type CollectionProduct = {
  id: string;
  code: string;
  title: unknown;
  slug: string;
  type: string;
  description?: unknown;
  base_price?: number | null;
  sale_price?: number | null;
  currency?: string;
  sort_order: number;
  product_variants?: { id: string; label: unknown; price: number; sale_price?: number | null }[];
  product_images?: { id: string; url_thumb: string; url_medium: string; url_large: string; sort_order: number }[];
};

export type CollectionData = {
  id: string;
  name: unknown;
  slug: string;
  description?: unknown;
  bundle_price?: number | null;
  bundle_sale_price?: number | null;
  currency?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  categories?: any;
  products: CollectionProduct[];
};

export function CollectionFlipbook({
  collection,
  whatsappUrl,
}: {
  collection: CollectionData;
  whatsappUrl: string;
}) {
  const locale = useLocale();
  const t = useTranslations("collection");
  const tProd = useTranslations("product");

  const [activeIndex, setActiveIndex] = useState(0);
  const [viewMode, setViewMode] = useState<"flip" | "grid">("grid");
  const touchStartX = useRef<number | null>(null);

  const products = collection.products ?? [];
  const total = products.length;
  const current = products[activeIndex];

  const colName = pickL10n(collection.name, locale);
  const colDesc = pickL10n(collection.description, locale);
  const currency = collection.currency ?? "AZN";

  // Keyboard navigation
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (viewMode !== "flip" || total <= 1) return;
      if (e.key === "ArrowRight") {
        setActiveIndex((prev) => (prev + 1 < total ? prev + 1 : 0));
      } else if (e.key === "ArrowLeft") {
        setActiveIndex((prev) => (prev - 1 >= 0 ? prev - 1 : total - 1));
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [viewMode, total]);

  function prevPage() {
    if (total <= 1) return;
    setActiveIndex((prev) => (prev - 1 >= 0 ? prev - 1 : total - 1));
  }

  function nextPage() {
    if (total <= 1) return;
    setActiveIndex((prev) => (prev + 1 < total ? prev + 1 : 0));
  }

  // Touch Swipe for mobile
  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) nextPage();
      else prevPage();
    }
    touchStartX.current = null;
  }

  if (!total) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-12 text-center">
        <p className="text-foreground/60">{t("empty")}</p>
      </div>
    );
  }

  const defaultOrigin = process.env.NEXT_PUBLIC_SITE_URL || "";
  const currentTitle = current ? pickL10n(current.title, locale) : "";
  const currentDesc = current ? pickL10n(current.description, locale) : "";
  const currentImages = current ? [...(current.product_images ?? [])].sort((a, b) => a.sort_order - b.sort_order) : [];
  const currentImage = currentImages[0]?.url_large || currentImages[0]?.url_medium || currentImages[0]?.url_thumb;
  const currentProductUrl = current ? `${defaultOrigin}/${locale}/p/${current.slug}` : "";

  // Inherit collection price if product does not have custom override
  const currentBasePrice = current ? (current.base_price ?? collection.bundle_price) : null;
  const currentSalePrice = current
    ? (current.base_price != null ? current.sale_price : (collection.bundle_sale_price ?? current.sale_price))
    : null;

  const currentOrderUrl = current
    ? buildWhatsAppProductUrl(
        whatsappUrl,
        {
          code: current.code,
          title: `${colName} — ${currentTitle}`,
          price: currentBasePrice,
          salePrice: currentSalePrice,
          currency: current.currency ?? currency,
          productUrl: currentProductUrl,
        },
        locale
      )
    : "";

  function handleFlipbookOrderClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (typeof window !== "undefined" && window.location.origin && current) {
      e.currentTarget.href = buildWhatsAppProductUrl(
        whatsappUrl,
        {
          code: current.code,
          title: `${colName} — ${currentTitle}`,
          price: currentBasePrice,
          salePrice: currentSalePrice,
          currency: current.currency ?? currency,
          productUrl: `${window.location.origin}/${locale}/p/${current.slug}`,
        },
        locale
      );
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header & View Mode Switch */}
      <div className="flex flex-col justify-between gap-4 border-b border-border/70 pb-5 sm:flex-row sm:items-end">
        <div>
          {(() => {
            const cat = Array.isArray(collection.categories)
              ? collection.categories[0]
              : collection.categories;
            if (!cat) return null;
            return (
              <Link
                href={`/c/${cat.slug}`}
                className="mb-1 text-xs font-semibold text-gold hover:underline"
              >
                {pickL10n(cat.name, locale)}
              </Link>
            );
          })()}
          <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {colName}
          </h1>
          {colDesc && (
            <p className="mt-2 max-w-2xl text-sm text-foreground/70">{colDesc}</p>
          )}
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="inline-flex rounded-full border border-border bg-surface p-1 text-xs">
            <button
              type="button"
              onClick={() => setViewMode("flip")}
              className={`rounded-full px-3 py-1 font-medium transition-colors ${
                viewMode === "flip"
                  ? "bg-foreground text-surface shadow-xs"
                  : "text-foreground/70 hover:text-foreground"
              }`}
            >
              📖 {t("viewAsFlip")}
            </button>
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={`rounded-full px-3 py-1 font-medium transition-colors ${
                viewMode === "grid"
                  ? "bg-foreground text-surface shadow-xs"
                  : "text-foreground/70 hover:text-foreground"
              }`}
            >
              ⊞ {t("viewAsList")}
            </button>
          </div>
        </div>
      </div>

      {/* Grid Mode (Default) */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => {
            const pBase = p.base_price ?? collection.bundle_price;
            const pSale =
              p.base_price != null
                ? p.sale_price
                : (collection.bundle_sale_price ?? p.sale_price);
            return (
              <ProductCard
                key={p.id}
                product={{
                  ...p,
                  base_price: pBase,
                  sale_price: pSale,
                  currency: p.currency ?? currency,
                  collections: { name: collection.name, slug: collection.slug },
                }}
                whatsappUrl={whatsappUrl}
              />
            );
          })}
        </div>
      ) : (
        /* Interactive Flipbook Mode */
        <div className="space-y-6">
          <div
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className="relative mx-auto flex max-w-4xl flex-col items-center justify-center rounded-3xl border border-border bg-[#F5F2EA] p-6 shadow-sm md:p-10"
          >
            {/* Page number badge */}
            <div className="mb-4 flex items-center justify-between w-full max-w-lg text-xs text-foreground/60">
              <span className="font-mono font-medium">
                {t("page")} {activeIndex + 1} / {total}
              </span>
              <span className="hidden sm:inline text-foreground/40">{t("flipHint")}</span>
              <span className="rounded-md bg-surface px-2.5 py-1 font-mono font-bold text-foreground shadow-xs">
                {current.code}
              </span>
            </div>

            {/* Main Tableau Presentation with A4 Frame look */}
            <div className="relative flex w-full max-w-md items-center justify-center">
              {/* Previous arrow */}
              <button
                type="button"
                onClick={prevPage}
                className="absolute -left-4 z-20 flex h-10 w-10 -translate-x-full items-center justify-center rounded-full border border-border bg-surface text-foreground shadow-md transition-transform hover:scale-110 active:scale-95 disabled:opacity-40 sm:-left-6"
                aria-label="Əvvəlki"
              >
                ‹
              </button>

              {/* The Framed Canvas (1px qara çərçivə ilə) */}
              <div className="relative aspect-[1/1.414] w-full max-w-[340px] sm:max-w-[400px] overflow-hidden rounded-xl border border-black bg-white shadow-xl transition-all duration-300">
                {currentImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={currentImage}
                    alt={currentTitle}
                    className="h-full w-full object-cover transition-opacity duration-300 select-none"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm text-foreground/40">
                    Şəkil yoxdur
                  </div>
                )}

                {/* Watermark branding hint */}
                <span className="absolute bottom-2 right-2 rounded-xs bg-black/40 px-1.5 py-0.5 text-[10px] text-white/80 backdrop-blur-xs">
                  A4 Ölçü
                </span>
              </div>

              {/* Next arrow */}
              <button
                type="button"
                onClick={nextPage}
                className="absolute -right-4 z-20 flex h-10 w-10 translate-x-full items-center justify-center rounded-full border border-border bg-surface text-foreground shadow-md transition-transform hover:scale-110 active:scale-95 disabled:opacity-40 sm:-right-6"
                aria-label="Növbəti"
              >
                ›
              </button>
            </div>

            {/* Current Item Info & WhatsApp CTA */}
            <div className="mt-8 w-full max-w-lg space-y-4 rounded-2xl border border-border bg-surface p-5 text-center shadow-xs">
              <div>
                <h2 className="text-xl font-bold text-foreground">{currentTitle}</h2>
                {currentDesc && (
                  <p className="mt-1 text-xs text-foreground/70">{currentDesc}</p>
                )}
              </div>

              {/* Price with strikethrough if sale (with collection inheritance) */}
              <div className="flex items-center justify-center gap-3">
                {currentSalePrice != null ? (
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold text-sale">
                      {currentSalePrice} {current.currency ?? currency}
                    </span>
                    <s className="text-base text-sale/70">
                      {currentBasePrice} {current.currency ?? currency}
                    </s>
                  </div>
                ) : currentBasePrice != null ? (
                  <span className="text-2xl font-bold text-foreground">
                    {currentBasePrice} {current.currency ?? currency}
                  </span>
                ) : (
                  <span className="text-sm text-foreground/60">
                    {tProd("priceOnRequest")}
                  </span>
                )}
              </div>

              {/* Order button */}
              <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
                <a
                  href={currentOrderUrl}
                  onClick={handleFlipbookOrderClick}
                  target="_blank"
                  rel="noopener noreferrer"
                  suppressHydrationWarning
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-6 py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-[#1ebd5b] hover:shadow-lg active:scale-98"
                >
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.587-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.079-2.115-.512-1.815-.755-2.986-2.607-3.076-2.727-.089-.12-1.077-1.433-1.077-2.732 0-1.301.683-1.939.924-2.204.24-.265.526-.331.701-.331.175 0 .351.002.506.01.164.009.385-.062.602.46.222.535.759 1.849.825 1.983.067.135.112.293.022.472-.089.179-.134.291-.268.448-.134.156-.282.348-.403.468-.134.133-.274.278-.119.544.156.266.691 1.139 1.482 1.843 1.016.905 1.872 1.185 2.138 1.318.266.133.423.111.58-.069.156-.179.667-.777.845-1.045.178-.268.356-.223.593-.134.237.089 1.503.708 1.762.837.259.13.43.193.493.303.064.108.064.629-.08 1.034z" />
                  </svg>
                  <span>{t("orderThis")}</span>
                </a>

                <Link
                  href={`/p/${current.slug}`}
                  className="inline-flex items-center justify-center rounded-xl border border-border px-4 py-3 text-xs font-medium text-foreground hover:bg-background"
                >
                  {tProd("details")}
                </Link>
              </div>
            </div>
          </div>

          {/* Bottom Thumbnail Strip for fast hopping */}
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-foreground/50">
              Kolleksiyadakı bütün tablolar ({total})
            </p>
            <div className="flex gap-2.5 overflow-x-auto pb-2 pt-1 scrollbar-thin">
              {products.map((p, idx) => {
                const isActive = idx === activeIndex;
                const pThumb = p.product_images?.[0]?.url_thumb;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setActiveIndex(idx)}
                    className={`group relative aspect-[1/1.4] w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                      isActive
                        ? "border-gold scale-105 shadow-md"
                        : "border-border/80 opacity-70 hover:opacity-100"
                    }`}
                  >
                    {pThumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={pThumb}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-background text-[10px]">
                        {p.code}
                      </div>
                    )}
                    <span className="absolute bottom-0 inset-x-0 bg-black/60 py-0.5 text-center text-[9px] font-mono text-white">
                      {p.code}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
