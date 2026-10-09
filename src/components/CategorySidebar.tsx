"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { pickL10n } from "@/lib/forms";
import type { CategoryNode } from "@/lib/data";

export function CategorySidebar({
  tree,
  currentCategorySlug,
  currentCollectionSlug,
}: {
  tree: CategoryNode[];
  currentCategorySlug?: string;
  currentCollectionSlug?: string;
}) {
  const locale = useLocale();
  const t = useTranslations("nav");

  // Keep all top categories open by default for discoverability
  const [openNodes, setOpenNodes] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const c of tree) {
      init[c.id] = true;
    }
    return init;
  });

  function toggle(id: string) {
    setOpenNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  return (
    <aside className="w-full rounded-2xl border border-border bg-surface p-4 shadow-xs">
      <div className="mb-4 flex items-center justify-between border-b border-border/60 pb-3">
        <h2 className="font-serif text-lg font-semibold text-foreground">
          {t("categories")}
        </h2>
      </div>

      <nav className="space-y-2 text-sm">
        {tree.map((cat) => {
          const isOpen = openNodes[cat.id] ?? true;
          const isCatActive = currentCategorySlug === cat.slug;
          const hasChildren = cat.children.length > 0 || cat.collections.length > 0;

          return (
            <div key={cat.id} className="space-y-1">
              {/* Root Category Row */}
              <div className="flex items-center justify-between">
                <Link
                  href={`/c/${cat.slug}`}
                  className={`flex-1 rounded-lg px-2.5 py-1.5 font-medium transition-colors ${
                    isCatActive
                      ? "bg-gold/15 text-gold font-semibold"
                      : "text-foreground hover:bg-background"
                  }`}
                >
                  {pickL10n(cat.name, locale)}
                </Link>
                {hasChildren && (
                  <button
                    type="button"
                    onClick={() => toggle(cat.id)}
                    className="p-1.5 text-foreground/40 hover:text-foreground"
                    aria-label="Aç/Bağla"
                  >
                    <svg
                      className={`h-3.5 w-3.5 transition-transform ${
                        isOpen ? "rotate-90" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                )}
              </div>

              {/* Subcategories & Direct Collections */}
              {isOpen && hasChildren && (
                <div className="ml-3 space-y-1 border-l border-border/80 pl-3">
                  {/* Direct collections under this category */}
                  {cat.collections.map((col) => {
                    const isColActive = currentCollectionSlug === col.slug;
                    return (
                      <Link
                        key={col.id}
                        href={`/collection/${col.slug}`}
                        className={`block rounded-lg px-2 py-1 text-xs transition-colors ${
                          isColActive
                            ? "bg-gold/15 font-semibold text-gold"
                            : "text-foreground/70 hover:text-foreground hover:bg-background"
                        }`}
                      >
                        ✦ {pickL10n(col.name, locale)}
                      </Link>
                    );
                  })}

                  {/* Subcategories (e.g. Animelər) */}
                  {cat.children.map((sub) => {
                    const isSubActive = currentCategorySlug === sub.slug;
                    const subHasCollections = sub.collections.length > 0;
                    return (
                      <div key={sub.id} className="space-y-1 pt-1">
                        <Link
                          href={`/c/${sub.slug}`}
                          className={`block rounded-lg px-2 py-1 text-xs font-medium transition-colors ${
                            isSubActive
                              ? "bg-gold/15 font-semibold text-gold"
                              : "text-foreground/80 hover:text-foreground hover:bg-background"
                          }`}
                        >
                          ▸ {pickL10n(sub.name, locale)}
                        </Link>

                        {/* Collections inside this subcategory (e.g. Attack on Titan) */}
                        {subHasCollections && (
                          <div className="ml-3 space-y-0.5 border-l border-border/60 pl-2">
                            {sub.collections.map((subCol) => {
                              const isSubColActive =
                                currentCollectionSlug === subCol.slug;
                              return (
                                <Link
                                  key={subCol.id}
                                  href={`/collection/${subCol.slug}`}
                                  className={`block rounded-md px-2 py-1 text-xs transition-colors ${
                                    isSubColActive
                                      ? "bg-gold/20 font-semibold text-gold"
                                      : "text-foreground/60 hover:text-foreground hover:bg-background"
                                  }`}
                                >
                                  {pickL10n(subCol.name, locale)}
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {!tree.length && (
          <p className="py-2 text-xs text-foreground/50">Hələlik kateqoriya yoxdur.</p>
        )}
      </nav>
    </aside>
  );
}
