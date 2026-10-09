# DB sxemi (cari)

Mənbə: `supabase/migrations/0001_init.sql` (Supabase SQL Editor-də icra olunmalıdır).

| Cədvəl | Qeyd |
|---|---|
| `admins` | user_id → auth.users; policy yoxdur, yalnız `is_admin()` funksiyası |
| `categories` | `parent_id` ilə ağac, `name jsonb {az,ru,en}`, slug unique |
| `collections` | `category_id` məcburi, `code text unique` (prefiks), `description jsonb`, `bundle_price/bundle_sale_price`, `currency` |
| `products` | müstəqil; `collection_id` NULL ola bilər; `type` tablo/figure_3d/other; `code` unique; `base_price/sale_price`; `view_count`; `search_tsv` |
| `product_variants` | `label jsonb`, `price`, `sale_price` |
| `product_images` | thumb/medium/large URL |
| `pages` | `key='about'`, `content jsonb` |
| `site_settings` | tək sətir (whatsapp/instagram/tiktok, watermark mətni) |
| `admin_audit_log` | admin əməliyyatları |

- RLS: anonim yalnız aktiv məlumatı oxuyur; yazma yalnız `is_admin()`.
- `increment_product_view(uuid)` — baxış sayğacı üçün yeganə anonim yazma yolu.
- Storage bucket: `product-images` (public read, yazma admin, 5MB, webp/jpeg/png).
- Seed: Tablo > Animelər > Attack on Titan kolleksiyası, 3D Fiqurlar kateqoriyası.
