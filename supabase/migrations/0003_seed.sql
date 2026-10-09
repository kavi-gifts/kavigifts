-- 0003_seed.sql
-- ============ Seed ============
insert into public.site_settings (id) values (true) on conflict do nothing;

insert into public.pages (key, content) values
  ('about', '{"az":"Kavi Gifts haqqında məlumat tezliklə əlavə olunacaq."}')
on conflict do nothing;

with tablo as (
  insert into public.categories (name, slug, sort_order)
  values ('{"az":"Tablo","ru":"Картины","en":"Wall art"}', 'tablo', 1)
  returning id
), fig as (
  insert into public.categories (name, slug, sort_order)
  values ('{"az":"3D Fiqurlar","ru":"3D фигурки","en":"3D figures"}', '3d-fiqurlar', 2)
  returning id
), anime as (
  insert into public.categories (parent_id, name, slug, sort_order)
  select id, '{"az":"Animelər","ru":"Аниме","en":"Anime"}', 'tablo-anime', 1 from tablo
  returning id
)
insert into public.collections (category_id, name, slug, description)
select id, '{"az":"Attack on Titan","ru":"Attack on Titan","en":"Attack on Titan"}',
       'attack-on-titan', '{"az":"Attack on Titan kolleksiyası — A4 tablolar."}'
from anime;
