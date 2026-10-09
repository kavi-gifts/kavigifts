import { createServerClient } from "@supabase/ssr";

export function getPublicSupabase() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {},
      },
    },
  );
}

export type CategoryNode = {
  id: string;
  parent_id: string | null;
  name: Record<string, string>;
  slug: string;
  image_url: string | null;
  sort_order: number;
  children: CategoryNode[];
  collections: {
    id: string;
    name: Record<string, string>;
    slug: string;
    cover_image: string | null;
    is_featured: boolean;
    bundle_price: number | null;
    bundle_sale_price: number | null;
  }[];
};

export async function getSiteSettings() {
  const supabase = getPublicSupabase();
  const { data } = await supabase
    .from("site_settings")
    .select("*")
    .eq("id", true)
    .maybeSingle();
  return (
    data ?? {
      site_name: "Kavi Gifts",
      whatsapp_url: "https://wa.me/514933326",
      instagram_url: "https://www.instagram.com/kavi.gifts_/",
      tiktok_url: "https://www.tiktok.com/@kavi.gifts_",
      watermark_text: "@kavi.gifts_",
    }
  );
}

export async function getCategoryTree(): Promise<CategoryNode[]> {
  const supabase = getPublicSupabase();
  const [{ data: cats }, { data: cols }] = await Promise.all([
    supabase
      .from("categories")
      .select("id,parent_id,name,slug,image_url,sort_order")
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("collections")
      .select("id,category_id,name,slug,cover_image,is_featured,bundle_price,bundle_sale_price")
      .eq("is_active", true)
      .order("sort_order"),
  ]);

  const allCats = (cats ?? []) as (Omit<CategoryNode, "children" | "collections">)[];
  const allCols = cols ?? [];

  const map = new Map<string, CategoryNode>();
  for (const c of allCats) {
    map.set(c.id, {
      ...c,
      children: [],
      collections: allCols
        .filter((col) => col.category_id === c.id)
        .map((col) => ({
          id: col.id,
          name: col.name,
          slug: col.slug,
          cover_image: col.cover_image,
          is_featured: col.is_featured,
          bundle_price: col.bundle_price,
          bundle_sale_price: col.bundle_sale_price,
        })),
    });
  }

  const roots: CategoryNode[] = [];
  for (const node of map.values()) {
    if (node.parent_id && map.has(node.parent_id)) {
      map.get(node.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

export async function getFeaturedCollections() {
  const supabase = getPublicSupabase();
  const { data } = await supabase
    .from("collections")
    .select(
      "id,name,slug,description,cover_image,bundle_price,bundle_sale_price,currency,categories(name,slug),products(id,product_images(url_thumb))"
    )
    .eq("is_active", true)
    .order("sort_order")
    .limit(8);
  return data ?? [];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyCollectionPricing(list: any[]) {
  return list.map((p) => {
    const col = Array.isArray(p.collections) ? p.collections[0] : p.collections;
    const base = p.base_price ?? col?.bundle_price ?? null;
    const sale =
      p.base_price != null
        ? p.sale_price
        : (col?.bundle_sale_price ?? p.sale_price);
    return {
      ...p,
      base_price: base,
      sale_price: sale,
    };
  });
}

export async function getHomeProducts() {
  const supabase = getPublicSupabase();
  const { data: featured } = await supabase
    .from("products")
    .select(
      "id,code,title,slug,type,base_price,sale_price,currency,is_featured,view_count,categories(name,slug),collections(name,slug,bundle_price,bundle_sale_price),product_images(url_thumb,url_medium,sort_order)"
    )
    .eq("is_active", true)
    .eq("is_featured", true)
    .order("sort_order")
    .limit(8);

  return {
    featured: applyCollectionPricing(featured ?? []),
  };
}

export async function getCollectionBySlug(slug: string) {
  const supabase = getPublicSupabase();
  let { data: col, error } = await supabase
    .from("collections")
    .select(
      "id,name,code,slug,description,cover_image,bundle_price,bundle_sale_price,currency,is_featured,category_id,categories(id,name,slug)"
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (error && error.code === "42703") {
    const res = await supabase
      .from("collections")
      .select(
        "id,name,slug,description,cover_image,bundle_price,bundle_sale_price,currency,is_featured,category_id,categories(id,name,slug)"
      )
      .eq("slug", slug)
      .eq("is_active", true)
    col = (res.data ? { ...res.data, code: null } : null) as typeof col;
  }

  if (!col) return null;

  const { data: products } = await supabase
    .from("products")
    .select(
      "id,code,title,slug,type,description,base_price,sale_price,currency,sort_order,product_variants(id,label,price,sale_price),product_images(id,url_thumb,url_medium,url_large,sort_order)"
    )
    .eq("collection_id", col.id)
    .eq("is_active", true)
    .order("sort_order");

  return {
    ...col,
    products: products ?? [],
  };
}

export async function getCategoryBySlug(slug: string) {
  const supabase = getPublicSupabase();
  const { data: cat } = await supabase
    .from("categories")
    .select("id,parent_id,name,slug,image_url")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (!cat) return null;

  const [{ data: subcats }, { data: cols }, { data: products }] = await Promise.all([
    supabase
      .from("categories")
      .select("id,name,slug,image_url")
      .eq("parent_id", cat.id)
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("collections")
      .select("id,name,slug,cover_image,bundle_price,bundle_sale_price,currency")
      .eq("category_id", cat.id)
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("products")
      .select(
        "id,code,title,slug,type,base_price,sale_price,currency,is_featured,view_count,collections(name,slug,bundle_price,bundle_sale_price),product_images(url_thumb,url_medium,sort_order)"
      )
      .eq("category_id", cat.id)
      .eq("is_active", true)
      .order("sort_order"),
  ]);

  return {
    ...cat,
    subcategories: subcats ?? [],
    collections: cols ?? [],
    products: applyCollectionPricing(products ?? []),
  };
}

export async function getProductBySlug(slug: string) {
  const supabase = getPublicSupabase();
  const { data: prod } = await supabase
    .from("products")
    .select(
      "id,code,title,slug,type,description,base_price,sale_price,currency,view_count,categories(id,name,slug),collections(id,name,slug,bundle_price,bundle_sale_price),product_variants(id,label,price,sale_price,sku),product_images(id,url_thumb,url_medium,url_large,sort_order)"
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (!prod) return null;

  // Inherit collection price and description if not overridden individually
  const col = Array.isArray(prod.collections)
    ? prod.collections[0]
    : prod.collections;
  if (col) {
    if (prod.base_price == null && col.bundle_price != null) {
      prod.base_price = col.bundle_price;
      prod.sale_price = col.bundle_sale_price;
    }
  }

  let related: typeof prod[] = [];
  if (col?.id) {
    const { data: rel } = await supabase
      .from("products")
      .select(
        "id,code,title,slug,type,base_price,sale_price,currency,product_images(url_thumb,sort_order)"
      )
      .eq("collection_id", col.id)
      .eq("is_active", true)
      .neq("id", prod.id)
      .limit(4);
    related = (rel ?? []).map((r) => ({
      ...r,
      base_price: r.base_price ?? col.bundle_price,
      sale_price:
        r.base_price != null
          ? r.sale_price
          : (col.bundle_sale_price ?? r.sale_price),
      collections: col,
    })) as unknown as typeof prod[];
  }

  return {
    product: prod,
    related,
  };
}

export type SearchResults = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  collections: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  products: any[];
};

export async function searchCatalog(q: string): Promise<SearchResults> {
  const clean = q.trim();
  if (!clean) return { collections: [], products: [] };
  const supabase = getPublicSupabase();

  // 1. Ağıllı Kod Normalizasiyası: məs. "AOT-1", "AOT 1", "AOT1", "DS 15", "15"
  const codeCandidates: string[] = [];
  const codeMatch = clean.match(/^([a-zA-Z]+)[-_ ]*([0-9]+)$/);
  if (codeMatch) {
    const prefix = codeMatch[1].toUpperCase();
    const num = parseInt(codeMatch[2], 10);
    codeCandidates.push(`${prefix}-${String(num).padStart(3, "0")}`);
    codeCandidates.push(`${prefix}-${String(num).padStart(2, "0")}`);
    codeCandidates.push(`${prefix}-${num}`);
  } else if (/^\d+$/.test(clean)) {
    const num = parseInt(clean, 10);
    codeCandidates.push(`-${String(num).padStart(3, "0")}`);
    codeCandidates.push(`-${String(num).padStart(2, "0")}`);
  }

  // 2. Kolleksiyaları axtar (ad, kod, slug, təsvir üzrə)
  const { data: cols } = await supabase
    .from("collections")
    .select(
      "id,name,code,slug,description,cover_image,bundle_price,bundle_sale_price,currency,categories(name,slug),products(id,product_images(url_thumb))"
    )
    .eq("is_active", true)
    .or(
      `name->>az.ilike.%${clean}%,name->>en.ilike.%${clean}%,name->>ru.ilike.%${clean}%,code.ilike.%${clean}%,slug.ilike.%${clean}%,description->>az.ilike.%${clean}%`
    )
    .limit(8);

  const colIds = (cols ?? []).map((c) => c.id);

  // 3. Kateqoriyaları axtar (əgər "Anime" və ya "Tablo" axtarılıbsa)
  const { data: cats } = await supabase
    .from("categories")
    .select("id")
    .eq("is_active", true)
    .or(
      `name->>az.ilike.%${clean}%,name->>en.ilike.%${clean}%,name->>ru.ilike.%${clean}%,slug.ilike.%${clean}%`
    );

  const catIds = (cats ?? []).map((c) => c.id);

  // 4. Məhsulları axtar
  const orConditions = [
    `code.ilike.%${clean}%`,
    `title->>az.ilike.%${clean}%`,
    `title->>en.ilike.%${clean}%`,
    `title->>ru.ilike.%${clean}%`,
    `slug.ilike.%${clean}%`,
  ];
  for (const c of codeCandidates) {
    if (c.startsWith("-")) {
      orConditions.push(`code.ilike.%${c}%`);
    } else {
      orConditions.push(`code.eq.${c}`);
    }
  }
  if (colIds.length > 0) {
    orConditions.push(`collection_id.in.(${colIds.join(",")})`);
  }
  if (catIds.length > 0) {
    orConditions.push(`category_id.in.(${catIds.join(",")})`);
  }

  const { data: prods } = await supabase
    .from("products")
    .select(
      "id,code,title,slug,type,base_price,sale_price,currency,is_featured,view_count,collections(name,slug,bundle_price,bundle_sale_price),categories(name,slug),product_images(url_thumb,url_medium,sort_order)"
    )
    .eq("is_active", true)
    .or(orConditions.join(","))
    .limit(80);

  // Dəqiq kod uyğunluğunu ən birinci sıraya qoy
  const upperClean = clean.toUpperCase();
  const sortedProds = (prods ?? []).sort((a, b) => {
    const aCode = String(a.code).toUpperCase();
    const bCode = String(b.code).toUpperCase();
    if (codeCandidates.includes(aCode) && !codeCandidates.includes(bCode)) return -1;
    if (!codeCandidates.includes(aCode) && codeCandidates.includes(bCode)) return 1;
    if (aCode === upperClean && bCode !== upperClean) return -1;
    if (bCode === upperClean && aCode !== upperClean) return 1;
    return 0;
  });

  return {
    collections: cols ?? [],
    products: applyCollectionPricing(sortedProds),
  };
}

export async function searchProducts(q: string) {
  const res = await searchCatalog(q);
  return res.products;
}

export async function getStaticPage(key: string) {
  const supabase = getPublicSupabase();
  const { data } = await supabase
    .from("pages")
    .select("content,updated_at")
    .eq("key", key)
    .maybeSingle();
  return data;
}
