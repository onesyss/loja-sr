import { MercadoPagoConfig, Payment } from "mercadopago";
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  return NextResponse.json({ ok: true });
}

export async function POST(request: Request) {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) {
    return NextResponse.json({ error: "Token ausente" }, { status: 500 });
  }

  let paymentId: string | null = null;

  const url = new URL(request.url);
  const topic = url.searchParams.get("topic") ?? url.searchParams.get("type");
  const idParam = url.searchParams.get("id") ?? url.searchParams.get("data.id");

  if (topic === "payment" && idParam) {
    paymentId = idParam;
  }

  if (!paymentId) {
    try {
      const body = (await request.json()) as {
        type?: string;
        topic?: string;
        action?: string;
        data?: { id?: string };
      };
      if (body?.data?.id) {
        paymentId = String(body.data.id);
      }
      if (!paymentId && body?.type === "payment" && (body as { id?: string }).id) {
        paymentId = String((body as { id: string }).id);
      }
    } catch {
      /* body vazio ou não JSON */
    }
  }

  if (!paymentId) {
    return NextResponse.json({ received: true });
  }

  const mp = new MercadoPagoConfig({ accessToken });
  const paymentClient = new Payment(mp);

  let payment: {
    id?: number;
    status?: string;
    external_reference?: string | null;
  };

  try {
    payment = await paymentClient.get({ id: paymentId });
  } catch (e) {
    console.error("MP get payment", e);
    return NextResponse.json({ error: "payment_fetch_failed" }, { status: 502 });
  }

  const orderId = payment.external_reference;
  if (!orderId) {
    return NextResponse.json({ received: true });
  }

  if (payment.status !== "approved") {
    if (payment.status === "rejected" || payment.status === "cancelled") {
      const supabase = createServiceClient();
      await supabase
        .from("orders")
        .update({ status: "failed", mercadopago_payment_id: String(payment.id) })
        .eq("id", orderId)
        .eq("status", "pending");
    }
    return NextResponse.json({ received: true });
  }

  const supabase = createServiceClient();

  const { data: existing } = await supabase
    .from("orders")
    .select("id, status")
    .eq("id", orderId)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ received: true });
  }

  if (existing.status === "paid") {
    return NextResponse.json({ received: true });
  }

  const { error: orderUpdateErr } = await supabase
    .from("orders")
    .update({
      status: "paid",
      mercadopago_payment_id: String(payment.id ?? paymentId),
    })
    .eq("id", orderId)
    .eq("status", "pending");

  if (orderUpdateErr) {
    console.error(orderUpdateErr);
    return NextResponse.json({ error: "order_update_failed" }, { status: 500 });
  }

  const { data: items, error: itemsErr } = await supabase
    .from("order_items")
    .select("product_id, quantity")
    .eq("order_id", orderId);

  if (itemsErr || !items?.length) {
    return NextResponse.json({ received: true });
  }

  for (const row of items) {
    const { data: prod } = await supabase
      .from("products")
      .select("stock")
      .eq("id", row.product_id)
      .single();

    if (!prod) continue;
    const nextStock = Math.max(0, prod.stock - row.quantity);
    await supabase
      .from("products")
      .update({ stock: nextStock })
      .eq("id", row.product_id);
  }

  return NextResponse.json({ received: true });
}
