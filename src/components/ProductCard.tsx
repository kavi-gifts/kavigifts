"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { buildWhatsAppProductUrl } from "@/lib/whatsapp";
import { pickL10n } from "@/lib/forms";

export type ProductCardData = {
  id: string;
  code: string;
  title: unknown;
  slug: string;
  type: string;
  base_price?: number | null;
  sale_price?: number | null;
  currency?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  categories?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  collections?: any;
  product_images?: { url_thumb: string; sort_order: number }[] | null;
};

export function ProductCard({
  product,
  whatsappUrl,
}: {
  product: ProductCardData;
  whatsappUrl: string;
}) {
  const locale = useLocale();
  const t = useTranslations("product");

  const title = pickL10n(product.title, locale);
  const images = [...(product.product_images ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order
  );
  const thumbUrl = images[0]?.url_thumb;
  const currency = product.currency ?? "AZN";

  const colObj = Array.isArray(product.collections)
    ? product.collections[0]
    : product.collections;
  const colName = colObj?.name ? pickL10n(colObj.name, locale) : "";

  const defaultOrigin = process.env.NEXT_PUBLIC_SITE_URL || "";
  const productUrl = `${defaultOrigin}/${locale}/p/${product.slug}`;

  const orderUrl = buildWhatsAppProductUrl(
    whatsappUrl,
    {
      code: product.code,
      title,
      price: product.base_price,
      salePrice: product.sale_price,
      currency,
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
          price: product.base_price,
          salePrice: product.sale_price,
          currency,
          productUrl: `${window.location.origin}/${locale}/p/${product.slug}`,
        },
        locale
      );
    }
  }

  return (
    <div className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-surface p-3 transition-all duration-300 hover:border-gold/50 hover:shadow-lg">
      <div>
        {/* Frame / Artwork container with realistic A4 aspect ratio (1:1.41) */}
        <Link
          href={`/p/${product.slug}`}
          className="relative block aspect-[1/1.38] w-full overflow-hidden rounded-xl bg-[#F0ECE1] shadow-inner"
        >
          {thumbUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumbUrl}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-foreground/40">
              Şəkil yoxdur
            </div>
          )}

          {/* Code badge */}
          <span className="absolute left-2.5 top-2.5 rounded-md bg-surface/90 px-2 py-0.5 font-mono text-xs font-semibold text-foreground shadow-xs backdrop-blur-xs">
            {product.code}
          </span>

          {/* Discount badge if on sale */}
          {product.sale_price != null && (
            <span className="absolute right-2.5 top-2.5 rounded-md bg-sale px-2 py-0.5 text-xs font-semibold text-white shadow-xs">
              Endirim
            </span>
          )}
        </Link>

        {/* Metadata */}
        <div className="mt-3 space-y-1">
          {Boolean(colName) && (
            <p className="text-xs font-medium text-gold">{colName}</p>
          )}

          <Link
            href={`/p/${product.slug}`}
            className="line-clamp-2 text-sm font-semibold text-foreground hover:text-gold"
          >
            {title}
          </Link>
        </div>
      </div>

      {/* Pricing & Order CTA */}
      <div className="mt-4 border-t border-border/60 pt-3">
        <div className="mb-2.5 flex items-baseline justify-between">
          <div>
            {product.sale_price != null ? (
              <div className="flex items-baseline gap-2">
                <span className="text-base font-bold text-sale">
                  {product.sale_price} {currency}
                </span>
                <s className="text-xs text-sale/70">
                  {product.base_price} {currency}
                </s>
              </div>
            ) : product.base_price != null ? (
              <span className="text-base font-semibold text-foreground">
                {product.base_price} {currency}
              </span>
            ) : (
              <span className="text-xs text-foreground/60">
                {t("priceOnRequest")}
              </span>
            )}
          </div>
        </div>

        <a
          href={orderUrl}
          onClick={handleOrderClick}
          target="_blank"
          rel="noopener noreferrer"
          suppressHydrationWarning
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-foreground py-2 text-xs font-medium text-surface transition-all hover:bg-gold"
        >
          <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
            <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.587-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.079-2.115-.512-1.815-.755-2.986-2.607-3.076-2.727-.089-.12-1.077-1.433-1.077-2.732 0-1.301.683-1.939.924-2.204.24-.265.526-.331.701-.331.175 0 .351.002.506.01.164.009.385-.062.602.46.222.535.759 1.849.825 1.983.067.135.112.293.022.472-.089.179-.134.291-.268.448-.134.156-.282.348-.403.468-.134.133-.274.278-.119.544.156.266.691 1.139 1.482 1.843 1.016.905 1.872 1.185 2.138 1.318.266.133.423.111.58-.069.156-.179.667-.777.845-1.045.178-.268.356-.223.593-.134.237.089 1.503.708 1.762.837.259.13.43.193.493.303.064.108.064.629-.08 1.034z" />
          </svg>
          <span>{t("orderNow")}</span>
        </a>
      </div>
    </div>
  );
}
