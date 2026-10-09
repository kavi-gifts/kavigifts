import { setRequestLocale, getTranslations } from "next-intl/server";
import { searchProducts, getSiteSettings } from "@/lib/data";
import { ProductCard } from "@/components/ProductCard";

export default async function SearchPage({
  params,
  searchParams,
}: PageProps<"/[locale]/search">) {
  const { locale } = await params;
  const { q } = await searchParams;
  setRequestLocale(locale);

  const t = await getTranslations("search");
  const query = (Array.isArray(q) ? q[0] : q) ?? "";

  const [results, settings] = await Promise.all([
    searchProducts(query),
    getSiteSettings(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8 border-b border-border/80 pb-4">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">
          {t("title")}
        </h1>
        {query && (
          <p className="mt-1 text-sm text-foreground/60">
            &ldquo;{query}&rdquo; {t("queryFor")} ({results.length})
          </p>
        )}
      </div>

      {results.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {results.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              whatsappUrl={settings.whatsapp_url}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-surface p-12 text-center">
          <p className="text-foreground/60">{t("noResults")}</p>
        </div>
      )}
    </div>
  );
}
