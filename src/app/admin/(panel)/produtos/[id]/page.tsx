"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { IconTrash } from "@/components/AdminActionIcons";
import { ConfirmModal } from "@/components/ConfirmModal";
import { ProductForm } from "@/components/ProductForm";
import {
  deleteLocalProduct,
  getLocalProductById,
  PRODUCTS_UPDATED_EVENT,
} from "@/lib/local-products";
import type { ProductRow } from "@/types/database";

export default function EditarProdutoPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<ProductRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  useEffect(() => {
    const refreshProduct = async () => {
      const found = await getLocalProductById(params.id);
      setProduct(found ?? null);
    };

    void refreshProduct();
    const onProductsUpdated = () => {
      void refreshProduct();
    };
    window.addEventListener(PRODUCTS_UPDATED_EVENT, onProductsUpdated);
    window.addEventListener("storage", onProductsUpdated);

    return () => {
      window.removeEventListener(PRODUCTS_UPDATED_EVENT, onProductsUpdated);
      window.removeEventListener("storage", onProductsUpdated);
    };
  }, [params.id]);

  if (!product) {
    return <p className="text-stone-600">Produto não encontrado.</p>;
  }

  async function runDeleteConfirmed() {
    setDeleting(true);
    setDeleteError(null);
    const res = await deleteLocalProduct(product.id);
    setDeleting(false);
    setDeleteModalOpen(false);
    if (!res.ok) {
      setDeleteError(res.error);
      return;
    }
    router.push("/admin/produtos");
    router.refresh();
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Editar produto</h1>
          <p className="mt-1 text-stone-600">{product.name}</p>
          <p className="mt-1 font-mono text-xs text-stone-500" title="Identificador no banco">
            Id: {product.id}
          </p>
        </div>
        <button
          type="button"
          disabled={deleting}
          onClick={() => setDeleteModalOpen(true)}
          title="Excluir produto"
          aria-label="Excluir produto"
          className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-800 transition hover:bg-red-100 disabled:opacity-60"
        >
          <IconTrash className="h-5 w-5" />
        </button>
      </div>

      <ConfirmModal
        open={deleteModalOpen}
        title="Excluir produto?"
        description={`O produto «${product.name}» será removido permanentemente da loja.\n\nEsta ação não pode ser anulada.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        confirmVariant="danger"
        busy={deleting}
        onCancel={() => {
          if (!deleting) setDeleteModalOpen(false);
        }}
        onConfirm={() => void runDeleteConfirmed()}
      />
      {deleteError ? (
        <p className="mt-4 text-sm text-red-700" role="alert">
          {deleteError}
        </p>
      ) : null}
      <div className="mt-8">
        <ProductForm initial={product} />
      </div>
      <div className="mt-10 border-t border-stone-200 pt-6">
        <p className="text-sm text-stone-600">
          <Link href="/admin/produtos" className="font-medium text-violet-600 hover:underline">
            ← Voltar à lista de produtos
          </Link>
        </p>
      </div>
    </div>
  );
}
