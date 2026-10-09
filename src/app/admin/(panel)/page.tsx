import { requireAdmin } from "@/lib/auth";

export default async function Dashboard() {
  const { supabase } = await requireAdmin();
  const count = async (t: string) =>
    (await supabase.from(t).select("*", { count: "exact", head: true })).count ?? 0;
  const [cats, cols, prods] = await Promise.all([
    count("categories"),
    count("collections"),
    count("products"),
  ]);
  const { data: top } = await supabase
    .from("products")
    .select("code,title,view_count")
    .order("view_count", { ascending: false })
    .limit(5);

  return (
    <div>
      <h1 className="mb-6 font-serif text-3xl">Panel</h1>
      <div className="mb-8 grid max-w-xl grid-cols-3 gap-4">
        {[["Kateqoriya", cats], ["Kolleksiya", cols], ["Məhsul", prods]].map(([l, n]) => (
          <div key={l as string} className="rounded-xl border border-border bg-surface p-4">
            <p className="text-sm text-foreground/60">{l}</p>
            <p className="text-2xl font-semibold">{n}</p>
          </div>
        ))}
      </div>
      <h2 className="mb-2 font-medium">Ən çox baxılanlar</h2>
      <ul className="space-y-1 text-sm">
        {(top ?? []).map((p) => (
          <li key={p.code}>
            {p.code} — {(p.title as { az: string }).az} ({p.view_count})
          </li>
        ))}
        {!top?.length && <li className="text-foreground/60">Hələ məhsul yoxdur.</li>}
      </ul>
    </div>
  );
}
