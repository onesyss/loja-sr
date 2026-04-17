import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { PRODUCT_IMAGE_MAX_BYTES } from "@/lib/product-image-upload";

const ALLOWED = new Map<string, string>([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authErr,
  } = await supabase.auth.getUser();
  if (authErr || !user) {
    return NextResponse.json({ error: "Faça login para enviar imagens." }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Formulário inválido." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
  }
  if (file.size > PRODUCT_IMAGE_MAX_BYTES) {
    return NextResponse.json(
      {
        error: `Arquivo muito grande. Máximo ${PRODUCT_IMAGE_MAX_BYTES / (1024 * 1024)} MB.`,
      },
      { status: 413 },
    );
  }

  const ext = ALLOWED.get(file.type);
  if (!ext) {
    return NextResponse.json({ error: "Use JPEG, PNG ou WebP." }, { status: 400 });
  }

  const buf = Buffer.from(await file.arrayBuffer());
  const objectPath = `products/${user.id}/${Date.now()}-${randomBytes(4).toString("hex")}.${ext}`;

  const svc = createServiceClient();
  const { data: uploaded, error: upErr } = await svc.storage
    .from("product-images")
    .upload(objectPath, buf, {
      contentType: file.type,
      upsert: false,
    });

  if (upErr || !uploaded) {
    return NextResponse.json({ error: "Falha ao enviar imagem." }, { status: 500 });
  }

  const { data: pub } = svc.storage.from("product-images").getPublicUrl(uploaded.path);

  return NextResponse.json({ url: pub.publicUrl });
}
