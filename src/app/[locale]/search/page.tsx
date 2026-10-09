import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { searchCatalog, getSiteSettings } from "@/lib/data";
import { ProductCard } from "@/components/ProductCard";
import { pickL10n } from "@/lib/forms";

export default async function SearchPage({
  params,
  searchParams,
}: PageProps<"/[locale]/search">) {
  const { locale } = await params;
  const { q } = await searchParams;
  setRequestLocale(locale);

  const t = await getTranslations("search");
  const query = (Array.isArray(q) ? q[0] : q) ?? "";

  const [data, settings] = await Promise.all([
    searchCatalog(query),
    getSiteSettings(),
  ]);

  const totalResults = data.collections.length + data.products.length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8 border-b border-border/80 pb-4">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground">
          {t("title")}
        </h1>
        {query && (
          <p className="mt-1 text-sm text-foreground/60">
            &ldquo;{query}&rdquo; {t("queryFor")} ({totalResults})
          </p>
        )}
      </div>

      {totalResults > 0 ? (
        <div className="space-y-12">
          {/* Matching Collections */}
          {data.collections.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <h2 className="font-serif text-xl font-bold tracking-tight text-foreground">
                  Kolleksiyalar ({data.collections.length})
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {data.collections.map((col) => {
                  const name = pickL10n(col.name, locale);
                  const desc = pickL10n(col.description, locale);
                  const previewImg =
                    col.cover_image ||
                    col.products?.[0]?.product_images?.[0]?.url_thumb;

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
                        <span className="text-foreground/60">
                          {col.code ? `Kod: ${col.code}` : "A4 Tablolar"}
                        </span>
                        <span className="text-gold group-hover:translate-x-1 transition-transform">
                          Kolleksiyaya bax →
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* Matching Products */}
          {data.products.length > 0 && (
            <section className="space-y-4">
              {data.collections.length > 0 && (
                <div className="flex items-center justify-between border-b border-border/60 pb-2">
                  <h2 className="font-serif text-xl font-bold tracking-tight text-foreground">
                    Tablolar & Məhsullar ({data.products.length})
                  </h2>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {data.products.map((p) => (
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
      ) : (
        <div className="rounded-2xl border border-border bg-surface p-12 text-center space-y-3">
          <p className="text-base text-foreground/70">{t("noResults")}</p>
          <p className="text-xs text-foreground/50">
            Axtarış üçün nümunələr:{" "}
            <span className="font-medium text-gold">Demon Slayer</span>,{" "}
            <span className="font-medium text-gold">Attack on Titan</span>,{" "}
            <span className="font-medium text-gold">Naruto</span>,{" "}
            <span className="font-medium text-gold">AOT-001</span>,{" "}
            <span className="font-medium text-gold">DS-001</span>
          </p>
        </div>
      )}
    </div>
  );
}
