"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ProductForm } from "@/components/ProductForm";
import {
  getLocalProductById,
  PRODUCTS_UPDATED_EVENT,
} from "@/lib/local-products";
import type { ProductRow } from "@/types/database";

export default function EditarProdutoPage() {
  const params = useParams<{ id: string }>();
  const [product, setProduct] = useState<ProductRow | null>(null);

  useEffect(() => {
    const refreshProduct = () => {
      setProduct(getLocalProductById(params.id) ?? null);
    };

    refreshProduct();
    window.addEventListener(PRODUCTS_UPDATED_EVENT, refreshProduct);
    window.addEventListener("storage", refreshProduct);

    return () => {
      window.removeEventListener(PRODUCTS_UPDATED_EVENT, refreshProduct);
      window.removeEventListener("storage", refreshProduct);
    };
  }, [params.id]);

  if (!product) {
    return <p className="text-stone-600">Produto não encontrado.</p>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">Editar produto</h1>
      <p className="mt-1 text-stone-600">{product.name}</p>
      <div className="mt-8">
        <ProductForm initial={product} />
      </div>
    </div>
  );
}
