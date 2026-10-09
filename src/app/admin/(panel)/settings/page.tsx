import { requireAdmin } from "@/lib/auth";
import { btnCls, ErrorBox, Field, inputCls } from "@/components/admin/ui";
import { saveSettings } from "../site/actions";

export default async function SettingsPage({
  searchParams,
}: PageProps<"/admin/settings">) {
  const { e, ok } = await searchParams;
  const { supabase } = await requireAdmin();
  const { data: s } = await supabase.from("site_settings").select("*").eq("id", true).maybeSingle();

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 font-serif text-3xl">Ayarlar</h1>
      <ErrorBox message={e} />
      {ok && <p className="mb-4 text-sm text-green-700">Yadda saxlanıldı.</p>}
      <form action={saveSettings} className="space-y-4">
        <Field label="Sayt adı">
          <input name="site_name" defaultValue={s?.site_name} className={inputCls} />
        </Field>
        <Field label="WhatsApp linki">
          <input name="whatsapp_url" defaultValue={s?.whatsapp_url} className={inputCls} />
        </Field>
        <Field label="Instagram linki">
          <input name="instagram_url" defaultValue={s?.instagram_url} className={inputCls} />
        </Field>
        <Field label="TikTok linki">
          <input name="tiktok_url" defaultValue={s?.tiktok_url} className={inputCls} />
        </Field>

        <button className={btnCls}>Yadda saxla</button>
      </form>
    </div>
  );
}
