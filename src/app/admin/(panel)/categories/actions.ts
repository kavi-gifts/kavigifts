"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { bool, num, readL10n, slugify, str, withTranslations } from "@/lib/forms";

export async function saveCategory(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = str(formData, "id");
  const name = readL10n(formData, "name");
  const back = `/admin/categories/${id || "new"}`;
  if (!name) redirect(`${back}?e=${encodeURIComponent("Ad (AZ) məcburidir.")}`);

  const slug = slugify(str(formData, "slug") || name.az);
  if (!slug) redirect(`${back}?e=${encodeURIComponent("Slug yaradıla bilmədi.")}`);

  const row = {
    name: await withTranslations(name),
    slug,
    parent_id: str(formData, "parent_id") || null,
    sort_order: num(formData, "sort_order") ?? 0,
    is_active: bool(formData, "is_active"),
  };
  if (id && row.parent_id === id) {
    redirect(`${back}?e=${encodeURIComponent("Kateqoriya özünün alt kateqoriyası ola bilməz.")}`);
  }

  const { error } = id
    ? await supabase.from("categories").update(row).eq("id", id)
    : await supabase.from("categories").insert(row);
  if (error) {
    const msg = error.code === "23505" ? "Bu slug artıq mövcuddur." : error.message;
    redirect(`${back}?e=${encodeURIComponent(msg)}`);
  }
  revalidatePath("/", "layout");
  redirect("/admin/categories");
}

export async function deleteCategory(formData: FormData) {
  const { supabase } = await requireAdmin();
  const id = str(formData, "id");
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) {
    const msg =
      error.code === "23503"
        ? "Silmək olmur: içində alt kateqoriya, kolleksiya və ya məhsul var."
        : error.message;
    redirect(`/admin/categories?e=${encodeURIComponent(msg)}`);
  }
  revalidatePath("/", "layout");
  redirect("/admin/categories");
}
