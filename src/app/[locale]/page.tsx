import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  getCategoryTree,
  getFeaturedCollections,
  getHomeProducts,
  getSiteSettings,
} from "@/lib/data";
import { CategorySidebar } from "@/components/CategorySidebar";
import { ProductCard } from "@/components/ProductCard";
import { pickL10n } from "@/lib/forms";

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("home");
  const [tree, collections, products, settings] = await Promise.all([
    getCategoryTree(),
    getFeaturedCollections(),
    getHomeProducts(),
    getSiteSettings(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Main Grid: Left Category Sidebar + Right Product Showcase */}
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-4">
        {/* Left Sticky Sidebar on Desktop */}
        <div className="lg:col-span-1 lg:sticky lg:top-20">
          <CategorySidebar tree={tree} />
        </div>

        {/* Right Main Showcase */}
        <div className="space-y-12 lg:col-span-3">
          {/* Featured Collections Carousel / Grid */}
          <section id="collections" className="space-y-4">
            <div className="flex items-center justify-between border-b border-border/80 pb-2">
              <h2 className="font-serif text-2xl font-bold tracking-tight text-foreground">
                {t("featuredCollections")}
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {collections.map((col) => {
                const name = pickL10n(col.name, locale);
                const desc = pickL10n(col.description, locale);
                const catName = col.categories
                  ? pickL10n(
                      (col.categories as unknown as { name: unknown }).name,
                      locale
                    )
                  : "";
                const previewImg =
                  col.cover_image ||
                  (
                    col.products as unknown as {
                      product_images: { url_thumb: string }[];
                    }[]
                  )?.[0]?.product_images?.[0]?.url_thumb;

                return (
                  <Link
                    key={col.id}
                    href={`/collection/${col.slug}`}
                    className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-surface p-5 transition-all hover:border-gold/60 hover:shadow-lg"
                  >
                    <div>
                      <div className="relative mb-4 aspect-[16/9] w-full overflow-hidden rounded-xl bg-[#F0ECE1]">
                        {previewImg ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={previewImg}
                            alt={name}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-foreground/40">
                            {name}
                          </div>
                        )}
                        <span className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-1 text-xs font-medium text-white backdrop-blur-xs">
                          📖 Kataloq kimi vərəqlə
                        </span>
                      </div>

                      {catName && (
                        <p className="text-xs font-medium text-gold">{catName}</p>
                      )}
                      <h3 className="font-serif text-xl font-bold text-foreground group-hover:text-gold transition-colors">
                        {name}
                      </h3>
                      {desc && (
                        <p className="mt-1 line-clamp-2 text-xs text-foreground/70">
                          {desc}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-xs font-semibold">
                      <span className="text-foreground/60">A4 Tablolar</span>
                      <span className="text-gold group-hover:translate-x-1 transition-transform">
                        Kolleksiyaya bax →
                      </span>
                    </div>
                  </Link>
                );
              })}

              {!collections.length && (
                <p className="col-span-2 rounded-xl border border-border bg-surface p-6 text-center text-sm text-foreground/60">
                  Hələlik kolleksiya əlavə olunmayıb.
                </p>
              )}
            </div>
          </section>

          {/* Recommended Products (yalnız tövsiyə olunan məhsul olduqda göstərilir) */}
          {products.featured.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between border-b border-border/80 pb-2">
                <h2 className="font-serif text-2xl font-bold tracking-tight text-foreground">
                  {t("featured")}
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {products.featured.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    whatsappUrl={settings.whatsapp_url}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
