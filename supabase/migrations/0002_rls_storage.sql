-- 0002_rls_storage.sql
-- ============ RLS ============
alter table public.categories enable row level security;
alter table public.collections enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_images enable row level security;
alter table public.pages enable row level security;
alter table public.site_settings enable row level security;
alter table public.admin_audit_log enable row level security;

-- Ümumi oxuma (yalnız aktiv)
create policy categories_read on public.categories for select using (is_active or public.is_admin());
create policy collections_read on public.collections for select using (is_active or public.is_admin());
create policy products_read on public.products for select using (is_active or public.is_admin());
create policy variants_read on public.product_variants for select using (is_active or public.is_admin());
create policy images_read on public.product_images for select using (true);
create policy pages_read on public.pages for select using (true);
create policy settings_read on public.site_settings for select using (true);

-- Yazma: yalnız admin
create policy categories_admin on public.categories for all using (public.is_admin()) with check (public.is_admin());
create policy collections_admin on public.collections for all using (public.is_admin()) with check (public.is_admin());
create policy products_admin on public.products for all using (public.is_admin()) with check (public.is_admin());
create policy variants_admin on public.product_variants for all using (public.is_admin()) with check (public.is_admin());
create policy images_admin on public.product_images for all using (public.is_admin()) with check (public.is_admin());
create policy pages_admin on public.pages for all using (public.is_admin()) with check (public.is_admin());
create policy settings_admin on public.site_settings for all using (public.is_admin()) with check (public.is_admin());
create policy audit_admin_read on public.admin_audit_log for select using (public.is_admin());
create policy audit_admin_insert on public.admin_audit_log for insert with check (public.is_admin());

-- Anonim istifadəçi view_count-u birbaşa dəyişə bilməz (yalnız admin update edir)

-- ============ Storage ============
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/webp','image/jpeg','image/png'])
on conflict (id) do nothing;

create policy "product-images public read" on storage.objects
  for select using (bucket_id = 'product-images');
create policy "product-images admin insert" on storage.objects
  for insert with check (bucket_id = 'product-images' and public.is_admin());
create policy "product-images admin update" on storage.objects
  for update using (bucket_id = 'product-images' and public.is_admin());
create policy "product-images admin delete" on storage.objects
  for delete using (bucket_id = 'product-images' and public.is_admin());

