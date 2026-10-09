import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getCollectionBySlug, getCategoryTree, getSiteSettings } from "@/lib/data";
import { CategorySidebar } from "@/components/CategorySidebar";
import { CollectionFlipbook } from "@/components/CollectionFlipbook";

export default async function CollectionPage({
  params,
}: PageProps<"/[locale]/collection/[slug]">) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const [collection, tree, settings] = await Promise.all([
    getCollectionBySlug(slug),
    getCategoryTree(),
    getSiteSettings(),
  ]);

  if (!collection) notFound();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-4">
        {/* Left Category Sidebar */}
        <div className="hidden lg:col-span-1 lg:block lg:sticky lg:top-20">
          <CategorySidebar tree={tree} currentCollectionSlug={slug} />
        </div>

        {/* Main Flipbook Lookbook */}
        <div className="lg:col-span-3">
          <CollectionFlipbook
            collection={collection}
            whatsappUrl={settings.whatsapp_url}
          />
        </div>
      </div>
    </div>
  );
}
