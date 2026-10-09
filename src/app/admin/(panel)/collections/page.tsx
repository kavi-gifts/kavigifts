import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { btnCls, btnDangerCls, btnGhostCls, ErrorBox } from "@/components/admin/ui";
import { deleteCollection } from "./actions";

export default async function CollectionsPage({
  searchParams,
}: PageProps<"/admin/collections">) {
  const { e } = await searchParams;
  const { supabase } = await requireAdmin();
  let { data, error } = await supabase
    .from("collections")
    .select("id,name,code,slug,is_active,is_featured,categories(name)")
    .order("sort_order");

  if (error && error.code === "42703") {
    const res = await supabase
      .from("collections")
      .select("id,name,slug,is_active,is_featured,categories(name)")
      .order("sort_order");
    data = res.data as typeof data;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-3xl">Kolleksiyalar</h1>
        <Link href="/admin/collections/new" className={btnCls}>+ Yeni</Link>
      </div>
      <ErrorBox message={e} />
      <table className="w-full max-w-3xl text-sm">
        <tbody>
          {(data ?? []).map((c) => {
            const cat = c.categories as unknown as { name: { az: string } } | null;
            const code = (c as { code?: string }).code;
            return (
              <tr key={c.id} className="border-b border-border">
                <td className="py-2">
                  <span className="font-medium">{(c.name as { az: string }).az}</span>
                  {code && (
                    <span className="ml-2 rounded bg-sky-100 px-1.5 py-0.5 font-mono text-xs text-sky-800">
                      {code}
                    </span>
                  )}
                  <span className="ml-2 text-foreground/50">{cat?.name.az}</span>
                  {c.is_featured && <span className="ml-2 text-gold">★</span>}
                  {!c.is_active && <span className="ml-2 text-sale">(passiv)</span>}
                </td>
                <td className="py-2 text-right">
                  <Link href={`/admin/collections/${c.id}`} className={btnGhostCls}>Redaktə</Link>{" "}
                  <form action={deleteCollection} className="inline">
                    <input type="hidden" name="id" value={c.id} />
                    <button className={btnDangerCls}>Sil</button>
                  </form>
                </td>
              </tr>
            );
          })}
          {!data?.length && (
            <tr><td className="py-4 text-foreground/60">Kolleksiya yoxdur.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
