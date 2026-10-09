import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function Footer({
  settings,
}: {
  settings: {
    site_name: string;
    whatsapp_url: string;
    instagram_url: string;
    tiktok_url: string;
  };
}) {
  const tNav = await getTranslations("nav");
  const tContact = await getTranslations("contact");

  return (
    <footer className="mt-20 border-t border-border bg-surface text-foreground/80">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand info */}
          <div className="space-y-3 md:col-span-2">
            <Link href="/" className="inline-block" aria-label="KaVi">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="KaVi"
                className="h-12 w-auto object-contain"
              />
            </Link>
            <p className="max-w-md text-sm text-foreground/70">
              A4 ölçülü xüsusi dizayn tablolar, anime və kino kolleksiyaları, 3D fiqurlar və hədiyyəlik məhsullar. Keyfiyyətli çap və zərif çərçivələr.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground">
              Bölmələr
            </p>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-gold transition-colors">
                  {tNav("home")}
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-gold transition-colors">
                  {tNav("about")}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-gold transition-colors">
                  {tNav("contact")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Social Links */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-foreground">
              {tContact("title")}
            </p>
            <div className="flex flex-col space-y-2 text-sm">
              <a
                href={settings.whatsapp_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 hover:text-gold transition-colors"
              >
                <span className="font-medium text-[#128C7E]">●</span> {tContact("whatsapp")}
              </a>
              <a
                href={settings.instagram_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 hover:text-gold transition-colors"
              >
                <span className="font-medium text-[#E1306C]">●</span> {tContact("instagram")}
              </a>
              <a
                href={settings.tiktok_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 hover:text-gold transition-colors"
              >
                <span className="font-medium text-black">●</span> {tContact("tiktok")}
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between border-t border-border/60 pt-6 text-xs text-foreground/50 sm:flex-row">
          <p>© {new Date().getFullYear()} {settings.site_name}. Bütün hüquqlar qorunur.</p>
          <p className="mt-2 sm:mt-0">Sürətli sifariş və çatdırılma üçün WhatsApp ilə əlaqə saxlayın.</p>
        </div>
      </div>
    </footer>
  );
}
