import Link from "next/link";
import { AdminLogoutButton } from "@/components/AdminLogoutButton";
import { AdminSessionGuard } from "@/components/AdminSessionGuard";

export default function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminSessionGuard>
      <div className="min-h-screen bg-stone-100">
        <div className="border-b border-stone-200 bg-white">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
            <div className="flex items-center gap-6">
              <Link href="/admin" className="font-semibold text-violet-700">
                Admin · SR CALÇADOS
              </Link>
              <nav className="flex gap-4 text-sm text-stone-600">
                <Link href="/admin/produtos" className="hover:text-violet-600">
                  Produtos
                </Link>
                <Link href="/admin/pedidos" className="hover:text-violet-600">
                  Pedidos
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/" className="text-sm text-stone-500 hover:text-violet-600">
                Ver loja
              </Link>
              <AdminLogoutButton />
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-4 py-8">{children}</div>
      </div>
    </AdminSessionGuard>
  );
}
