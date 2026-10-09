import { requireAdmin } from "@/lib/auth";
import { btnCls, ErrorBox, LangFields } from "@/components/admin/ui";
import { saveAbout } from "../site/actions";

export default async function AboutAdminPage({
  searchParams,
}: PageProps<"/admin/about">) {
  const { e, ok } = await searchParams;
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("pages").select("content").eq("key", "about").maybeSingle();

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 font-serif text-3xl">Haqqımızda</h1>
      <ErrorBox message={e} />
      {ok && <p className="mb-4 text-sm text-green-700">Yadda saxlanıldı.</p>}
      <form action={saveAbout} className="space-y-4">
        <LangFields name="content" label="Mətn" defaults={data?.content} textarea required />
        <button className={btnCls}>Yadda saxla</button>
      </form>
    </div>
  );
}
