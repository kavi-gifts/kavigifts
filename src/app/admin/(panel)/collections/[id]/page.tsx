import Link from "next/navigation";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import {
  btnCls,
  btnGhostCls,
  ErrorBox,
  Field,
  inputCls,
  LangFields,
} from "@/components/admin/ui";
import { saveCollection } from "../actions";
import { CollectionBulkUploader } from "../BulkUploader";

export default async function CollectionEditPage({
  params,
  searchParams,
}: PageProps<"/admin/collections/[id]">) {
  const { id } = await params;
  const { e } = await searchParams;
  const { supabase } = await requireAdmin();

  const isNew = id === "new";
  const { data: col } = isNew
    ? { data: null }
    : await supabase.from("collections").select("*").eq("id", id).maybeSingle();
  if (!isNew && !col) notFound();

  // Yeni kolleksiya yaradıldıqda Sıra avtomatik max + 1 olsun
  let nextSortOrder = 0;
  if (isNew) {
    const { data: allCols } = await supabase
      .from("collections")
      .select("sort_order");
    const maxSort = (allCols ?? []).reduce(
      (m, c) => (typeof c.sort_order === "number" && c.sort_order > m ? c.sort_order : m),
      -1
    );
    nextSortOrder = maxSort + 1;
  }

  const [{ data: cats }, { data: prods }] = await Promise.all([
    supabase.from("categories").select("id,name").order("sort_order"),
    !isNew
      ? supabase
          .from("products")
          .select(
            "id,code,title,base_price,sale_price,currency,product_images(url_thumb,sort_order)"
          )
          .eq("collection_id", id)
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
  ]);

  return (
    <div className="max-w-2xl space-y-10">
      <section>
        <h1 className="mb-6 font-serif text-3xl">
          {isNew ? "Yeni kolleksiya" : "Kolleksiyanı redaktə et"}
        </h1>
        <ErrorBox message={e} />
        <form action={saveCollection} className="space-y-4">
          <input type="hidden" name="id" value={isNew ? "" : id} />
          <Field label="Kateqoriya / alt kateqoriya">
            <select
              name="category_id"
              required
              defaultValue={col?.category_id ?? ""}
              className={inputCls}
            >
              <option value="" disabled>
                Seçin…
              </option>
              {(cats ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {(c.name as { az: string }).az}
                </option>
              ))}
            </select>
          </Field>
          <LangFields name="name" label="Ad" defaults={col?.name} required />
          <Field label="Slug (boşdursa addan yaradılır)">
            <input
              name="slug"
              defaultValue={col?.slug ?? ""}
              className={inputCls}
            />
          </Field>
          <Field label="Kolleksiya kodu (unikal prefiks: AOT, NAR, HP və s.)">
            <input
              name="code"
              required
              defaultValue={(col as { code?: string })?.code ?? ""}
              placeholder="məs. AOT"
              className={inputCls}
              pattern="[A-Za-z0-9_-]+"
              title="Yalnız ingilis hərfləri, rəqəmlər, defis və ya alt xətt"
            />
            <p className="mt-1 text-xs text-foreground/60">
              Bu kod yeni yüklənən şəkillərə ardıcıl şamil edilir (məs: AOT-001, AOT-002). Kodu dəyişsəniz, kolleksiyadakı bütün mövcud məhsulların kodları da avtomatik ardıcıl yenilənəcək.
            </p>
          </Field>
          <LangFields
            name="description"
            label="Kolleksiya haqqında (isteğe bağlı — toplu yüklənən məhsullara şamil olunur)"
            defaults={col?.description}
            textarea
          />
          <div className="space-y-1">
            <div className="grid grid-cols-3 gap-3">
              <Field label="Standart qiymət (məhsullar üçün)">
                <input
                  name="bundle_price"
                  inputMode="decimal"
                  defaultValue={col?.bundle_price ?? ""}
                  placeholder="məs. 25"
                  className={inputCls}
                />
              </Field>
              <Field label="Endirimli qiymət">
                <input
                  name="bundle_sale_price"
                  inputMode="decimal"
                  defaultValue={col?.bundle_sale_price ?? ""}
                  placeholder="məs. 19"
                  className={inputCls}
                />
              </Field>
              <Field label="Valyuta">
                <select
                  name="currency"
                  defaultValue={col?.currency ?? "AZN"}
                  className={inputCls}
                >
                  <option>AZN</option>
                  <option>USD</option>
                  <option>EUR</option>
                </select>
              </Field>
            </div>
            <p className="text-xs text-foreground/60">
              Bu qiymət və endirim kolleksiyadakı bütün məhsullara şamil olunur.
              İstədiyiniz məhsulun qiymətini tək-tək də dəyişə bilərsiniz.
            </p>
          </div>

          <Field label="Sıra">
            <input
              name="sort_order"
              type="number"
              defaultValue={col?.sort_order ?? nextSortOrder}
              className={inputCls}
            />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="is_featured"
              defaultChecked={col?.is_featured ?? false}
            />
            Tövsiyə olunan kolleksiya
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="is_active"
              defaultChecked={col?.is_active ?? true}
            />
            Aktiv (saytda görünür)
          </label>
          <button className={btnCls}>Yadda saxla</button>
        </form>
      </section>

      {/* Bulk Upload Section for existing collection */}
      {!isNew && (
        <>
          <section className="space-y-4">
            <h2 className="font-serif text-2xl font-bold">
              Kolleksiyaya Toplu Şəkillər Yüklə
            </h2>
            <CollectionBulkUploader collectionId={id} />
          </section>

          {/* List of products in this collection with direct individual price editing link */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl font-bold">
                Kolleksiyadakı məhsullar ({prods?.length ?? 0})
              </h2>
              <a
                href={`/admin/products/new?collection_id=${id}`}
                className={btnGhostCls}
              >
                + Tək məhsul əlavə et
              </a>
            </div>

            <div className="space-y-2">
              {(prods ?? []).map((p) => {
                const img = (
                  p.product_images as unknown as { url_thumb: string }[]
                )?.[0]?.url_thumb;
                const title = (p.title as { az: string }).az;
                const price = p.base_price ?? col?.bundle_price;
                const sale =
                  p.base_price != null
                    ? p.sale_price
                    : (col?.bundle_sale_price ?? p.sale_price);

                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-xl border border-border bg-surface p-2.5 text-sm"
                  >
                    <div className="flex items-center gap-3">
                      {img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={img}
                          alt=""
                          className="h-10 w-8 rounded object-cover"
                        />
                      ) : (
                        <div className="h-10 w-8 rounded bg-border" />
                      )}
                      <div>
                        <p className="font-semibold text-foreground">
                          {p.code} — {title}
                        </p>
                        <p className="text-xs text-foreground/60">
                          {sale != null ? (
                            <>
                              <s className="text-sale">{price}</s> {sale}{" "}
                              {p.currency}
                            </>
                          ) : price != null ? (
                            `${price} ${p.currency}`
                          ) : (
                            "Qiymət təyin olunmayıb"
                          )}
                        </p>
                      </div>
                    </div>

                    <a
                      href={`/admin/products/${p.id}`}
                      className={btnGhostCls}
                      title="Fərdi qiymət və detalları dəyiş"
                    >
                      Fərdi qiyməti dəyiş / Redaktə
                    </a>
                  </div>
                );
              })}

              {!prods?.length && (
                <p className="rounded-xl border border-border bg-surface p-5 text-center text-xs text-foreground/60">
                  Bu kolleksiyada hələlik məhsul yoxdur. Yuxarıdan toplu şəkillər
                  yükləyərək dərhal əlavə edə bilərsiniz.
                </p>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
