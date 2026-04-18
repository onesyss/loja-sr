"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { formatBRL } from "@/lib/money";
import {
  PRODUCT_CATEGORY_LABELS,
  PRODUCT_CATEGORY_ORDER,
  resolveProductCategory,
} from "@/lib/product-category";
import { IconPencil, IconTrash } from "@/components/AdminActionIcons";
import { ConfirmModal } from "@/components/ConfirmModal";
import { getDisplayImage } from "@/lib/product-images";
import { systemAlert } from "@/lib/system-dialog";
import {
  deleteLocalProduct,
  getLocalProducts,
  PRODUCTS_UPDATED_EVENT,
} from "@/lib/local-products";
import type { ProductCategory, ProductRow } from "@/types/database";

type CategoryFilter = "todos" | ProductCategory;

type DeleteDialogState =
  | { mode: "one"; product: ProductRow }
  | { mode: "bulk" }
  | null;

export default function AdminProdutosPage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("todos");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(() => new Set());
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>(null);

  useEffect(() => {
    const refreshProducts = async () => {
      const all = await getLocalProducts();
      setProducts(
        [...all].sort((a, b) =>
          a.created_at < b.created_at ? 1 : -1,
        ),
      );
    };

    void refreshProducts();
    const onProductsUpdated = () => {
      void refreshProducts();
    };
    window.addEventListener(PRODUCTS_UPDATED_EVENT, onProductsUpdated);
    window.addEventListener("storage", onProductsUpdated);

    return () => {
      window.removeEventListener(PRODUCTS_UPDATED_EVENT, onProductsUpdated);
      window.removeEventListener("storage", onProductsUpdated);
    };
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (categoryFilter === "todos") return true;
      return resolveProductCategory(product) === categoryFilter;
    });
  }, [products, categoryFilter]);

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedId) ?? null,
    [products, selectedId],
  );

  useEffect(() => {
    if (selectedId && !filteredProducts.some((p) => p.id === selectedId)) {
      setSelectedId(null);
    }
  }, [filteredProducts, selectedId]);

  const closePanel = useCallback(() => setSelectedId(null), []);

  const toggleChecked = useCallback((id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleCheckAllFiltered = useCallback(() => {
    const ids = filteredProducts.map((p) => p.id);
    setCheckedIds((prev) => {
      const allOn = ids.length > 0 && ids.every((id) => prev.has(id));
      if (allOn) return new Set();
      return new Set(ids);
    });
  }, [filteredProducts]);

  const openDeleteOne = useCallback((p: ProductRow, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (deleteBusy) return;
    setDeleteDialog({ mode: "one", product: p });
  }, [deleteBusy]);

  const openDeleteBulk = useCallback(() => {
    if (deleteBusy || checkedIds.size === 0) return;
    setDeleteDialog({ mode: "bulk" });
  }, [deleteBusy, checkedIds.size]);

  const allFilteredChecked =
    filteredProducts.length > 0 && filteredProducts.every((p) => checkedIds.has(p.id));

  useEffect(() => {
    if (!selectedId) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closePanel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, closePanel]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-stone-900">Produtos</h1>
        <div className="flex flex-wrap items-center gap-2">
          {checkedIds.size > 0 ? (
            <button
              type="button"
              disabled={deleteBusy}
              onClick={openDeleteBulk}
              title={`Excluir ${checkedIds.size} produto(s) selecionado(s)`}
              aria-label={`Excluir ${checkedIds.size} produto(s) selecionado(s)`}
              className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-800 hover:bg-red-100 disabled:opacity-60"
            >
              <IconTrash className="h-5 w-5 shrink-0" />
              <span className="tabular-nums">{checkedIds.size}</span>
            </button>
          ) : null}
          <Link
            href="/admin/produtos/novo"
            className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
          >
            Novo produto
          </Link>
        </div>
      </div>

      <div className="mt-6 max-w-md rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
        <label className="text-sm font-medium text-stone-700">
          Tipo de calçado
          <select
            className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm shadow-sm outline-none ring-violet-200 transition focus:ring"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as CategoryFilter)}
          >
            <option value="todos">Todos</option>
            {PRODUCT_CATEGORY_ORDER.map((key) => (
              <option key={key} value={key}>
                {PRODUCT_CATEGORY_LABELS[key]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {!products.length ? (
        <p className="mt-8 text-stone-600">Nenhum produto cadastrado.</p>
      ) : !filteredProducts.length ? (
        <p className="mt-8 text-stone-600">
          Nenhum produto neste tipo de calçado.
        </p>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-xl border border-stone-200 bg-white">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="border-b border-stone-200 bg-stone-50">
              <tr>
                <th className="w-10 px-2 py-3">
                  <input
                    type="checkbox"
                    checked={allFilteredChecked}
                    onChange={toggleCheckAllFiltered}
                    disabled={deleteBusy || filteredProducts.length === 0}
                    className="h-4 w-4 rounded border-stone-300"
                    title="Selecionar todos desta lista"
                    aria-label="Selecionar todos desta lista"
                  />
                </th>
                <th className="w-14 px-2 py-3 text-center font-medium text-stone-700">N.º</th>
                <th className="px-4 py-3 font-medium text-stone-700">Código</th>
                <th className="px-4 py-3 font-medium text-stone-700">Nome</th>
                <th className="px-4 py-3 font-medium text-stone-700">Tipo</th>
                <th className="px-4 py-3 font-medium text-stone-700">Preço</th>
                <th className="px-4 py-3 font-medium text-stone-700">Estoque</th>
                <th className="px-4 py-3 font-medium text-stone-700">Ativo</th>
                <th className="w-24 px-2 py-3 text-center font-medium text-stone-700">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p, rowIndex) => {
                const cat = resolveProductCategory(p);
                const isSelected = p.id === selectedId;
                const numWidth = Math.max(2, String(filteredProducts.length).length);
                const rowNum = String(rowIndex + 1).padStart(numWidth, "0");
                return (
                  <tr
                    key={p.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedId(p.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedId(p.id);
                      }
                    }}
                    className={`cursor-pointer border-b border-stone-100 transition last:border-0 ${
                      isSelected
                        ? "bg-violet-50 ring-1 ring-inset ring-violet-200"
                        : "hover:bg-stone-50"
                    }`}
                  >
                    <td
                      className="px-2 py-3"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={checkedIds.has(p.id)}
                        onChange={() => toggleChecked(p.id)}
                        disabled={deleteBusy}
                        className="h-4 w-4 rounded border-stone-300"
                        aria-label={`Selecionar ${p.name}`}
                      />
                    </td>
                    <td
                      className="px-2 py-3 text-center font-medium tabular-nums text-stone-800"
                      title={`Ordem na lista (id: ${p.id})`}
                    >
                      {rowNum}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-stone-700">
                      {p.code?.trim() ? p.code : "—"}
                    </td>
                    <td className="px-4 py-3 font-medium text-stone-900">{p.name}</td>
                    <td className="px-4 py-3 text-stone-600">
                      {PRODUCT_CATEGORY_LABELS[cat]}
                    </td>
                    <td className="px-4 py-3">{formatBRL(p.price_cents)}</td>
                    <td className="px-4 py-3">{p.stock}</td>
                    <td className="px-4 py-3">{p.active ? "Sim" : "Não"}</td>
                    <td
                      className="px-2 py-3"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          disabled={deleteBusy}
                          onClick={(e) => openDeleteOne(p, e)}
                          title={`Excluir ${p.name}`}
                          aria-label={`Excluir ${p.name}`}
                          className="rounded-lg p-2 text-red-600 transition hover:bg-red-50 disabled:opacity-40"
                        >
                          <IconTrash className="h-5 w-5" />
                        </button>
                        <Link
                          href={`/admin/produtos/${p.id}`}
                          title="Editar produto"
                          aria-label={`Editar ${p.name}`}
                          className="rounded-lg p-2 text-violet-600 transition hover:bg-violet-50"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <IconPencil className="h-5 w-5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Painel lateral — pré-visualização */}
      {selectedProduct ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[60] bg-black/25 backdrop-blur-[1px] lg:bg-black/20"
            aria-label="Fechar painel"
            onClick={closePanel}
          />
          <aside
            className="fixed inset-y-0 right-0 z-[70] flex w-full max-w-md flex-col border-l border-stone-200 bg-white shadow-2xl"
            aria-label="Detalhes do produto"
          >
            <div className="flex items-start justify-between gap-3 border-b border-stone-100 px-4 py-4">
              <h2 className="text-lg font-semibold leading-tight text-stone-900">
                Pré-visualização
              </h2>
              <button
                type="button"
                onClick={closePanel}
                className="rounded-lg p-1.5 text-stone-500 transition hover:bg-stone-100 hover:text-stone-800"
                aria-label="Fechar"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4">
              <div className="relative mt-4 aspect-[4/3] w-full overflow-hidden rounded-2xl bg-stone-100 p-3 ring-1 ring-stone-200">
                <Image
                  src={getDisplayImage(selectedProduct)}
                  alt={selectedProduct.name}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 448px"
                  unoptimized={
                    Boolean(selectedProduct.image_url?.startsWith("data:"))
                  }
                />
              </div>

              <div className="mt-4 space-y-3 pb-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
                    Nome
                  </p>
                  <p className="mt-0.5 font-semibold text-stone-900">
                    {selectedProduct.name}
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
                      Código
                    </p>
                    <p className="mt-0.5 font-mono text-sm text-stone-800">
                      {selectedProduct.code?.trim() || "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
                      Tipo
                    </p>
                    <p className="mt-0.5 text-sm text-stone-800">
                      {PRODUCT_CATEGORY_LABELS[resolveProductCategory(selectedProduct)]}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
                      Preço
                    </p>
                    <p className="mt-0.5 font-semibold text-violet-700">
                      {formatBRL(selectedProduct.price_cents)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
                      Estoque
                    </p>
                    <p className="mt-0.5 text-sm text-stone-800">{selectedProduct.stock}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
                      Ativo na loja
                    </p>
                    <p className="mt-0.5 text-sm text-stone-800">
                      {selectedProduct.active ? "Sim" : "Não"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
                      Slug
                    </p>
                    <p className="mt-0.5 break-all font-mono text-xs text-stone-700">
                      {selectedProduct.slug}
                    </p>
                  </div>
                </div>
                {selectedProduct.description?.trim() ? (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
                      Descrição
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-stone-800">
                      {selectedProduct.description}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="border-t border-stone-100 p-4">
              <Link
                href={`/admin/produtos/${selectedProduct.id}`}
                className="block w-full rounded-xl bg-violet-600 py-2.5 text-center text-sm font-medium text-white transition hover:bg-violet-700"
                onClick={closePanel}
              >
                Abrir para editar
              </Link>
            </div>
          </aside>
        </>
      ) : null}

      {deleteDialog ? (
        <ConfirmModal
          key={deleteDialog.mode === "one" ? deleteDialog.product.id : "bulk"}
          open
          title={
            deleteDialog.mode === "one" ? "Excluir produto?" : "Excluir produtos em lote?"
          }
          description={
            deleteDialog.mode === "one"
              ? `O produto «${deleteDialog.product.name}» será removido permanentemente da loja.\n\nEsta ação não pode ser anulada.`
              : `${checkedIds.size} produto(s) selecionado(s) serão removidos permanentemente da loja.\n\nEsta ação não pode ser anulada.`
          }
          confirmText="Excluir"
          cancelText="Cancelar"
          confirmVariant="danger"
          busy={deleteBusy}
          onCancel={() => {
            if (!deleteBusy) setDeleteDialog(null);
          }}
          onConfirm={async () => {
            if (!deleteDialog) return;
            setDeleteBusy(true);
            try {
              if (deleteDialog.mode === "one") {
                const res = await deleteLocalProduct(deleteDialog.product.id);
                if (!res.ok) {
                  systemAlert(res.error);
                  setDeleteDialog(null);
                  return;
                }
                const removedId = deleteDialog.product.id;
                setCheckedIds((prev) => {
                  const next = new Set(prev);
                  next.delete(removedId);
                  return next;
                });
                setSelectedId((cur) => (cur === removedId ? null : cur));
                setDeleteDialog(null);
              } else {
                const ids = [...checkedIds];
                for (const id of ids) {
                  const res = await deleteLocalProduct(id);
                  if (!res.ok) {
                    systemAlert(res.error);
                    break;
                  }
                }
                setCheckedIds(new Set());
                setSelectedId(null);
                setDeleteDialog(null);
              }
            } finally {
              setDeleteBusy(false);
            }
          }}
        />
      ) : null}
    </div>
  );
}
