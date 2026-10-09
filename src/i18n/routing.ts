import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["az", "ru", "en"],
  defaultLocale: "az",
});

export type Locale = (typeof routing.locales)[number];
