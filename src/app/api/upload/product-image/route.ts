import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { PRODUCT_IMAGE_MAX_BYTES } from "@/lib/product-image-upload";

const ALLOWED = new Map<string, string>([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

/** Alguns sistemas enviam `type` vazio; inferir pela extensão. */
function mimeFromFileName(name: string): string | null {
  const lower = name.toLowerCase();
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  return null;
}

function friendlyStorageError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("bucket") && (m.includes("not found") || m.includes("does not exist"))) {
    return "Bucket de imagens não encontrado. No Supabase: Storage → crie um bucket público chamado product-images, ou rode o trecho de storage do arquivo supabase/schema.sql.";
  }
  if (m.includes("row-level security") || m.includes("policy")) {
    return "Permissão negada no armazenamento. Confira se SUPABASE_SERVICE_ROLE_KEY no .env.local / Vercel está correta (Project Settings → API).";
  }
  if (m.includes("jwt") || m.includes("invalid api key")) {
    return "Chave do Supabase inválida. Verifique NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.";
  }
  return message;
}

export async function POST(request: Request) {
  try {
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

    const mime = file.type || mimeFromFileName(file.name) || "";
    const ext = ALLOWED.get(mime);
    if (!ext) {
      return NextResponse.json(
        {
          error:
            "Use JPEG, PNG ou WebP. Se o arquivo é válido, o navegador não enviou o tipo — renomeie para .jpg, .png ou .webp.",
        },
        { status: 400 },
      );
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const objectPath = `products/${user.id}/${Date.now()}-${randomBytes(4).toString("hex")}.${ext}`;

    const svc = createServiceClient();
    const { data: uploaded, error: upErr } = await svc.storage
      .from("product-images")
      .upload(objectPath, buf, {
        contentType: mime,
        upsert: false,
      });

    if (upErr || !uploaded) {
      const raw = upErr?.message ?? "Erro desconhecido no Storage.";
      return NextResponse.json(
        { error: friendlyStorageError(raw) },
        { status: 500 },
      );
    }

    const { data: pub } = svc.storage.from("product-images").getPublicUrl(uploaded.path);

    return NextResponse.json({ url: pub.publicUrl });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("SUPABASE_SERVICE_ROLE_KEY") || msg.includes("ausente")) {
      return NextResponse.json(
        {
          error:
            "Servidor sem SUPABASE_SERVICE_ROLE_KEY. Copie em Project Settings → API no Supabase e defina na Vercel / .env.local.",
        },
        { status: 500 },
      );
    }
    return NextResponse.json(
      { error: `Falha ao enviar imagem: ${msg}` },
      { status: 500 },
    );
  }
}
