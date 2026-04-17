"use client";

import { useMemo } from "react";
import { useEffect, useState } from "react";
import { ProductCard } from "@/components/ProductCard";
import {
  getLocalProducts,
  PRODUCTS_UPDATED_EVENT,
} from "@/lib/local-products";
import {
  PRODUCT_CATEGORY_LABELS,
  PRODUCT_CATEGORY_ORDER,
  resolveProductCategory,
} from "@/lib/product-category";
import { isHiddenFromStorefront } from "@/lib/storefront-exclude";
import type { ProductCategory, ProductRow } from "@/types/database";

type CategoryFilter = "todos" | ProductCategory;
const PAGE_SIZE = 12;

export default function HomePage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("todos");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    const refreshProducts = async () => {
      const all = await getLocalProducts();
      setProducts(
        all.filter((product) => product.active && !isHiddenFromStorefront(product)),
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

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [categoryFilter, products.length]);

  const visibleProducts = useMemo(
    () => filteredProducts.slice(0, visibleCount),
    [filteredProducts, visibleCount],
  );

  useEffect(() => {
    if (visibleCount >= filteredProducts.length) return;

    const target = document.getElementById("products-load-more-trigger");
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filteredProducts.length));
        }
      },
      { rootMargin: "160px" },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [visibleCount, filteredProducts.length]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <section
        className="mb-8 overflow-hidden rounded-3xl border border-white/70 bg-cover bg-center shadow-[0_20px_60px_-35px_rgba(76,29,149,0.6)]"
        style={{
          backgroundImage:
            "linear-gradient(90deg, rgba(76,29,149,.85), rgba(124,58,237,.55)), url('https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=1400&q=80')",
        }}
      >
        <div className="px-6 py-12 text-white sm:px-10">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-100">
            Nova coleção
          </p>
          <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
            Estilo, conforto e variedade para seus passos
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-violet-50 sm:text-base">
            Modelos casuais e esportivos para o público feminino e infantil.
          </p>
        </div>
      </section>
      <div className="mb-8 rounded-2xl border border-white/70 bg-white/80 p-5 shadow-sm backdrop-blur-sm">
        <p className="text-sm font-semibold uppercase tracking-wider text-violet-600">
          Moda a seus pés
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-stone-900">
          SR CALÇADOS
        </h1>
        <p className="mt-2 max-w-xl text-stone-600">
          Explore a vitrine, monte seu carrinho e nos envie sua compra. É muito rápido!
        </p>
      </div>
      <div className="mb-6 rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur-sm">
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
      {!filteredProducts.length ? (
        <p className="text-stone-500">Nenhum produto cadastrado ainda.</p>
      ) : (
        <>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {visibleProducts.map((p) => {
            const cat = resolveProductCategory(p);
            return (
            <li key={p.id}>
              <ProductCard
                product={p}
                badges={[PRODUCT_CATEGORY_LABELS[cat]]}
              />
            </li>
            );
          })}
        </ul>
        {visibleCount < filteredProducts.length ? (
          <div
            id="products-load-more-trigger"
            className="mt-6 text-center text-sm text-stone-500"
          >
            Carregando mais produtos...
          </div>
        ) : null}
        </>
      )}
    </main>
  );
}
