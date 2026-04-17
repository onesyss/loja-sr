import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import type { ProductRow } from "@/types/database";

type ProductWritePayload = Omit<ProductRow, "id" | "created_at" | "updated_at">;

function normalizePayload(payload: ProductWritePayload) {
  return {
    code: payload.code?.trim() || null,
    name: payload.name.trim(),
    slug: payload.slug.trim(),
    description: payload.description?.trim() || null,
    category: payload.category ?? null,
    audience: payload.audience ?? null,
    style: payload.style ?? null,
    price_cents: payload.price_cents,
    discount_percent:
      typeof payload.discount_percent === "number" ? payload.discount_percent : 6,
    max_installments:
      typeof payload.max_installments === "number" ? payload.max_installments : 5,
    stock: payload.stock,
    image_url: payload.image_url ?? null,
    available_sizes: payload.available_sizes ?? null,
    available_colors: payload.available_colors ?? null,
    extra_image_urls: payload.extra_image_urls ?? null,
    active: payload.active,
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("products")
    .select(
      "id, code, name, slug, description, price_cents, discount_percent, max_installments, stock, image_url, audience, style, category, available_sizes, available_colors, extra_image_urls, active, created_at, updated_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Falha ao buscar produto." }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });
  }
  return NextResponse.json(data);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let body: ProductWritePayload;
  try {
    body = (await request.json()) as ProductWritePayload;
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }
  if (!body?.name?.trim() || !body?.slug?.trim()) {
    return NextResponse.json({ error: "Nome e slug são obrigatórios." }, { status: 400 });
  }

  const supabase = createServiceClient();
  const payload = normalizePayload(body);

  const { data, error } = await supabase
    .from("products")
    .update(payload)
    .eq("id", id)
    .select(
      "id, code, name, slug, description, price_cents, discount_percent, max_installments, stock, image_url, audience, style, category, available_sizes, available_colors, extra_image_urls, active, created_at, updated_at",
    )
    .maybeSingle();

  if (error) {
    const isDuplicate = (error.message || "").toLowerCase().includes("duplicate");
    return NextResponse.json(
      { error: isDuplicate ? "Slug já existe." : "Falha ao atualizar produto." },
      { status: isDuplicate ? 409 : 500 },
    );
  }
  if (!data) {
    return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });
  }
  return NextResponse.json(data);
}
