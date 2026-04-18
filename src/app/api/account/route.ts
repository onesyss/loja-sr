import { NextResponse } from "next/server";
import { createClient, createServiceClientOrNull } from "@/lib/supabase/server";

/** Exclui o utilizador autenticado (auth + perfil em cascade). Requer SUPABASE_SERVICE_ROLE_KEY. */
export async function DELETE() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const admin = createServiceClientOrNull();
  if (!admin) {
    return NextResponse.json(
      {
        error:
          "Exclusão de conta não está disponível no servidor (defina SUPABASE_SERVICE_ROLE_KEY).",
      },
      { status: 503 },
    );
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    return NextResponse.json({ error: "Não foi possível excluir a conta." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
