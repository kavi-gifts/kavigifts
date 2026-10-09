import { setRequestLocale, getTranslations } from "next-intl/server";
import { getStaticPage } from "@/lib/data";
import { pickL10n } from "@/lib/forms";

export default async function AboutPage({ params }: PageProps<"/[locale]/about">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("about");
  const pageData = await getStaticPage("about");
  const content = pickL10n(pageData?.content, locale);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <div className="rounded-3xl border border-border bg-surface p-8 shadow-xs sm:p-12">
        <h1 className="mb-6 font-serif text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {t("title")}
        </h1>
        <div className="prose prose-neutral max-w-none text-base leading-relaxed text-foreground/80">
          <p className="whitespace-pre-line">{content || "Kavi Gifts haqqında məlumat tezliklə burada olacaq."}</p>
        </div>
      </div>
    </div>
  );
}
