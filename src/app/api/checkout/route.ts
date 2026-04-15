import { MercadoPagoConfig, Preference } from "mercadopago";
import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

type Body = {
  items: { product_id: string; quantity: number }[];
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  shipping_address: { street: string; city: string; postal_code: string };
};

export async function POST(request: Request) {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (!accessToken || !appUrl) {
    return NextResponse.json(
      { error: "Mercado Pago ou NEXT_PUBLIC_APP_URL não configurados." },
      { status: 500 },
    );
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  if (
    !body.items?.length ||
    !body.customer_name ||
    !body.customer_email ||
    !body.shipping_address?.street ||
    !body.shipping_address?.city ||
    !body.shipping_address?.postal_code
  ) {
    return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
  }

  const supabase = createServiceClient();

  const productIds = [...new Set(body.items.map((i) => i.product_id))];
  const { data: products, error: prodErr } = await supabase
    .from("products")
    .select("id, name, price_cents, stock, active, image_url")
    .in("id", productIds);

  if (prodErr || !products?.length) {
    return NextResponse.json(
      { error: "Produtos não encontrados." },
      { status: 400 },
    );
  }

  const productMap = new Map(products.map((p) => [p.id, p]));

  let totalCents = 0;
  const lineItems: {
    product_id: string;
    quantity: number;
    unit_price_cents: number;
    title: string;
    picture_url?: string;
  }[] = [];

  for (const line of body.items) {
    const p = productMap.get(line.product_id);
    if (!p || !p.active) {
      return NextResponse.json(
        { error: `Produto inválido: ${line.product_id}` },
        { status: 400 },
      );
    }
    if (line.quantity < 1) {
      return NextResponse.json({ error: "Quantidade inválida." }, { status: 400 });
    }
    if (p.stock < line.quantity) {
      return NextResponse.json(
        { error: `Estoque insuficiente para "${p.name}".` },
        { status: 400 },
      );
    }
    const unit = p.price_cents;
    totalCents += unit * line.quantity;
    lineItems.push({
      product_id: p.id,
      quantity: line.quantity,
      unit_price_cents: unit,
      title: p.name,
      picture_url: p.image_url ?? undefined,
    });
  }

  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .insert({
      status: "pending",
      total_cents: totalCents,
      customer_name: body.customer_name,
      customer_email: body.customer_email,
      customer_phone: body.customer_phone ?? null,
      shipping_address: body.shipping_address,
    })
    .select("id")
    .single();

  if (orderErr || !order) {
    console.error(orderErr);
    return NextResponse.json(
      { error: "Não foi possível criar o pedido." },
      { status: 500 },
    );
  }

  const orderId = order.id;

  const { error: itemsErr } = await supabase.from("order_items").insert(
    lineItems.map((l) => ({
      order_id: orderId,
      product_id: l.product_id,
      quantity: l.quantity,
      unit_price_cents: l.unit_price_cents,
    })),
  );

  if (itemsErr) {
    console.error(itemsErr);
    await supabase.from("orders").delete().eq("id", orderId);
    return NextResponse.json(
      { error: "Não foi possível salvar os itens do pedido." },
      { status: 500 },
    );
  }

  const mp = new MercadoPagoConfig({ accessToken });
  const preference = new Preference(mp);

  try {
    const pref = await preference.create({
      body: {
        items: lineItems.map((l) => ({
          id: l.product_id,
          title: l.title.slice(0, 256),
          quantity: l.quantity,
          unit_price: l.unit_price_cents / 100,
          currency_id: "BRL",
          picture_url: l.picture_url,
        })),
        external_reference: orderId,
        payer: {
          email: body.customer_email,
          name: body.customer_name.split(" ")[0],
          surname: body.customer_name.split(" ").slice(1).join(" ") || undefined,
        },
        back_urls: {
          success: `${appUrl}/pagamento/sucesso?order_id=${orderId}`,
          failure: `${appUrl}/pagamento/falha`,
          pending: `${appUrl}/pagamento/pendente`,
        },
        auto_return: "approved",
        notification_url: `${appUrl}/api/webhooks/mercadopago`,
      },
    });

    const preferenceId = pref.id;
    const initPoint = pref.init_point ?? pref.sandbox_init_point;
    if (!preferenceId || !initPoint) {
      return NextResponse.json(
        { error: "Resposta inválida do Mercado Pago." },
        { status: 502 },
      );
    }

    const { error: upErr } = await supabase
      .from("orders")
      .update({ mercadopago_preference_id: preferenceId })
      .eq("id", orderId);

    if (upErr) {
      console.error(upErr);
    }

    return NextResponse.json({ init_point: initPoint, order_id: orderId });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Falha ao gerar pagamento no Mercado Pago." },
      { status: 502 },
    );
  }
}
