import type { MetadataRoute } from "next";
import { getPublicSupabase } from "@/lib/data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://kavigifts.az";
  const supabase = getPublicSupabase();

  const [{ data: categories }, { data: collections }, { data: products }] =
    await Promise.all([
      supabase.from("categories").select("slug, updated_at").eq("is_active", true),
      supabase.from("collections").select("slug, updated_at").eq("is_active", true),
      supabase.from("products").select("slug, updated_at").eq("is_active", true),
    ]);

  const locales = ["az", "ru", "en"];
  const staticRoutes = ["", "/about", "/contact"];

  const urls: MetadataRoute.Sitemap = [];

  // Static routes
  for (const route of staticRoutes) {
    for (const locale of locales) {
      urls.push({
        url: `${siteUrl}/${locale}${route}`,
        lastModified: new Date(),
        changeFrequency: route === "" ? "daily" : "monthly",
        priority: route === "" ? 1.0 : 0.7,
      });
    }
  }

  // Categories
  for (const cat of categories ?? []) {
    for (const locale of locales) {
      urls.push({
        url: `${siteUrl}/${locale}/c/${cat.slug}`,
        lastModified: cat.updated_at ? new Date(cat.updated_at) : new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  }

  // Collections
  for (const col of collections ?? []) {
    for (const locale of locales) {
      urls.push({
        url: `${siteUrl}/${locale}/collection/${col.slug}`,
        lastModified: col.updated_at ? new Date(col.updated_at) : new Date(),
        changeFrequency: "weekly",
        priority: 0.9,
      });
    }
  }

  // Products
  for (const prod of products ?? []) {
    for (const locale of locales) {
      urls.push({
        url: `${siteUrl}/${locale}/p/${prod.slug}`,
        lastModified: prod.updated_at ? new Date(prod.updated_at) : new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  }

  return urls;
}
