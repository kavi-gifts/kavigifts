"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { readL10n, str, withTranslations } from "@/lib/forms";

export async function saveAbout(formData: FormData) {
  const { supabase } = await requireAdmin();
  const content = readL10n(formData, "content");
  if (!content) redirect(`/admin/about?e=${encodeURIComponent("Mətn (AZ) məcburidir.")}`);
  const { error } = await supabase
    .from("pages")
    .upsert({ key: "about", content: await withTranslations(content) });
  if (error) redirect(`/admin/about?e=${encodeURIComponent(error.message)}`);
  revalidatePath("/", "layout");
  redirect("/admin/about?ok=1");
}

export async function saveSettings(formData: FormData) {
  const { supabase } = await requireAdmin();
  const urlOk = (v: string) => /^https:\/\//.test(v);
  const whatsapp = str(formData, "whatsapp_url");
  const instagram = str(formData, "instagram_url");
  const tiktok = str(formData, "tiktok_url");
  if (![whatsapp, instagram, tiktok].every(urlOk)) {
    redirect(`/admin/settings?e=${encodeURIComponent("Linklər https:// ilə başlamalıdır.")}`);
  }
  const { error } = await supabase.from("site_settings").update({
    site_name: str(formData, "site_name") || "Kavi Gifts",
    whatsapp_url: whatsapp,
    instagram_url: instagram,
    tiktok_url: tiktok,
    watermark_text: str(formData, "watermark_text"),
  }).eq("id", true);
  if (error) redirect(`/admin/settings?e=${encodeURIComponent(error.message)}`);
  revalidatePath("/", "layout");
  redirect("/admin/settings?ok=1");
}
