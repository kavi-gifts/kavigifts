import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { btnCls, ErrorBox, Field, inputCls, LangFields } from "@/components/admin/ui";
import { saveCategory } from "../actions";

export default async function CategoryEditPage({
  params,
  searchParams,
}: PageProps<"/admin/categories/[id]">) {
  const { id } = await params;
  const { e } = await searchParams;
  const { supabase } = await requireAdmin();

  const isNew = id === "new";
  const { data: cat } = isNew
    ? { data: null }
    : await supabase.from("categories").select("*").eq("id", id).maybeSingle();
  if (!isNew && !cat) notFound();

  const { data: all } = await supabase
    .from("categories")
    .select("id,name,sort_order")
    .order("sort_order");
  const parents = (all ?? []).filter((c) => c.id !== id);

  let nextSortOrder = 0;
  if (isNew) {
    const maxSort = (all ?? []).reduce(
      (m, c) => (typeof c.sort_order === "number" && c.sort_order > m ? c.sort_order : m),
      -1
    );
    nextSortOrder = maxSort + 1;
  }

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 font-serif text-3xl">
        {isNew ? "Yeni kateqoriya" : "Kateqoriyanı redaktə et"}
      </h1>
      <ErrorBox message={e} />
      <form action={saveCategory} className="space-y-4">
        <input type="hidden" name="id" value={isNew ? "" : id} />
        <LangFields name="name" label="Ad" defaults={cat?.name} required />
        <Field label="Slug (boşdursa addan yaradılır)">
          <input name="slug" defaultValue={cat?.slug ?? ""} className={inputCls} />
        </Field>
        <Field label="Üst kateqoriya">
          <select name="parent_id" defaultValue={cat?.parent_id ?? ""} className={inputCls}>
            <option value="">— Əsas kateqoriya —</option>
            {parents.map((p) => (
              <option key={p.id} value={p.id}>{(p.name as { az: string }).az}</option>
            ))}
          </select>
        </Field>
        <Field label="Sıra">
          <input name="sort_order" type="number" defaultValue={cat?.sort_order ?? nextSortOrder} className={inputCls} />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_active" defaultChecked={cat?.is_active ?? true} />
          Aktiv (saytda görünür)
        </label>
        <button className={btnCls}>Yadda saxla</button>
      </form>
    </div>
  );
}
