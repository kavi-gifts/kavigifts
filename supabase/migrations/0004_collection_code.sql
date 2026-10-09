-- ============================================================
-- Migration 0004: Kolleksiyalara unikal kod tələbi və ardıcıl məhsul kodları
-- ============================================================

-- 1. Kolleksiyalar cədvəlinə unikal code sütunu əlavə olunur
alter table public.collections
  add column if not exists code text unique;

-- 2. Mövcud "Attack on Titan" kolleksiyasına 'AOT' kodu təyin olunur
update public.collections
  set code = 'AOT'
  where slug = 'attack-on-titan';

-- 3. Mövcud məhsulların kodlarını toqquşmasız ardıcıl AOT-001, AOT-002 ... formatına salırıq
update public.products
set code = 'TMP-' || id::text
where collection_id = (select id from public.collections where slug = 'attack-on-titan');

with ordered_prods as (
  select id, row_number() over (order by created_at asc) as seq
  from public.products
  where collection_id = (select id from public.collections where slug = 'attack-on-titan')
)
update public.products p
set code = 'AOT-' || lpad(o.seq::text, 3, '0'),
    slug = lower(trim(both '-' from regexp_replace(coalesce(p.title->>'az', 'tablo') || '-AOT-' || lpad(o.seq::text, 3, '0'), '[^a-zA-Z0-9]+', '-', 'g')))
from ordered_prods o
where p.id = o.id;
