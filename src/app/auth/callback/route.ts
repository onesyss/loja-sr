import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Retorno do link de confirmação de e-mail (Supabase PKCE). */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextRaw = searchParams.get("next") ?? "/admin/login";
  const next = nextRaw.startsWith("/") ? nextRaw : `/${nextRaw}`;

  const err = searchParams.get("error");
  const errorCode = searchParams.get("error_code");
  if (err || errorCode) {
    const q = new URLSearchParams();
    if (errorCode === "otp_expired") {
      q.set("motivo", "link_expirado");
    } else {
      q.set("motivo", "link_invalido");
    }
    return NextResponse.redirect(`${origin}/admin/login?${q.toString()}`);
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(
        `${origin}/admin/login?motivo=confirmar_falhou`,
      );
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
