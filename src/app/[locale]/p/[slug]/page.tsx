import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getProductBySlug, getSiteSettings } from "@/lib/data";
import { ProductViewClient } from "./ProductViewClient";
import { createServerClient } from "@supabase/ssr";

async function incrementView(id: string) {
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => [], setAll: () => {} } }
    );
    await supabase.rpc("increment_product_view", { p_id: id });
  } catch {
    // Fail silently so view counter never breaks the page
  }
}

export default async function ProductPage({
  params,
}: PageProps<"/[locale]/p/[slug]">) {
  const { locale, slug } = await params;
  setRequestLocale(locale);

  const [data, settings] = await Promise.all([
    getProductBySlug(slug),
    getSiteSettings(),
  ]);

  if (!data?.product) notFound();

  // Fire view increment
  await incrementView(data.product.id);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <ProductViewClient
        product={data.product}
        related={data.related}
        whatsappUrl={settings.whatsapp_url}
      />
    </div>
  );
}
