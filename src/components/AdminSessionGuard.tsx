"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ADMIN_SESSION_KEY, readAdminUser } from "@/lib/admin-auth";

export function AdminSessionGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(ADMIN_SESSION_KEY);
      if (!raw) {
        router.replace(`/admin/login?redirect=${encodeURIComponent(pathname || "/admin")}`);
        return;
      }
      const adminUser = readAdminUser();
      if (!adminUser) {
        router.replace("/admin/cadastro");
        return;
      }
      setAllowed(true);
    } catch {
      router.replace("/admin/login");
    }
  }, [pathname, router]);

  if (!allowed) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-stone-500">
        Verificando acesso...
      </div>
    );
  }

  return <>{children}</>;
}
