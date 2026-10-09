import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { btnCls, btnDangerCls, btnGhostCls, ErrorBox } from "@/components/admin/ui";
import { deleteProduct } from "./actions";

const TYPE_LABEL: Record<string, string> = { tablo: "Tablo", figure_3d: "3D fiqur", other: "Digər" };

export default async function ProductsPage({
  searchParams,
}: PageProps<"/admin/products">) {
  const { e } = await searchParams;
  const { supabase } = await requireAdmin();
  const { data } = await supabase
    .from("products")
    .select("id,code,title,type,base_price,sale_price,currency,is_active,is_featured,view_count,product_images(url_thumb,sort_order)")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-3xl">Məhsullar</h1>
        <Link href="/admin/products/new" className={btnCls}>+ Yeni</Link>
      </div>
      <ErrorBox message={e} />
      <table className="w-full max-w-4xl text-sm">
        <tbody>
          {(data ?? []).map((p) => {
            const imgs = [...(p.product_images ?? [])].sort((a, b) => a.sort_order - b.sort_order);
            return (
              <tr key={p.id} className="border-b border-border">
                <td className="w-14 py-2">
                  {imgs[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imgs[0].url_thumb} alt="" className="h-12 w-12 rounded object-cover" />
                  ) : (
                    <div className="h-12 w-12 rounded bg-border" />
                  )}
                </td>
                <td className="py-2">
                  <b>{p.code}</b> — {(p.title as { az: string }).az}
                  <span className="ml-2 text-foreground/50">{TYPE_LABEL[p.type]}</span>
                  {p.is_featured && <span className="ml-2 text-gold">★</span>}
                  {!p.is_active && <span className="ml-2 text-sale">(passiv)</span>}
                </td>
                <td className="py-2">
                  {p.sale_price !== null ? (
                    <><s className="text-sale">{p.base_price}</s> {p.sale_price}</>
                  ) : (
                    p.base_price ?? "—"
                  )} {p.currency}
                </td>
                <td className="py-2 text-foreground/60">👁 {p.view_count}</td>
                <td className="py-2 text-right">
                  <Link href={`/admin/products/${p.id}`} className={btnGhostCls}>Redaktə</Link>{" "}
                  <form action={deleteProduct} className="inline">
                    <input type="hidden" name="id" value={p.id} />
                    <button className={btnDangerCls}>Sil</button>
                  </form>
                </td>
              </tr>
            );
          })}
          {!data?.length && (
            <tr><td className="py-4 text-foreground/60">Məhsul yoxdur.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
