import { setRequestLocale, getTranslations } from "next-intl/server";
import { getSiteSettings } from "@/lib/data";

export default async function ContactPage({
  params,
}: PageProps<"/[locale]/contact">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("contact");
  const settings = await getSiteSettings();

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <div className="text-center space-y-3 mb-12">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-foreground sm:text-5xl">
          {t("title")}
        </h1>
        <p className="mx-auto max-w-xl text-base text-foreground/70">
          {t("subtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {/* WhatsApp Card */}
        <a
          href={settings.whatsapp_url}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex flex-col items-center justify-center rounded-3xl border border-border bg-surface p-8 text-center transition-all hover:border-[#25D366]/50 hover:shadow-lg"
        >
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#25D366]/15 text-[#128C7E] transition-transform group-hover:scale-110">
            <svg className="h-7 w-7 fill-current" viewBox="0 0 24 24">
              <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.587-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.079-2.115-.512-1.815-.755-2.986-2.607-3.076-2.727-.089-.12-1.077-1.433-1.077-2.732 0-1.301.683-1.939.924-2.204.24-.265.526-.331.701-.331.175 0 .351.002.506.01.164.009.385-.062.602.46.222.535.759 1.849.825 1.983.067.135.112.293.022.472-.089.179-.134.291-.268.448-.134.156-.282.348-.403.468-.134.133-.274.278-.119.544.156.266.691 1.139 1.482 1.843 1.016.905 1.872 1.185 2.138 1.318.266.133.423.111.58-.069.156-.179.667-.777.845-1.045.178-.268.356-.223.593-.134.237.089 1.503.708 1.762.837.259.13.43.193.493.303.064.108.064.629-.08 1.034z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-foreground group-hover:text-[#128C7E] transition-colors">
            {t("whatsapp")}
          </h2>
          <p className="mt-1 text-xs text-foreground/60">{t("fastOrder")}</p>
          <span className="mt-4 rounded-full bg-[#25D366]/10 px-4 py-1.5 text-xs font-semibold text-[#128C7E]">
            Mesaj yaz →
          </span>
        </a>

        {/* Instagram Card */}
        <a
          href={settings.instagram_url}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex flex-col items-center justify-center rounded-3xl border border-border bg-surface p-8 text-center transition-all hover:border-[#E1306C]/50 hover:shadow-lg"
        >
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E1306C]/15 text-[#E1306C] transition-transform group-hover:scale-110">
            <svg className="h-7 w-7 fill-current" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-foreground group-hover:text-[#E1306C] transition-colors">
            {t("instagram")}
          </h2>
          <p className="mt-1 text-xs text-foreground/60">@kavi.gifts_</p>
          <span className="mt-4 rounded-full bg-[#E1306C]/10 px-4 py-1.5 text-xs font-semibold text-[#E1306C]">
            Səhifəyə bax →
          </span>
        </a>

        {/* TikTok Card */}
        <a
          href={settings.tiktok_url}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex flex-col items-center justify-center rounded-3xl border border-border bg-surface p-8 text-center transition-all hover:border-black/50 hover:shadow-lg"
        >
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-black/10 text-black transition-transform group-hover:scale-110">
            <svg className="h-7 w-7 fill-current" viewBox="0 0 24 24">
              <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.77 1.52V6.75a4.85 4.85 0 01-1-.06z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-foreground group-hover:text-black transition-colors">
            {t("tiktok")}
          </h2>
          <p className="mt-1 text-xs text-foreground/60">@kavi.gifts_</p>
          <span className="mt-4 rounded-full bg-black/10 px-4 py-1.5 text-xs font-semibold text-black">
            İzlə →
          </span>
        </a>
      </div>
    </div>
  );
}
