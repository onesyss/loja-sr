import type { ProductRow } from "@/types/database";

/** Preço efetivo no Pix (com desconto), alinhado aos cartões da vitrine. */
export function effectivePriceCents(
  product: Pick<ProductRow, "price_cents" | "discount_percent">,
): number {
  const d = product.discount_percent ?? 6;
  return Math.round(product.price_cents * (1 - d / 100));
}

export function formatBRL(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}
