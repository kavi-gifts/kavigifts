# İrəliləyiş (PROGRESS)

> Hər sessiyanın sonunda yenilə.

## Faza 0 — Skelet ✅
Next.js 16, Tailwind, next-intl (az/ru/en), dizayn tokenləri, AGENTS.md, docs. Git hələ quraşdırılmayıb.

## Faza 1 — DB ✅
- [x] migrations 0001–0003 icra olundu, RLS yoxlandı
- [x] Admin istifadəçi yaradıldı və `admins` cədvəlinə əlavə edildi

## Faza 2 — Admin ✅
- [x] `/admin/login` (Supabase Auth), `requireAdmin()` hər səhifə və action-da
- [x] Kateqoriya (ağac), kolleksiya (paket qiyməti), məhsul (tip, qiymət, endirim), variantlar
- [x] Şəkil yükləmə: brauzerdə sıxma → server: 3 ölçü WebP (istifadəçi istəyi ilə avtomatik watermark ləğv edildi, hazır yüklənir) → Storage (test edildi, işləyir)
- [x] Haqqımızda və Ayarlar (WhatsApp/Instagram/TikTok)
- [x] Avtomatik tərcümə (DeepL; açar `.env.local`-da `DEEPL_API_KEY` olmalıdır, yoxdursa boş qalır)

## Faza 3 — Müştəri UI ✅
- [x] Əsas şablon: Header (Brend, Axtarış, Dil dəyişdirici AZ/RU/EN, WhatsApp düyməsi)
- [x] Footer (Haqqımızda, Əlaqə, Instagram, TikTok, WhatsApp linkləri)
- [x] Ana səhifə: Hero banner, sol Kateqoriya ağacı (CategorySidebar), Seçilmiş Kolleksiyalar, Tövsiyə olunanlar, Ən çox baxılanlar, Yeni əlavələr
- [x] Sol kateqoriya paneli (Kateqoriya > Alt kateqoriya > Kolleksiya)
- [x] Kateqoriya səhifəsi (`/c/[slug]`)
- [x] Axtarış səhifəsi (`/search?q=...`)
- [x] Dil dəyişdirici (AZ / RU / EN)

## Faza 4 — Vərəqləmə, Qiymət/Endirim, WhatsApp Sifariş, Haqqımızda, Əlaqə ✅
- [x] Kolleksiya Vərəqləmə (Flipbook Lookbook) görünüşü (`/collection/[slug]`) — A4 çərçivə mockup, oxlar, swipe, klaviatura, miniatür zolağı, paket təklifi
- [x] Qiymət məntiqi: endirim olduqda köhnə qiymətin üstündən qırmızı xətt, yeni qiymət, variantlar üzrə qiymət dəyişməsi
- [x] WhatsApp sifariş düyməsi: kliklədikdə birbaşa məhsulun adı, kodu, qiyməti və sayt linki ilə votsapa yönləndirmə
- [x] Məhsul detalları səhifəsi (`/p/[slug]`) və baxış sayğacı (view counter)
- [x] Haqqımızda (`/about`) və Əlaqə (`/contact`) səhifələri

## Faza 5 — Təhlükəsizlik, performans, SEO ✅
- [x] SEO sitemap (`/sitemap.xml`) və `robots.txt`
- [x] Sayt loqosu (`/icon.png`), OpenGraph və dinamik metadata
- [x] RLS və Storage təhlükəsizliyi yoxlandı

## Faza 6 — Deploy (Vercel) + domen kavigifts.az
- [x] Kod GitHub-a yükləndi (`https://github.com/kavi-gifts/kavigifts`)
- [ ] Vercel-də layihənin importu və deploy
- [ ] kavigifts.az domeninin bağlanması (DNS)
