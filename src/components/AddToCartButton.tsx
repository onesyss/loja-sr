"use client";

import { useCart } from "@/context/cart-context";
import type { ProductRow } from "@/types/database";

export function AddToCartButton({ product }: { product: ProductRow }) {
  const { add } = useCart();

  return (
    <button
      type="button"
      onClick={() => add(product, 1)}
      disabled={product.stock < 1}
      className="mt-auto w-full rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {product.stock < 1 ? "Indisponível" : "Adicionar ao carrinho"}
    </button>
  );
}
