import type { ProductRow } from "@/types/database";

/** Melissa exige data de nascimento no checkout — detecta por nome, slug ou descrição. */
export function productRequiresBirthDate(product: Pick<ProductRow, "name" | "slug" | "description">): boolean {
  const text = `${product.name} ${product.slug} ${product.description ?? ""}`.toLowerCase();
  return text.includes("melissa");
}
