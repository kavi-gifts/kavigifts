export type L10n = { az: string; ru?: string; en?: string };

/** Azərbaycan hərflərini latın slug-a çevirir. */
export function slugify(s: string): string {
  const map: Record<string, string> = {
    ə: "e", Ə: "e", ı: "i", İ: "i", ö: "o", Ö: "o", ü: "u", Ü: "u",
    ş: "s", Ş: "s", ç: "c", Ç: "c", ğ: "g", Ğ: "g",
  };
  return s
    .split("")
    .map((c) => map[c] ?? c)
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function str(fd: FormData, name: string): string {
  return String(fd.get(name) ?? "").trim();
}

export function num(fd: FormData, name: string): number | null {
  const v = str(fd, name).replace(",", ".");
  if (v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function bool(fd: FormData, name: string): boolean {
  return fd.get(name) === "on";
}

/** `${name}_az/ru/en` sahələrini oxuyur. AZ boşdursa null. */
export function readL10n(fd: FormData, name: string): L10n | null {
  const az = str(fd, `${name}_az`);
  if (!az) return null;
  const ru = str(fd, `${name}_ru`);
  const en = str(fd, `${name}_en`);
  return { az, ...(ru && { ru }), ...(en && { en }) };
}

async function deepl(text: string, target: "RU" | "EN-US"): Promise<string | null> {
  const key = process.env.DEEPL_API_KEY;
  if (!key) return null;
  try {
    const host = key.endsWith(":fx") ? "api-free.deepl.com" : "api.deepl.com";
    const res = await fetch(`https://${host}/v2/translate`, {
      method: "POST",
      headers: {
        Authorization: `DeepL-Auth-Key ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: [text], source_lang: "AZ", target_lang: target }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { translations?: { text: string }[] };
    return json.translations?.[0]?.text ?? null;
  } catch {
    return null;
  }
}

/** Boş RU/EN sahələrini avtomatik tərcümə ilə doldurur (əl ilə yazılmışlar toxunulmur). */
export async function withTranslations(v: L10n): Promise<L10n> {
  const [ru, en] = await Promise.all([
    v.ru ? v.ru : deepl(v.az, "RU"),
    v.en ? v.en : deepl(v.az, "EN-US"),
  ]);
  return { az: v.az, ...(ru && { ru }), ...(en && { en }) };
}

export function pickL10n(v: unknown, locale: string): string {
  const o = (v ?? {}) as Record<string, string>;
  return o[locale] || o.az || "";
}
