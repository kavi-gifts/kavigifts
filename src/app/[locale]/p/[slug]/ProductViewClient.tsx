"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { buildWhatsAppProductUrl } from "@/lib/whatsapp";
import { pickL10n } from "@/lib/forms";
import { ProductCard, type ProductCardData } from "@/components/ProductCard";

export type ProductDetails = {
  id: string;
  code: string;
  title: unknown;
  slug: string;
  type: string;
  description?: unknown;
  base_price?: number | null;
  sale_price?: number | null;
  currency?: string;
  view_count: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  categories?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  collections?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  product_variants?: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  product_images?: any[];
};

export function ProductViewClient({
  product,
  related,
  whatsappUrl,
}: {
  product: ProductDetails;
  related: ProductCardData[];
  whatsappUrl: string;
}) {
  const locale = useLocale();
  const t = useTranslations("product");

  const images = [...(product.product_images ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order
  );
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const variants = product.product_variants ?? [];
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    variants[0]?.id ?? null
  );

  const selectedVariant = variants.find((v) => v.id === selectedVariantId);

  const title = pickL10n(product.title, locale);
  const desc = pickL10n(product.description, locale);
  const currency = product.currency ?? "AZN";

  // Price determination: if variant is selected, use variant price; else base_price
  const price = selectedVariant ? selectedVariant.price : product.base_price;
  const salePrice = selectedVariant
    ? selectedVariant.sale_price
    : product.sale_price;
  const variantLabel = selectedVariant
    ? pickL10n(selectedVariant.label, locale)
    : undefined;

  const defaultOrigin = process.env.NEXT_PUBLIC_SITE_URL || "";
  const productUrl = `${defaultOrigin}/${locale}/p/${product.slug}`;

  const orderUrl = buildWhatsAppProductUrl(
    whatsappUrl,
    {
      code: product.code,
      title,
      price,
      salePrice,
      currency,
      variantLabel,
      productUrl,
    },
    locale
  );

  function handleOrderClick(e: React.MouseEvent<HTMLAnchorElement>) {
    if (typeof window !== "undefined" && window.location.origin) {
      e.currentTarget.href = buildWhatsAppProductUrl(
        whatsappUrl,
        {
          code: product.code,
          title,
          price,
          salePrice,
          currency,
          variantLabel,
          productUrl: `${window.location.origin}/${locale}/p/${product.slug}`,
        },
        locale
      );
    }
  }

  const activeImage =
    images[activeImageIndex]?.url_large ||
    images[activeImageIndex]?.url_medium ||
    images[activeImageIndex]?.url_thumb;

  return (
    <div className="space-y-16">
      {/* Breadcrumb */}
      <nav className="flex flex-wrap items-center gap-2 text-xs text-foreground/60">
        <Link href="/" className="hover:text-foreground">
          Ana səhifə
        </Link>
        {(() => {
          const cat = Array.isArray(product.categories)
            ? product.categories[0]
            : product.categories;
          if (!cat) return null;
          return (
            <>
              <span>/</span>
              <Link href={`/c/${cat.slug}`} className="hover:text-foreground">
                {pickL10n(cat.name, locale)}
              </Link>
            </>
          );
        })()}
        {(() => {
          const col = Array.isArray(product.collections)
            ? product.collections[0]
            : product.collections;
          if (!col) return null;
          return (
            <>
              <span>/</span>
              <Link
                href={`/collection/${col.slug}`}
                className="hover:text-foreground font-medium text-gold"
              >
                {pickL10n(col.name, locale)}
              </Link>
            </>
          );
        })()}
        <span>/</span>
        <span className="font-semibold text-foreground">{product.code}</span>
      </nav>

      {/* Main Product Showcase */}
      <div className="grid grid-cols-1 items-start gap-10 md:grid-cols-2">
        {/* Left: Artwork Presentation with A4 Frame */}
        <div className="space-y-4">
          <div className="relative mx-auto aspect-[1/1.4] w-full max-w-md overflow-hidden rounded-2xl bg-black p-3.5 shadow-xl">
            <div className="relative h-full w-full overflow-hidden rounded-lg bg-white shadow-inner">
              {activeImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={activeImage}
                  alt={title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm text-foreground/40">
                  Şəkil yoxdur
                </div>
              )}
              <span className="absolute bottom-2 right-2 rounded-xs bg-black/50 px-2 py-0.5 text-[10px] text-white">
                A4 Ölçü
              </span>
            </div>
          </div>

          {/* Thumbnail Gallery (if multiple images) */}
          {images.length > 1 && (
            <div className="flex justify-center gap-2 overflow-x-auto pb-2">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setActiveImageIndex(i)}
                  className={`aspect-[1/1.4] w-14 overflow-hidden rounded-lg border-2 transition-all ${
                    i === activeImageIndex
                      ? "border-gold scale-105 shadow-xs"
                      : "border-border/80 opacity-70 hover:opacity-100"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url_thumb} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Details & WhatsApp Action */}
        <div className="space-y-6">
          <div className="space-y-2 border-b border-border/80 pb-5">
            <div className="flex items-center gap-3">
              <span className="rounded-md bg-foreground px-2.5 py-1 font-mono text-xs font-bold text-surface">
                {product.code}
              </span>
              <span className="text-xs text-foreground/50">
                👁 {product.view_count} {t("views")}
              </span>
            </div>
            <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {title}
            </h1>
            {(() => {
              const col = Array.isArray(product.collections)
                ? product.collections[0]
                : product.collections;
              if (!col) return null;
              return (
                <p className="text-sm font-medium text-gold">
                  Kolleksiya:{" "}
                  <Link
                    href={`/collection/${col.slug}`}
                    className="underline underline-offset-4 hover:text-foreground"
                  >
                    {pickL10n(col.name, locale)}
                  </Link>
                </p>
              );
            })()}
          </div>

          {/* Pricing */}
          <div className="rounded-2xl border border-border bg-surface p-5 space-y-3">
            <div className="flex items-baseline gap-3">
              {salePrice != null ? (
                <>
                  <span className="text-3xl font-extrabold text-sale">
                    {salePrice} {currency}
                  </span>
                  <s className="text-lg text-sale/70">
                    {price} {currency}
                  </s>
                  <span className="rounded-md bg-sale/15 px-2 py-0.5 text-xs font-bold text-sale">
                    Xüsusi Təklif
                  </span>
                </>
              ) : price != null ? (
                <span className="text-3xl font-bold text-foreground">
                  {price} {currency}
                </span>
              ) : (
                <span className="text-lg text-foreground/70">
                  {t("priceOnRequest")}
                </span>
              )}
            </div>

            {/* Variants Selector (e.g. Dimensions / Frame type) */}
            {variants.length > 0 && (
              <div className="pt-2 space-y-2 border-t border-border/60">
                <label className="text-xs font-semibold uppercase tracking-wider text-foreground/60">
                  {t("variants")}:
                </label>
                <div className="flex flex-wrap gap-2">
                  {variants.map((v) => {
                    const isSelected = v.id === selectedVariantId;
                    const vLabel = pickL10n(v.label, locale);
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVariantId(v.id)}
                        className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition-all ${
                          isSelected
                            ? "border-gold bg-gold/15 text-gold font-bold shadow-xs"
                            : "border-border bg-surface text-foreground hover:bg-background"
                        }`}
                      >
                        {vLabel} — {v.sale_price ?? v.price} {currency}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Primary Action: Direct WhatsApp Order */}
          <div className="space-y-3">
            <a
              href={orderUrl}
              onClick={handleOrderClick}
              target="_blank"
              rel="noopener noreferrer"
              suppressHydrationWarning
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-6 py-4 text-base font-bold text-white shadow-md transition-all hover:bg-[#1ebd5b] hover:shadow-lg active:scale-98"
            >
              <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.587-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.079-2.115-.512-1.815-.755-2.986-2.607-3.076-2.727-.089-.12-1.077-1.433-1.077-2.732 0-1.301.683-1.939.924-2.204.24-.265.526-.331.701-.331.175 0 .351.002.506.01.164.009.385-.062.602.46.222.535.759 1.849.825 1.983.067.135.112.293.022.472-.089.179-.134.291-.268.448-.134.156-.282.348-.403.468-.134.133-.274.278-.119.544.156.266.691 1.139 1.482 1.843 1.016.905 1.872 1.185 2.138 1.318.266.133.423.111.58-.069.156-.179.667-.777.845-1.045.178-.268.356-.223.593-.134.237.089 1.503.708 1.762.837.259.13.43.193.493.303.064.108.064.629-.08 1.034z" />
              </svg>
              <span>{t("orderNow")}</span>
            </a>
            <p className="text-center text-xs text-foreground/50">
              Qeydiyyatsız sifariş. Düyməyə kliklədikdə WhatsApp-da hazır mesaj açılacaq.
            </p>
          </div>

          {/* Description */}
          {desc && (
            <div className="space-y-2 rounded-2xl border border-border bg-surface p-5">
              <h2 className="text-sm font-semibold text-foreground">
                {t("details")}
              </h2>
              <p className="whitespace-pre-line text-sm text-foreground/75 leading-relaxed">
                {desc}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Related Products in the same collection */}
      {related.length > 0 && (
        <section className="space-y-5 border-t border-border pt-10">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl font-bold text-foreground">
              {t("inCollection")}
            </h2>
            {(() => {
              const col = Array.isArray(product.collections)
                ? product.collections[0]
                : product.collections;
              if (!col) return null;
              return (
                <Link
                  href={`/collection/${col.slug}`}
                  className="text-xs font-semibold text-gold hover:underline"
                >
                  Kolleksiyanı vərəqlə 📖
                </Link>
              );
            })()}
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {related.map((r) => (
              <ProductCard key={r.id} product={r} whatsappUrl={whatsappUrl} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
