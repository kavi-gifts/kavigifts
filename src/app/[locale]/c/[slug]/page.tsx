import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCategoryBySlug, getCategoryTree, getSiteSettings } from "@/lib/data";
import { CategorySidebar } from "@/components/CategorySidebar";
import { ProductCard } from "@/components/ProductCard";
import { pickL10n } from "@/lib/forms";

export default async function CategoryPage({
  params,
}: PageProps<"/[locale]/c/[slug]">) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const [cat, tree, settings] = await Promise.all([
    getCategoryBySlug(slug),
    getCategoryTree(),
    getSiteSettings(),
  ]);

  if (!cat) notFound();

  const title = pickL10n(cat.name, locale);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-4">
        {/* Left Category Sidebar */}
        <div className="hidden lg:col-span-1 lg:block lg:sticky lg:top-20">
          <CategorySidebar tree={tree} currentCategorySlug={slug} />
        </div>

        {/* Category Content */}
        <div className="space-y-10 lg:col-span-3">
          <div className="border-b border-border/80 pb-4">
            <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              {title}
            </h1>
          </div>

          {/* Subcategories (if any) */}
          {cat.subcategories.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground/50">
                Alt Kateqoriyalar
              </h2>
              <div className="flex flex-wrap gap-2">
                {cat.subcategories.map((sub) => (
                  <Link
                    key={sub.id}
                    href={`/c/${sub.slug}`}
                    className="rounded-full border border-border bg-surface px-4 py-2 text-xs font-medium text-foreground transition-all hover:border-gold hover:bg-gold/5"
                  >
                    {pickL10n(sub.name, locale)} →
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Collections under this category (e.g. Attack on Titan) */}
          {cat.collections.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground/50">
                Kolleksiyalar
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {cat.collections.map((col) => {
                  const colName = pickL10n(col.name, locale);
                  return (
                    <Link
                      key={col.id}
                      href={`/collection/${col.slug}`}
                      className="group flex items-center justify-between rounded-2xl border border-border bg-surface p-4 transition-all hover:border-gold/60 hover:shadow-md"
                    >
                      <div>
                        <h3 className="font-serif text-lg font-bold text-foreground group-hover:text-gold transition-colors">
                          {colName}
                        </h3>
                        <p className="text-xs text-foreground/60">
                          Kolleksiyaya baxın
                        </p>
                      </div>
                      <span className="rounded-full bg-foreground px-3 py-1.5 text-xs font-medium text-surface transition-transform group-hover:scale-105">
                        Kataloq 📖
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Products in this category */}
          <div className="space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-foreground/50">
              Məhsullar ({cat.products.length})
            </h2>
            {cat.products.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {cat.products.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    whatsappUrl={settings.whatsapp_url}
                  />
                ))}
              </div>
            ) : (
              <p className="rounded-xl border border-border bg-surface p-8 text-center text-sm text-foreground/60">
                Bu kateqoriyada birbaşa məhsul yoxdur (yuxarıdakı kolleksiyalara daxil olun).
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
