"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { bool, num, readL10n, slugify, str, withTranslations } from "@/lib/forms";
import { processAndUpload, removeImageFiles } from "@/lib/images";

const PREFIX: Record<string, string> = { tablo: "TAB", figure_3d: "FIG", other: "OTH" };

async function nextCode(
  supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"],
  type: string,
) {
  const prefix = PREFIX[type] ?? "OTH";
  const { data } = await supabase.from("products").select("code").like("code", `${prefix}-%`);
  const max = (data ?? []).reduce((m, r) => {
    const n = parseInt(String(r.code).split("-")[1] ?? "0", 10);
    return Number.isFinite(n) && n > m ? n : m;
  }, 0);
  return `${prefix}-${String(max + 1).padStart(3, "0")}`;
}

export async function saveProduct(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = str(formData, "id");
  const back = `/admin/products/${id || "new"}`;
  const fail = (m: string): never => redirect(`${back}?e=${encodeURIComponent(m)}`);

  const title = readL10n(formData, "title");
  if (!title) fail("Ad (AZ) məcburidir.");
  const categoryId = str(formData, "category_id");
  if (!categoryId) fail("Kateqoriya seçin.");
  const type = str(formData, "type");
  if (!PREFIX[type]) fail("Məhsul tipi yanlışdır.");
  const currency = str(formData, "currency");
  if (!["AZN", "USD", "EUR"].includes(currency)) fail("Valyuta yanlışdır.");

  const base = num(formData, "base_price");
  const sale = num(formData, "sale_price");
  if (sale !== null && (base === null || sale >= base)) {
    fail("Endirimli qiymət əsas qiymətdən kiçik olmalıdır.");
  }
  if ((base !== null && base < 0) || (sale !== null && sale < 0)) fail("Qiymət mənfi ola bilməz.");

  const desc = readL10n(formData, "description");
  const collectionId = str(formData, "collection_id") || null;
  let code = str(formData, "code").toUpperCase();
  if (!code) {
    if (collectionId) {
      const { data: col } = await supabase
        .from("collections")
        .select("code")
        .eq("id", collectionId)
        .maybeSingle();
      const prefix = ((col as { code?: string })?.code || "").trim().toUpperCase();
      if (prefix) {
        const { data: colProds } = await supabase
          .from("products")
          .select("code")
          .eq("collection_id", collectionId);
        let maxNum = 0;
        const regex = new RegExp(`^${prefix}-(\\d+)$`);
        for (const p of colProds ?? []) {
          const match = String(p.code).match(regex);
          if (match) {
            const n = parseInt(match[1], 10);
            if (Number.isFinite(n) && n > maxNum) maxNum = n;
          }
        }
        code = `${prefix}-${String(maxNum + 1).padStart(3, "0")}`;
      } else {
        code = await nextCode(supabase, type);
      }
    } else {
      code = await nextCode(supabase, type);
    }
  }

  const row = {
    category_id: categoryId,
    collection_id: collectionId,
    type,
    code,
    title: await withTranslations(title!),
    slug: slugify(str(formData, "slug") || `${title!.az}-${code}`),
    description: desc ? await withTranslations(desc) : null,
    base_price: base,
    sale_price: sale,
    currency,
    is_featured: bool(formData, "is_featured"),
    is_active: bool(formData, "is_active"),
    sort_order: num(formData, "sort_order") ?? 0,
  };

  if (id) {
    const { error } = await supabase.from("products").update(row).eq("id", id);
    if (error) fail(error.code === "23505" ? "Kod və ya slug artıq mövcuddur." : error.message);
    revalidatePath("/", "layout");
    redirect(`/admin/products/${id}?ok=1`);
  }
  const { data, error } = await supabase.from("products").insert(row).select("id").single();
  if (error) fail(error.code === "23505" ? "Kod və ya slug artıq mövcuddur." : error.message);
  revalidatePath("/", "layout");
  redirect(`/admin/products/${data!.id}?ok=1`);
}

export async function deleteProduct(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = str(formData, "id");
  const { data: imgs } = await supabase
    .from("product_images")
    .select("url_thumb,url_medium,url_large")
    .eq("product_id", id);
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) redirect(`/admin/products?e=${encodeURIComponent(error.message)}`);
  await removeImageFiles(supabase, (imgs ?? []).flatMap((i) => [i.url_thumb, i.url_medium, i.url_large]));
  revalidatePath("/", "layout");
  redirect("/admin/products");
}

export async function addVariant(formData: FormData) {
  const { supabase } = await requireAdmin();
  const productId = str(formData, "product_id");
  const back = `/admin/products/${productId}`;
  const label = readL10n(formData, "label");
  const price = num(formData, "price");
  const sale = num(formData, "sale_price");
  if (!label || price === null || price < 0) {
    redirect(`${back}?e=${encodeURIComponent("Variant adı (AZ) və qiymət məcburidir.")}`);
  }
  if (sale !== null && sale >= price!) {
    redirect(`${back}?e=${encodeURIComponent("Variantın endirimli qiyməti əsasdan kiçik olmalıdır.")}`);
  }
  const { error } = await supabase.from("product_variants").insert({
    product_id: productId,
    label: await withTranslations(label!),
    price,
    sale_price: sale,
    sku: str(formData, "sku") || null,
    sort_order: num(formData, "sort_order") ?? 0,
  });
  if (error) redirect(`${back}?e=${encodeURIComponent(error.message)}`);
  revalidatePath("/", "layout");
  redirect(`${back}?ok=1`);
}

export async function deleteVariant(formData: FormData) {
  const { supabase } = await requireAdmin();
  const productId = str(formData, "product_id");
  await supabase.from("product_variants").delete().eq("id", str(formData, "id"));
  revalidatePath("/", "layout");
  redirect(`/admin/products/${productId}`);
}

export type UploadResult = { ok: boolean; error?: string };

/** Klient tərəfdə sıxılmış şəkli qəbul edir (Vercel body limiti üçün 1 fayl / sorğu). */
export async function uploadImage(formData: FormData): Promise<UploadResult> {
  const { supabase } = await requireAdmin();
  const productId = str(formData, "product_id");
  const file = formData.get("file");
  if (!(file instanceof File) || !productId) return { ok: false, error: "Fayl tapılmadı." };
  try {
    const urls = await processAndUpload(supabase, file);
    const { data: last } = await supabase
      .from("product_images")
      .select("sort_order")
      .eq("product_id", productId)
      .order("sort_order", { ascending: false })
      .limit(1);
    const { error } = await supabase.from("product_images").insert({
      product_id: productId,
      ...urls,
      sort_order: (last?.[0]?.sort_order ?? -1) + 1,
    });
    if (error) return { ok: false, error: error.message };
    revalidatePath("/", "layout");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Yükləmə xətası." };
  }
}

export async function deleteImage(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = str(formData, "id");
  const productId = str(formData, "product_id");
  const { data: img } = await supabase.from("product_images").select("*").eq("id", id).maybeSingle();
  if (img) {
    await supabase.from("product_images").delete().eq("id", id);
    await removeImageFiles(supabase, [img.url_thumb, img.url_medium, img.url_large]);
  }
  revalidatePath("/", "layout");
  redirect(`/admin/products/${productId}`);
}

export async function makeFirstImage(formData: FormData) {
  const { supabase } = await requireAdmin();
  const productId = str(formData, "product_id");
  const { data: first } = await supabase
    .from("product_images")
    .select("sort_order")
    .eq("product_id", productId)
    .order("sort_order")
    .limit(1);
  await supabase
    .from("product_images")
    .update({ sort_order: (first?.[0]?.sort_order ?? 0) - 1 })
    .eq("id", str(formData, "id"));
  revalidatePath("/", "layout");
  redirect(`/admin/products/${productId}`);
}
