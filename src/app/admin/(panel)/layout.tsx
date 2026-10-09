import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { logout } from "../login/actions";
import { btnGhostCls } from "@/components/admin/ui";

const NAV = [
  { href: "/admin", label: "Panel" },
  { href: "/admin/categories", label: "Kateqoriyalar" },
  { href: "/admin/collections", label: "Kolleksiyalar" },
  { href: "/admin/products", label: "Məhsullar" },
  { href: "/admin/about", label: "Haqqımızda" },
  { href: "/admin/settings", label: "Ayarlar" },
];

export default async function PanelLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin();
  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r border-border bg-surface p-4">
        <div className="mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="KaVi" className="h-10 w-auto object-contain" />
        </div>
        <nav className="space-y-1">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="block rounded-lg px-3 py-2 text-sm hover:bg-background"
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <form action={logout} className="mt-8">
          <button className={btnGhostCls}>Çıxış</button>
        </form>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
