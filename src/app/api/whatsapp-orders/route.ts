import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import type { WhatsAppOrderRecord } from "@/types/database";

type WhatsPayload = Omit<WhatsAppOrderRecord, "id" | "created_at">;

export async function GET() {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("whatsapp_orders")
    .select(
      "id, created_at, customer_name, customer_email, customer_phone, total_cents, whatsapp_message",
    )
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Falha ao buscar pedidos." }, { status: 500 });
  }
  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  let body: WhatsPayload;
  try {
    body = (await request.json()) as WhatsPayload;
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  if (!body.customer_name?.trim() || !body.customer_email?.trim() || !body.whatsapp_message?.trim()) {
    return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("whatsapp_orders")
    .insert({
      customer_name: body.customer_name.trim(),
      customer_email: body.customer_email.trim(),
      customer_phone: body.customer_phone?.trim() || null,
      total_cents: body.total_cents,
      whatsapp_message: body.whatsapp_message.trim(),
    })
    .select(
      "id, created_at, customer_name, customer_email, customer_phone, total_cents, whatsapp_message",
    )
    .single();

  if (error) {
    return NextResponse.json({ error: "Falha ao salvar pedido." }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}
