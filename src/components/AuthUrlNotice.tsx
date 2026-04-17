"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * Se o link de confirmação do e-mail cair na home com erro (ex.: link expirado),
 * redireciona para o login com mensagem amigável em vez de mostrar URL técnica.
 */
export function AuthUrlNotice() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined" || pathname !== "/") return;

    const url = new URL(window.location.href);
    const qsCode = url.searchParams.get("error_code");
    const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));
    const hashCode = hashParams.get("error_code");

    if (qsCode === "otp_expired" || hashCode === "otp_expired") {
      router.replace("/admin/login?motivo=link_expirado");
    }
  }, [pathname, router]);

  return null;
}
