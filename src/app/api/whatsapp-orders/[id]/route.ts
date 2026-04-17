import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = createServiceClient();

  const { error } = await supabase.from("whatsapp_orders").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Falha ao apagar pedido." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
