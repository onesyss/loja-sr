"use client";

import { useRouter } from "next/navigation";
import type { ProductRow } from "@/types/database";

export function AddToCartButton({ product }: { product: ProductRow }) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push(`/produtos/${product.slug}`)}
      disabled={product.stock < 1}
      className="mt-auto w-full rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:from-violet-700 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {product.stock < 1 ? "Indisponível" : "Compre agora"}
    </button>
  );
}
