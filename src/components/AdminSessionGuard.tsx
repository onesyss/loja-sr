"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { tryPromoteAdminFromSignup, fetchProfileIsAdmin } from "@/lib/admin-role";
import { createClient } from "@/lib/supabase/client";

export function AdminSessionGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      const supabase = createClient();
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (cancelled) return;

      if (error || !user) {
        router.replace(`/admin/login?redirect=${encodeURIComponent(pathname || "/admin")}`);
        return;
      }

      let isAdmin = await fetchProfileIsAdmin(supabase, user.id);
      if (!isAdmin) {
        await tryPromoteAdminFromSignup();
        isAdmin = await fetchProfileIsAdmin(supabase, user.id);
      }

      if (cancelled) return;

      if (!isAdmin) {
        router.replace("/admin/sem-permissao");
        return;
      }

      setAllowed(true);
    }

    void verify();
    return () => {
      cancelled = true;
    };
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
