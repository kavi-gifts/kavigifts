-- 0001_init.sql — Kavi Gifts əsas sxem, RLS, storage, seed
-- Supabase Dashboard > SQL Editor-də icra edin.

create extension if not exists pg_trgm;

-- ============ Köməkçi ============
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- ============ Adminlər ============
create table public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;
-- heç bir policy yoxdur: cədvələ yalnız security definer funksiya və service role çatır

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ============ Kateqoriyalar ============
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.categories(id) on delete restrict,
  name jsonb not null check (name ? 'az'),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  image_url text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (parent_id is null or parent_id <> id)
);
create index categories_parent_idx on public.categories(parent_id);
create trigger categories_updated before update on public.categories
  for each row execute function public.set_updated_at();

-- ============ Kolleksiyalar ============
create table public.collections (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete restrict,
  name jsonb not null check (name ? 'az'),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description jsonb,
  cover_image text,
  bundle_price numeric(10,2) check (bundle_price is null or bundle_price >= 0),
  bundle_sale_price numeric(10,2) check (bundle_sale_price is null or bundle_sale_price >= 0),
  currency text not null default 'AZN' check (currency in ('AZN','USD','EUR')),
  is_featured boolean not null default false,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (bundle_sale_price is null or (bundle_price is not null and bundle_sale_price < bundle_price))
);
create index collections_category_idx on public.collections(category_id);
create index collections_featured_idx on public.collections(is_featured) where is_active;
create trigger collections_updated before update on public.collections
  for each row execute function public.set_updated_at();

-- ============ Məhsullar (müstəqil, kolleksiya isteğe bağlı) ============
create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete restrict,
  collection_id uuid references public.collections(id) on delete set null,
  type text not null default 'tablo' check (type in ('tablo','figure_3d','other')),
  code text not null unique,
  title jsonb not null check (title ? 'az'),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description jsonb,
  base_price numeric(10,2) check (base_price is null or base_price >= 0),
  sale_price numeric(10,2) check (sale_price is null or sale_price >= 0),
  currency text not null default 'AZN' check (currency in ('AZN','USD','EUR')),
  is_featured boolean not null default false,
  is_active boolean not null default true,
  sort_order int not null default 0,
  view_count int not null default 0,
  search_tsv tsvector generated always as (
    to_tsvector('simple',
      coalesce(code,'') || ' ' ||
      coalesce(title->>'az','') || ' ' ||
      coalesce(title->>'ru','') || ' ' ||
      coalesce(title->>'en',''))
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (sale_price is null or (base_price is not null and sale_price < base_price))
);
create index products_category_idx on public.products(category_id);
create index products_collection_idx on public.products(collection_id, sort_order);
create index products_featured_idx on public.products(is_featured) where is_active;
create index products_views_idx on public.products(view_count desc) where is_active;
create index products_created_idx on public.products(created_at desc) where is_active;
create index products_search_idx on public.products using gin(search_tsv);
create index products_title_trgm_idx on public.products using gin ((title->>'az') gin_trgm_ops);
create trigger products_updated before update on public.products
  for each row execute function public.set_updated_at();

-- ============ Variantlar ============
create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  label jsonb not null check (label ? 'az'),
  price numeric(10,2) not null check (price >= 0),
  sale_price numeric(10,2) check (sale_price is null or sale_price >= 0),
  sku text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  check (sale_price is null or sale_price < price)
);
create index variants_product_idx on public.product_variants(product_id, sort_order);

-- ============ Şəkillər ============
create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url_thumb text not null,
  url_medium text not null,
  url_large text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index images_product_idx on public.product_images(product_id, sort_order);

-- ============ Statik səhifələr (Haqqımızda) ============
create table public.pages (
  key text primary key,
  content jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create trigger pages_updated before update on public.pages
  for each row execute function public.set_updated_at();

-- ============ Sayt ayarları (tək sətir) ============
create table public.site_settings (
  id boolean primary key default true check (id),
  site_name text not null default 'Kavi Gifts',
  whatsapp_url text not null default 'https://wa.me/514933326',
  instagram_url text not null default 'https://www.instagram.com/kavi.gifts_/',
  tiktok_url text not null default 'https://www.tiktok.com/@kavi.gifts_',
  logo_url text,
  watermark_text text not null default '@kavi.gifts_',
  updated_at timestamptz not null default now()
);
create trigger settings_updated before update on public.site_settings
  for each row execute function public.set_updated_at();

-- ============ Audit log ============
create table public.admin_audit_log (
  id bigint generated always as identity primary key,
  user_id uuid,
  action text not null,
  table_name text not null,
  record_id text,
  details jsonb,
  created_at timestamptz not null default now()
);

-- ============ Baxış sayğacı (yalnız bu funksiya ilə) ============
create or replace function public.increment_product_view(p_id uuid)
returns void language sql security definer set search_path = public as $$
  update public.products set view_count = view_count + 1
  where id = p_id and is_active;
$$;
revoke all on function public.increment_product_view(uuid) from public;
grant execute on function public.increment_product_view(uuid) to anon, authenticated;

