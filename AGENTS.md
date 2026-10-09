# Kavi Gifts — AI üçün qaydalar (HƏR sessiyada ƏVVƏLCƏ oxu)

## Məcburi iş qaydası
1. İşə başlamazdan əvvəl oxu: `docs/PROGRESS.md`, `docs/DECISIONS.md`, `docs/DB_SCHEMA.md`.
2. İş bitəndə yenilə: `docs/PROGRESS.md` (checkbox + "Növbəti addım"), `docs/CHANGELOG.md` (tarix, nə, hansı fayllar), lazım olsa `DECISIONS.md` və `DB_SCHEMA.md`.
3. DB dəyişikliyi YALNIZ `supabase/migrations/NNNN_ad.sql` faylı ilə. Konsolda əl ilə dəyişmə yoxdur.
4. Planın tam mətni: `docs/PLAN.md`.

## Layihə
Hədiyyəlik məhsul kataloqu (tablo A4, 3D fiqurlar və s.). Qeydiyyatsız müştəri. Sifariş = WhatsApp mesajı. Admin panel `/admin`.

## Stack
Next.js (App Router, TS, Tailwind), `next-intl` (az/ru/en, default az), Supabase (Postgres + RLS + Auth + Storage), `sharp` (WebP + watermark), Zod, DeepL/Google tərcümə (yalnız server).

## Qaydalar
- Hələlik YALNIZ pulsuz xidmətlər (Vercel Hobby, Supabase Free). Ödənişli xidmət əlavə etmə.
- Valyuta default AZN. Çoxdilli mətn `jsonb {az,ru,en}`; az məcburi, boşdursa az göstər.
- Service-role açarı və API açarları heç vaxt client koduna düşməsin (`NEXT_PUBLIC_` yalnız anon açar/URL).
- Bütün giriş Zod ilə validasiya olunur. RLS bütün cədvəllərdə aktiv.
- Dizayn: açıq krem fon `#FAF8F5`, mətn `#2B2B2B`, qızılı `#C9A66B`, endirim `#E4572E`. Tünd rəng az.
- Endirim: köhnə qiymət qırmızı xətt çəkilmiş, altında yeni qiymət.
- Şəkillər yalnız watermarklı WebP (thumb 400 / medium 900 / large 1600); orijinal saxlanmır.
- Windows: PowerShell-də `npm.cmd`/`npx.cmd` işlət (ps1 icra siyasəti bloklayır).
- Mövcud şərh və docstring-ləri silmə.

## Next.js xəbərdarlığı
Bu Next.js versiyasında breaking dəyişikliklər var (məs. middleware → proxy). Kod yazmazdan əvvəl `node_modules/next/dist/docs/` oxu.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
