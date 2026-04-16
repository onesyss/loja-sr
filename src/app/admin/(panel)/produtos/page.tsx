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
import { getDisplayImage } from "@/lib/product-images";
import {
  getLocalProducts,
  PRODUCTS_UPDATED_EVENT,
} from "@/lib/local-products";
import type { ProductCategory, ProductRow } from "@/types/database";

type CategoryFilter = "todos" | ProductCategory;

export default function AdminProdutosPage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("todos");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const refreshProducts = () => {
      setProducts(
        [...getLocalProducts()].sort((a, b) =>
          a.created_at < b.created_at ? 1 : -1,
        ),
      );
    };

    refreshProducts();
    window.addEventListener(PRODUCTS_UPDATED_EVENT, refreshProducts);
    window.addEventListener("storage", refreshProducts);

    return () => {
      window.removeEventListener(PRODUCTS_UPDATED_EVENT, refreshProducts);
      window.removeEventListener("storage", refreshProducts);
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
        <Link
          href="/admin/produtos/novo"
          className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
        >
          Novo produto
        </Link>
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
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-stone-200 bg-stone-50">
              <tr>
                <th className="px-4 py-3 font-medium text-stone-700">Código</th>
                <th className="px-4 py-3 font-medium text-stone-700">Nome</th>
                <th className="px-4 py-3 font-medium text-stone-700">Tipo</th>
                <th className="px-4 py-3 font-medium text-stone-700">Preço</th>
                <th className="px-4 py-3 font-medium text-stone-700">Estoque</th>
                <th className="px-4 py-3 font-medium text-stone-700">Ativo</th>
                <th className="px-4 py-3 font-medium text-stone-700" />
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => {
                const cat = resolveProductCategory(p);
                const isSelected = p.id === selectedId;
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
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/produtos/${p.id}`}
                        className="font-medium text-violet-600 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Editar
                      </Link>
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
              <div className="relative mt-4 aspect-[4/3] w-full overflow-hidden rounded-2xl bg-stone-100 ring-1 ring-stone-200">
                <Image
                  src={getDisplayImage(selectedProduct)}
                  alt={selectedProduct.name}
                  fill
                  className="object-cover"
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
    </div>
  );
}
