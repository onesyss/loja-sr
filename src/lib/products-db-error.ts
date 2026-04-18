import type { PostgrestError } from "@supabase/supabase-js";

type ProductOp = "criar" | "atualizar" | "buscar" | "listar" | "excluir";

export function messageFromProductsPostgrestError(error: PostgrestError, op: ProductOp): string {
  const raw = (error.message || "").toLowerCase();
  const code = String(error.code ?? "");

  if (
    code === "42703" ||
    (raw.includes("column") && raw.includes("does not exist")) ||
    raw.includes("schema cache")
  ) {
    return "A base de dados precisa de migração: no Supabase (SQL Editor) execute as alterações em supabase/schema.sql ou supabase/migrate-product-brand.sql (colunas em products, por exemplo color_linked_images e brand).";
  }

  if (code === "23505" || raw.includes("duplicate") || raw.includes("unique")) {
    return op === "criar"
      ? "Já existe um produto com este slug. Altere o slug ou edite o produto existente."
      : "Já existe outro produto com este slug. Escolha outro slug.";
  }

  if (code === "23514" || raw.includes("check constraint") || raw.includes("violates check")) {
    return "Algum valor não é aceito pelo banco (categoria, público, estilo, etc.). Confira os dados.";
  }

  const generic =
    op === "criar"
      ? "Falha ao criar produto."
      : op === "atualizar"
        ? "Falha ao atualizar produto."
        : op === "listar"
          ? "Falha ao buscar produtos."
          : op === "excluir"
            ? "Falha ao excluir produto."
            : "Falha ao buscar produto.";

  if (process.env.NODE_ENV === "development" && error.message?.trim()) {
    return `${generic} (${error.message.trim()})`;
  }
  return generic;
}
