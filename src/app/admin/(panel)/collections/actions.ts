"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { bool, num, readL10n, slugify, str, withTranslations } from "@/lib/forms";
import { processAndUpload } from "@/lib/images";

export async function saveCollection(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = str(formData, "id");
  const name = readL10n(formData, "name");
  const back = `/admin/collections/${id || "new"}`;
  const fail = (m: string) => redirect(`${back}?e=${encodeURIComponent(m)}`);
  if (!name) fail("Ad (AZ) məcburidir.");
  const categoryId = str(formData, "category_id");
  if (!categoryId) fail("Kateqoriya seçin.");

  const rawCode = str(formData, "code").trim().toUpperCase();
  if (!rawCode) fail("Kolleksiya kodu məcburidir (məsələn: AOT, NAR, HP).");
  if (!/^[A-Z0-9_-]+$/.test(rawCode)) {
    fail("Kolleksiya kodu yalnız ingilis hərfləri, rəqəmlər və tire/alt xətt ola bilər.");
  }

  // Kodun unikallığını yoxla
  let query = supabase.from("collections").select("id").eq("code", rawCode);
  if (id) {
    query = query.neq("id", id);
  }
  const { data: duplicate } = await query.maybeSingle();
  if (duplicate) fail("Bu kolleksiya kodu artıq başqa kolleksiyada istifadə olunur.");

  const desc = readL10n(formData, "description");
  const price = num(formData, "bundle_price");
  const sale = num(formData, "bundle_sale_price");
  if (sale !== null && (price === null || sale >= price)) {
    fail("Endirimli qiymət əsas qiymətdən kiçik olmalıdır.");
  }
  const currency = str(formData, "currency");
  if (!["AZN", "USD", "EUR"].includes(currency)) fail("Valyuta yanlışdır.");

  // Əvvəlki kodu yoxla
  let oldCode: string | null = null;
  if (id) {
    const { data: existingCol } = await supabase
      .from("collections")
      .select("code")
      .eq("id", id)
      .maybeSingle();
    oldCode = existingCol?.code ?? null;
  }

  const row = {
    category_id: categoryId,
    code: rawCode,
    name: await withTranslations(name!),
    slug: slugify(str(formData, "slug") || name!.az),
    description: desc ? await withTranslations(desc) : null,
    bundle_price: price,
    bundle_sale_price: sale,
    currency,
    is_featured: bool(formData, "is_featured"),
    is_active: bool(formData, "is_active"),
    sort_order: num(formData, "sort_order") ?? 0,
  };

  const { error } = id
    ? await supabase.from("collections").update(row).eq("id", id)
    : await supabase.from("collections").insert(row);
  if (error) fail(error.code === "23505" ? "Bu slug və ya kod artıq mövcuddur." : error.message);

  // Əgər kod dəyişibsə, kolleksiyadakı bütün məhsulların kodlarını avtomatik ardıcıl yenilə!
  if (id && oldCode && oldCode !== rawCode) {
    const { data: prods } = await supabase
      .from("products")
      .select("id, code, title, slug, created_at")
      .eq("collection_id", id)
      .order("created_at", { ascending: true });

    if (prods && prods.length > 0) {
      // 1. Unikal xətanın qarşısını almaq üçün müvəqqəti prefiks veririk
      for (const p of prods) {
        await supabase
          .from("products")
          .update({ code: `TMP-${p.id.slice(0, 8)}-${Date.now()}` })
          .eq("id", p.id);
      }
      // 2. Yeni kolleksiya prefiksinə uyğun sıra ilə kod təyin edirik (məs: TITAN-001, TITAN-002, ...)
      for (let i = 0; i < prods.length; i++) {
        const p = prods[i];
        const seq = String(i + 1).padStart(3, "0");
        const newCode = `${rawCode}-${seq}`;
        const titleAz = (p.title as { az?: string })?.az ?? `Tablo-${seq}`;
        const newSlug = slugify(`${titleAz}-${newCode}`);
        await supabase
          .from("products")
          .update({ code: newCode, slug: newSlug })
          .eq("id", p.id);
      }
    }
  }

  revalidatePath("/", "layout");
  redirect("/admin/collections");
}

export async function deleteCollection(formData: FormData) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("collections").delete().eq("id", str(formData, "id"));
  if (error) redirect(`/admin/collections?e=${encodeURIComponent(error.message)}`);
  revalidatePath("/", "layout");
  redirect("/admin/collections");
}

export async function bulkUploadToCollection(formData: FormData) {
  const { supabase } = await requireAdmin();
  const collectionId = str(formData, "collection_id");
  const file = formData.get("file");
  const rawFileName =
    str(formData, "fileName") || (file instanceof File ? file.name : "Tablo");

  if (!(file instanceof File) || !collectionId) {
    return { ok: false, error: "Fayl və ya kolleksiya tapılmadı." };
  }

  try {
    // 1. Kolleksiya məlumatlarını götür
    const { data: col, error: colErr } = await supabase
      .from("collections")
      .select("id,category_id,code,name,description,bundle_price,bundle_sale_price,currency")
      .eq("id", collectionId)
      .single();

    if (colErr || !col) return { ok: false, error: "Kolleksiya tapılmadı." };

    // 2. Fayl adından genişlənməni təmizlə (.jpg, .png, .webp və s.)
    const cleanTitle =
      rawFileName.replace(/\.[a-zA-Z0-9]+$/, "").trim() || "Tablo";

    // 3. Kolleksiyanın kod prefiksinə uyğun sıra ilə unikal kod generasiya et (məs. AOT-001, AOT-002)
    const prefix = ((col as { code?: string }).code || "TAB").trim().toUpperCase();
    const { data: colProds } = await supabase
      .from("products")
      .select("code")
      .eq("collection_id", col.id);

    let maxNum = 0;
    const regex = new RegExp(`^${prefix}-(\\d+)$`);
    for (const p of colProds ?? []) {
      const match = String(p.code).match(regex);
      if (match) {
        const n = parseInt(match[1], 10);
        if (Number.isFinite(n) && n > maxNum) maxNum = n;
      }
    }
    const code = `${prefix}-${String(maxNum + 1).padStart(3, "0")}`;

    // 4. Başlıq və slug
    const titleL10n = await withTranslations({ az: cleanTitle });
    const slug = slugify(`${cleanTitle}-${code}`);

    // 5. Məhsulu kolleksiyanın təsviri və qiyməti ilə yarat
    const { data: newProd, error: prodErr } = await supabase
      .from("products")
      .insert({
        category_id: col.category_id,
        collection_id: col.id,
        type: "tablo",
        code,
        title: titleL10n,
        slug,
        description: col.description, // Kolleksiyanın haqqında mətni avtomatik şamil olunur
        base_price: col.bundle_price, // Kolleksiya qiyməti şamil olunur
        sale_price: col.bundle_sale_price, // Kolleksiya endirimi şamil olunur
        currency: col.currency ?? "AZN",
        is_active: true,
      })
      .select("id")
      .single();

    if (prodErr || !newProd) {
      return { ok: false, error: prodErr?.message ?? "Məhsul yaradıla bilmədi." };
    }

    // 6. Şəkli sıx və yüklə
    const urls = await processAndUpload(supabase, file);

    // 7. product_images cədvəlinə əlavə et
    await supabase.from("product_images").insert({
      product_id: newProd.id,
      ...urls,
      sort_order: 0,
    });

    revalidatePath("/", "layout");
    return { ok: true, code, title: cleanTitle };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Yükləmə xətası.",
    };
  }
}
