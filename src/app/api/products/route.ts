import { NextResponse } from "next/server";
import { normalizeColorLinkedImages } from "@/lib/product-images";
import { messageFromProductsPostgrestError } from "@/lib/products-db-error";
import { createServiceClientOrNull } from "@/lib/supabase/server";
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
    color_linked_images: normalizeColorLinkedImages(payload.color_linked_images),
    active: payload.active,
  };
}

export async function GET(request: Request) {
  const supabase = createServiceClientOrNull();
  if (!supabase) {
    return NextResponse.json(
      {
        error:
          "Servidor sem credenciais Supabase. Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em .env.local.",
      },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  const baseSelect =
    "id, code, name, slug, description, price_cents, discount_percent, max_installments, stock, image_url, audience, style, category, available_sizes, available_colors, extra_image_urls, color_linked_images, active, created_at, updated_at";

  if (slug) {
    const { data, error } = await supabase
      .from("products")
      .select(baseSelect)
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: messageFromProductsPostgrestError(error, "buscar") },
        { status: 500 },
      );
    }
    if (!data) {
      return NextResponse.json({ error: "Produto não encontrado." }, { status: 404 });
    }
    return NextResponse.json(data);
  }

  const { data, error } = await supabase
    .from("products")
    .select(baseSelect)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: messageFromProductsPostgrestError(error, "listar") },
      { status: 500 },
    );
  }

  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  let body: ProductWritePayload;
  try {
    body = (await request.json()) as ProductWritePayload;
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  if (!body?.name?.trim() || !body?.slug?.trim()) {
    return NextResponse.json({ error: "Nome e slug são obrigatórios." }, { status: 400 });
  }

  const supabase = createServiceClientOrNull();
  if (!supabase) {
    return NextResponse.json(
      {
        error:
          "Servidor sem credenciais Supabase. Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em .env.local.",
      },
      { status: 503 },
    );
  }

  const payload = normalizePayload(body);

  const { data, error } = await supabase
    .from("products")
    .insert(payload)
    .select(
      "id, code, name, slug, description, price_cents, discount_percent, max_installments, stock, image_url, audience, style, category, available_sizes, available_colors, extra_image_urls, color_linked_images, active, created_at, updated_at",
    )
    .single();

  if (error) {
    const raw = (error.message || "").toLowerCase();
    const code = String((error as { code?: string }).code ?? "");
    const isDuplicate =
      code === "23505" ||
      raw.includes("duplicate") ||
      raw.includes("unique") ||
      raw.includes("products_slug_key");
    return NextResponse.json(
      { error: messageFromProductsPostgrestError(error, "criar") },
      { status: isDuplicate ? 409 : 500 },
    );
  }

  return NextResponse.json(data, { status: 201 });
}
