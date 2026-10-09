"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { bool, num, readL10n, slugify, str, withTranslations } from "@/lib/forms";
import { processAndUpload, removeImageFiles } from "@/lib/images";

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

  let sortOrder = num(formData, "sort_order");
  if (sortOrder === null) {
    if (!id) {
      const { data: allCols } = await supabase
        .from("collections")
        .select("sort_order");
      const maxSort = (allCols ?? []).reduce(
        (m, c) => (typeof c.sort_order === "number" && c.sort_order > m ? c.sort_order : m),
        -1
      );
      sortOrder = maxSort + 1;
    } else {
      sortOrder = 0;
    }
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
    sort_order: sortOrder,
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
  const id = str(formData, "id");
  if (!id) redirect("/admin/collections");

  // 1. Kolleksiyaya aid məhsulları və onların şəkillərini storage-dən təmizlə
  const { data: prods } = await supabase
    .from("products")
    .select("id")
    .eq("collection_id", id);

  if (prods && prods.length > 0) {
    const prodIds = prods.map((p) => p.id);
    const { data: imgs } = await supabase
      .from("product_images")
      .select("url_thumb,url_medium,url_large")
      .in("product_id", prodIds);

    await supabase.from("products").delete().in("id", prodIds);

    if (imgs && imgs.length > 0) {
      await removeImageFiles(
        supabase,
        imgs.flatMap((i) => [i.url_thumb, i.url_medium, i.url_large])
      );
    }
  }

  // 2. Kolleksiyanın özünü sil
  const { error } = await supabase.from("collections").delete().eq("id", id);
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

    // 3. Kolleksiyanın kod prefiksi (məs. AOT, DS)
    const prefix = ((col as { code?: string }).code || "TAB").trim().toUpperCase();

    // 4. Əgər fayl adında birbaşa nömrə varsa (məs. DS-001, DS-1, DS_001, 001, 1), həmin nömrəni istifadə et!
    const numMatch =
      cleanTitle.match(new RegExp(`^(?:${prefix}[-_ ]*)?0*(\\d+)$`, "i")) ||
      cleanTitle.match(/\b0*(\d+)\b/);

    let targetCode = "";
    if (numMatch && numMatch[1]) {
      const parsedNum = parseInt(numMatch[1], 10);
      if (Number.isFinite(parsedNum) && parsedNum > 0) {
        targetCode = `${prefix}-${String(parsedNum).padStart(3, "0")}`;
      }
    }

    // Əgər fayl adından nömrə çıxmadısa, bazadakı mövcud məhsulların ən böyük nömrəsindən sonrakını təyin et
    if (!targetCode) {
      const { data: allPrefixProds } = await supabase
        .from("products")
        .select("code")
        .ilike("code", `${prefix}-%`);

      let maxNum = 0;
      const regex = new RegExp(`^${prefix}-(\\d+)$`, "i");
      for (const p of allPrefixProds ?? []) {
        const match = String(p.code).match(regex);
        if (match) {
          const n = parseInt(match[1], 10);
          if (Number.isFinite(n) && n > maxNum) maxNum = n;
        }
      }
      targetCode = `${prefix}-${String(maxNum + 1).padStart(3, "0")}`;
    }

    // 5. Yoxla: Bu kodla məhsul artıq mövcuddurmu?
    const { data: existingProd } = await supabase
      .from("products")
      .select("id, collection_id")
      .eq("code", targetCode)
      .maybeSingle();

    let productId = "";
    const titleL10n = await withTranslations({ az: cleanTitle });
    const slug = slugify(`${cleanTitle}-${targetCode}`);

    if (existingProd) {
      if (!existingProd.collection_id || existingProd.collection_id === col.id) {
        // Bu məhsul artıq bu kolleksiyaya aiddir və ya orphaned qalıb -> məlumatlarını yeniləyirik
        await supabase
          .from("products")
          .update({
            collection_id: col.id,
            category_id: col.category_id,
            title: titleL10n,
            slug,
            description: col.description,
            base_price: col.bundle_price,
            sale_price: col.bundle_sale_price,
            currency: col.currency ?? "AZN",
            is_active: true,
          })
          .eq("id", existingProd.id);
        productId = existingProd.id;
      } else {
        // Bu kod başqa bir kolleksiyaya aiddir -> sərbəst unikal kod tap
        const { data: allCodes } = await supabase
          .from("products")
          .select("code")
          .ilike("code", `${prefix}-%`);
        const usedCodes = new Set((allCodes ?? []).map((c) => String(c.code).toUpperCase()));
        let candidateSeq = 1;
        while (usedCodes.has(`${prefix}-${String(candidateSeq).padStart(3, "0")}`)) {
          candidateSeq++;
        }
        targetCode = `${prefix}-${String(candidateSeq).padStart(3, "0")}`;
        const newSlug = slugify(`${cleanTitle}-${targetCode}`);

        const { data: newProd, error: pErr } = await supabase
          .from("products")
          .insert({
            category_id: col.category_id,
            collection_id: col.id,
            type: "tablo",
            code: targetCode,
            title: titleL10n,
            slug: newSlug,
            description: col.description,
            base_price: col.bundle_price,
            sale_price: col.bundle_sale_price,
            currency: col.currency ?? "AZN",
            is_active: true,
          })
          .select("id")
          .single();
        if (pErr || !newProd) return { ok: false, error: pErr?.message ?? "Məhsul yaradıla bilmədi." };
        productId = newProd.id;
      }
    } else {
      // Kod sərbəstdir -> yeni məhsul yaradırıq
      const { data: newProd, error: pErr } = await supabase
        .from("products")
        .insert({
          category_id: col.category_id,
          collection_id: col.id,
          type: "tablo",
          code: targetCode,
          title: titleL10n,
          slug,
          description: col.description,
          base_price: col.bundle_price,
          sale_price: col.bundle_sale_price,
          currency: col.currency ?? "AZN",
          is_active: true,
        })
        .select("id")
        .single();
      if (pErr || !newProd) return { ok: false, error: pErr?.message ?? "Məhsul yaradıla bilmədi." };
      productId = newProd.id;
    }

    // 6. Şəkli sıx və yüklə
    const urls = await processAndUpload(supabase, file);

    // 7. Əgər bu məhsulun köhnə şəkli varsa, əvəzlə və köhnə faylları storage-dən sil
    const { data: existingImgs } = await supabase
      .from("product_images")
      .select("id, url_thumb, url_medium, url_large")
      .eq("product_id", productId);

    if (existingImgs && existingImgs.length > 0) {
      await supabase
        .from("product_images")
        .update({
          ...urls,
          sort_order: 0,
        })
        .eq("id", existingImgs[0].id);

      await removeImageFiles(
        supabase,
        [existingImgs[0].url_thumb, existingImgs[0].url_medium, existingImgs[0].url_large]
      );
    } else {
      await supabase.from("product_images").insert({
        product_id: productId,
        ...urls,
        sort_order: 0,
      });
    }

    revalidatePath("/", "layout");
    return { ok: true, code: targetCode, title: cleanTitle };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Yükləmə xətası.",
    };
  }
}

