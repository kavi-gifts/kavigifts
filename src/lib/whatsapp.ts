export type WhatsAppProductOrder = {
  code: string;
  title: string;
  price?: number | null;
  salePrice?: number | null;
  currency?: string;
  variantLabel?: string;
  productUrl: string;
};

export type WhatsAppBundleOrder = {
  collectionName: string;
  bundlePrice?: number | null;
  bundleSalePrice?: number | null;
  currency?: string;
  collectionUrl: string;
};

export function buildWhatsAppProductUrl(
  baseUrl: string,
  item: WhatsAppProductOrder,
  locale = "az",
): string {
  const intro =
    locale === "ru"
      ? "Здравствуйте! Хочу заказать этот товар:"
      : locale === "en"
      ? "Hello! I would like to order this item:"
      : "Salam! Bu məhsulu sifariş etmək istəyirəm:";

  const priceText =
    item.salePrice != null
      ? `${item.salePrice} ${item.currency ?? "AZN"} (Endirimlə)`
      : item.price != null
      ? `${item.price} ${item.currency ?? "AZN"}`
      : locale === "ru"
      ? "Цена по запросу"
      : locale === "en"
      ? "Price on request"
      : "Qiymət üçün yazın";

  const codeLabel = locale === "ru" ? "Код" : locale === "en" ? "Code" : "Kod";
  const titleLabel = locale === "ru" ? "Товар" : locale === "en" ? "Item" : "Məhsul";
  const variantWord = locale === "ru" ? "Вариант" : locale === "en" ? "Variant" : "Variant";
  const priceLabel = locale === "ru" ? "Цена" : locale === "en" ? "Price" : "Qiymət";
  const linkLabel = locale === "ru" ? "Ссылка" : locale === "en" ? "Link" : "Keçid";

  const lines = [
    intro,
    "",
    `• *${codeLabel}:* ${item.code}`,
    `• *${titleLabel}:* ${item.title}`,
    item.variantLabel ? `• *${variantWord}:* ${item.variantLabel}` : null,
    `• *${priceLabel}:* ${priceText}`,
    `• *${linkLabel}:* ${item.productUrl}`,
  ].filter((line): line is string => line !== null);

  const cleanBase = baseUrl.replace(/\/+$/, "");
  const separator = cleanBase.includes("?") ? "&" : "?";
  return `${cleanBase}${separator}text=${encodeURIComponent(lines.join("\n"))}`;
}

export function buildWhatsAppBundleUrl(
  baseUrl: string,
  bundle: WhatsAppBundleOrder,
  locale = "az",
): string {
  const intro =
    locale === "ru"
      ? "Здравствуйте! Хочу заказать весь комплект этой коллекции:"
      : locale === "en"
      ? "Hello! I would like to order this entire collection bundle:"
      : "Salam! Bu kolleksiyanın bütöv paketini sifariş etmək istəyirəm:";

  const priceText =
    bundle.bundleSalePrice != null
      ? `${bundle.bundleSalePrice} ${bundle.currency ?? "AZN"} (Endirimlə)`
      : bundle.bundlePrice != null
      ? `${bundle.bundlePrice} ${bundle.currency ?? "AZN"}`
      : "";

  const colLabel = locale === "ru" ? "Коллекция" : locale === "en" ? "Collection" : "Kolleksiya";
  const bundlePriceLabel = locale === "ru" ? "Цена комплекта" : locale === "en" ? "Bundle price" : "Paket qiyməti";
  const linkLabel = locale === "ru" ? "Ссылка" : locale === "en" ? "Link" : "Keçid";

  const lines = [
    intro,
    "",
    `• *${colLabel}:* ${bundle.collectionName}`,
    priceText ? `• *${bundlePriceLabel}:* ${priceText}` : null,
    `• *${linkLabel}:* ${bundle.collectionUrl}`,
  ].filter((line): line is string => line !== null);

  const cleanBase = baseUrl.replace(/\/+$/, "");
  const separator = cleanBase.includes("?") ? "&" : "?";
  return `${cleanBase}${separator}text=${encodeURIComponent(lines.join("\n"))}`;
}
