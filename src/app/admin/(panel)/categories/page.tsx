import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { btnCls, btnDangerCls, btnGhostCls, ErrorBox } from "@/components/admin/ui";
import { deleteCategory } from "./actions";

type Cat = {
  id: string;
  parent_id: string | null;
  name: { az: string };
  slug: string;
  sort_order: number;
  is_active: boolean;
};

function flatten(cats: Cat[], parent: string | null = null, depth = 0): (Cat & { depth: number })[] {
  return cats
    .filter((c) => c.parent_id === parent)
    .sort((a, b) => a.sort_order - b.sort_order)
    .flatMap((c) => [{ ...c, depth }, ...flatten(cats, c.id, depth + 1)]);
}

export default async function CategoriesPage({
  searchParams,
}: PageProps<"/admin/categories">) {
  const { e } = await searchParams;
  const { supabase } = await requireAdmin();
  const { data } = await supabase.from("categories").select("*");
  const rows = flatten((data ?? []) as Cat[]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-3xl">Kateqoriyalar</h1>
        <Link href="/admin/categories/new" className={btnCls}>+ Yeni</Link>
      </div>
      <ErrorBox message={e} />
      <table className="w-full max-w-3xl text-sm">
        <tbody>
          {rows.map((c) => (
            <tr key={c.id} className="border-b border-border">
              <td className="py-2" style={{ paddingLeft: c.depth * 24 }}>
                {c.depth > 0 && "↳ "}
                {c.name.az}
                <span className="ml-2 text-foreground/50">/{c.slug}</span>
                {!c.is_active && <span className="ml-2 text-sale">(passiv)</span>}
              </td>
              <td className="py-2 text-right">
                <Link href={`/admin/categories/${c.id}`} className={btnGhostCls}>Redaktə</Link>{" "}
                <form action={deleteCategory} className="inline">
                  <input type="hidden" name="id" value={c.id} />
                  <button className={btnDangerCls}>Sil</button>
                </form>
              </td>
            </tr>
          ))}
          {!rows.length && (
            <tr><td className="py-4 text-foreground/60">Kateqoriya yoxdur.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
