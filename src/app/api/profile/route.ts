import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ProfilePreferences } from "@/types/database";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, role, preferences, created_at")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Falha ao buscar perfil" }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  let body: { preferences?: Partial<ProfilePreferences> };
  try {
    body = (await request.json()) as { preferences?: Partial<ProfilePreferences> };
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (!body.preferences || typeof body.preferences !== "object") {
    return NextResponse.json({ error: "preferences obrigatório" }, { status: 400 });
  }

  const { data: row } = await supabase
    .from("profiles")
    .select("preferences")
    .eq("id", user.id)
    .maybeSingle();

  const prev = (row?.preferences as ProfilePreferences | null) ?? {};
  const merged: ProfilePreferences = { ...prev };
  for (const key of Object.keys(body.preferences) as (keyof ProfilePreferences)[]) {
    const v = body.preferences[key];
    if (v === undefined || v === "") {
      delete merged[key];
    } else {
      merged[key] = v;
    }
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({ preferences: merged as unknown as Record<string, unknown> })
    .eq("id", user.id)
    .select("id, role, preferences, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: "Falha ao salvar" }, { status: 500 });
  }

  return NextResponse.json(data);
}
