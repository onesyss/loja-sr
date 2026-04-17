import { NextResponse } from "next/server";
import { APP_SIGNUP_ADMIN_PANEL } from "@/lib/admin-signup";
import { createClient, createServiceClient } from "@/lib/supabase/server";

/**
 * Promove a admin quem se cadastrou em /admin/cadastro (metadado app_signup).
 * Útil para perfis criados antes do trigger no banco ou quando o trigger ainda não foi aplicado.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const meta = user.user_metadata as { app_signup?: string } | undefined;
  if (meta?.app_signup !== APP_SIGNUP_ADMIN_PANEL) {
    return NextResponse.json({ ok: false, eligible: false });
  }

  const svc = createServiceClient();
  const { data: prof, error: selErr } = await svc
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (selErr) {
    return NextResponse.json({ error: "Falha ao ler perfil" }, { status: 500 });
  }
  if (prof?.role === "admin") {
    return NextResponse.json({ ok: true, promoted: false });
  }

  if (!prof) {
    const { error: insErr } = await svc.from("profiles").insert({
      id: user.id,
      role: "admin",
      preferences: {},
    });
    if (insErr) {
      return NextResponse.json(
        { error: "Falha ao criar perfil de gestor." },
        { status: 500 },
      );
    }
    return NextResponse.json({ ok: true, promoted: true });
  }

  const { error: upErr } = await svc
    .from("profiles")
    .update({ role: "admin" })
    .eq("id", user.id);

  if (upErr) {
    return NextResponse.json({ error: "Falha ao atualizar perfil" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, promoted: true });
}
