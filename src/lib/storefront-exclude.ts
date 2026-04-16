import type { ProductRow } from "@/types/database";

/** Loja só feminina/infantil — não exibir produtos com copy masculina no nome/slug/descrição. */
export function isHiddenFromStorefront(product: ProductRow): boolean {
  const text = `${product.name} ${product.slug} ${product.description ?? ""}`.toLowerCase();
  return /masculino|masculinos|homem|homens/.test(text);
}
