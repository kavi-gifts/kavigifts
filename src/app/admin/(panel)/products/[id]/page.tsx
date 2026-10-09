import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import {
  btnCls, btnDangerCls, btnGhostCls, ErrorBox, Field, inputCls, LangFields,
} from "@/components/admin/ui";
import {
  addVariant, deleteImage, deleteVariant, makeFirstImage, saveProduct,
} from "../actions";
import { ImageUploader } from "../ImageUploader";

export default async function ProductEditPage({
  params,
  searchParams,
}: PageProps<"/admin/products/[id]">) {
  const { id } = await params;
  const { e, ok } = await searchParams;
  const { supabase } = await requireAdmin();

  const isNew = id === "new";
  const { data: p } = isNew
    ? { data: null }
    : await supabase.from("products").select("*").eq("id", id).maybeSingle();
  if (!isNew && !p) notFound();

  const [{ data: cats }, { data: cols }] = await Promise.all([
    supabase.from("categories").select("id,name").order("sort_order"),
    supabase.from("collections").select("id,name").order("sort_order"),
  ]);
  const [{ data: variants }, { data: images }] = isNew
    ? [{ data: [] }, { data: [] }]
    : await Promise.all([
        supabase.from("product_variants").select("*").eq("product_id", id).order("sort_order"),
        supabase.from("product_images").select("*").eq("product_id", id).order("sort_order"),
      ]);

  const L = (v: unknown) => (v as { az: string }).az;

  return (
    <div className="max-w-2xl space-y-10">
      <section>
        <h1 className="mb-6 font-serif text-3xl">
          {isNew ? "Yeni məhsul" : `Məhsul: ${p!.code}`}
        </h1>
        <ErrorBox message={e} />
        {ok && <p className="mb-4 text-sm text-green-700">Yadda saxlanıldı.</p>}
        <form action={saveProduct} className="space-y-4">
          <input type="hidden" name="id" value={isNew ? "" : id} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tip">
              <select name="type" defaultValue={p?.type ?? "tablo"} className={inputCls}>
                <option value="tablo">Tablo</option>
                <option value="figure_3d">3D fiqur</option>
                <option value="other">Digər</option>
              </select>
            </Field>
            <Field label="Kod (boşdursa avtomatik: TAB-001)">
              <input name="code" defaultValue={p?.code ?? ""} className={inputCls} />
            </Field>
          </div>
          <Field label="Kateqoriya / alt kateqoriya">
            <select name="category_id" required defaultValue={p?.category_id ?? ""} className={inputCls}>
              <option value="" disabled>Seçin…</option>
              {(cats ?? []).map((c) => <option key={c.id} value={c.id}>{L(c.name)}</option>)}
            </select>
          </Field>
          <Field label="Kolleksiya (isteğe bağlı — 3D fiqurlar üçün boş saxlayın)">
            <select name="collection_id" defaultValue={p?.collection_id ?? ""} className={inputCls}>
              <option value="">— Kolleksiyasız —</option>
              {(cols ?? []).map((c) => <option key={c.id} value={c.id}>{L(c.name)}</option>)}
            </select>
          </Field>
          <LangFields name="title" label="Ad" defaults={p?.title} required />
          <LangFields name="description" label="Təsvir (isteğe bağlı)" defaults={p?.description} textarea />
          <div className="grid grid-cols-3 gap-3">
            <Field label="Qiymət">
              <input name="base_price" inputMode="decimal" defaultValue={p?.base_price ?? ""} className={inputCls} />
            </Field>
            <Field label="Endirimli qiymət">
              <input name="sale_price" inputMode="decimal" defaultValue={p?.sale_price ?? ""} className={inputCls} />
            </Field>
            <Field label="Valyuta">
              <select name="currency" defaultValue={p?.currency ?? "AZN"} className={inputCls}>
                <option>AZN</option><option>USD</option><option>EUR</option>
              </select>
            </Field>
          </div>
          <p className="text-xs text-foreground/60">
            Variantlar (ölçü və s.) əlavə etsəniz, saytda variantların qiyməti göstəriləcək.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Slug (boşdursa avtomatik)">
              <input name="slug" defaultValue={p?.slug ?? ""} className={inputCls} />
            </Field>
            <Field label="Sıra (kolleksiyada vərəq nömrəsi)">
              <input name="sort_order" type="number" defaultValue={p?.sort_order ?? 0} className={inputCls} />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="is_featured" defaultChecked={p?.is_featured ?? false} />
            Tövsiyə olunan
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="is_active" defaultChecked={p?.is_active ?? true} />
            Aktiv (saytda görünür)
          </label>
          <button className={btnCls}>Yadda saxla</button>
        </form>
      </section>

      {isNew ? (
        <p className="text-sm text-foreground/60">Şəkillər və variantlar məhsulu yadda saxladıqdan sonra əlavə olunur.</p>
      ) : (
        <>
          <section>
            <h2 className="mb-3 text-xl font-medium">Şəkillər</h2>
            <p className="mb-3 text-xs text-foreground/60">
              Şəkillər avtomatik sıxılır və WebP formatına salınır. Birinci şəkil əsas şəkildir.
            </p>
            <div className="mb-4 grid grid-cols-4 gap-3">
              {(images ?? []).map((im, i) => (
                <div key={im.id} className="space-y-1">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={im.url_thumb} alt="" className="aspect-[3/4] w-full rounded-lg object-cover" />
                  <div className="flex gap-1">
                    {i > 0 && (
                      <form action={makeFirstImage}>
                        <input type="hidden" name="id" value={im.id} />
                        <input type="hidden" name="product_id" value={id} />
                        <button className={btnGhostCls} title="Əsas et">★</button>
                      </form>
                    )}
                    <form action={deleteImage}>
                      <input type="hidden" name="id" value={im.id} />
                      <input type="hidden" name="product_id" value={id} />
                      <button className={btnDangerCls}>Sil</button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
            <ImageUploader productId={id} />
          </section>

          <section>
            <h2 className="mb-3 text-xl font-medium">Variantlar (ölçü, rəng və s.)</h2>
            <ul className="mb-4 space-y-1 text-sm">
              {(variants ?? []).map((v) => (
                <li key={v.id} className="flex items-center justify-between border-b border-border py-1">
                  <span>
                    {L(v.label)} —{" "}
                    {v.sale_price !== null ? (<><s className="text-sale">{v.price}</s> {v.sale_price}</>) : v.price}{" "}
                    {p!.currency}
                  </span>
                  <form action={deleteVariant}>
                    <input type="hidden" name="id" value={v.id} />
                    <input type="hidden" name="product_id" value={id} />
                    <button className={btnDangerCls}>Sil</button>
                  </form>
                </li>
              ))}
              {!variants?.length && <li className="text-foreground/60">Variant yoxdur.</li>}
            </ul>
            <form action={addVariant} className="space-y-3 rounded-xl border border-border bg-surface p-4">
              <input type="hidden" name="product_id" value={id} />
              <LangFields name="label" label="Yeni variant adı (məs. 20 sm)" required />
              <div className="grid grid-cols-3 gap-3">
                <Field label="Qiymət"><input name="price" required inputMode="decimal" className={inputCls} /></Field>
                <Field label="Endirimli"><input name="sale_price" inputMode="decimal" className={inputCls} /></Field>
                <Field label="Sıra"><input name="sort_order" type="number" defaultValue={0} className={inputCls} /></Field>
              </div>
              <button className={btnCls}>Variant əlavə et</button>
            </form>
          </section>
        </>
      )}
    </div>
  );
}
