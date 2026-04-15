"use client";

import { useMemo } from "react";
import { useEffect, useState } from "react";
import { ProductCard } from "@/components/ProductCard";
import {
  getLocalProducts,
  PRODUCTS_UPDATED_EVENT,
} from "@/lib/local-products";
import type {
  ProductAudience,
  ProductRow,
  ProductStyle,
} from "@/types/database";

type AudienceFilter = "todos" | "masculino" | "feminino" | "infantil";
type StyleFilter = "todos" | "casual" | "esportivo" | "promocao";
const PAGE_SIZE = 12;

function classifyProduct(product: ProductRow) {
  const text = `${product.name} ${product.description ?? ""}`.toLowerCase();

  const inferredAudience: ProductAudience = /infan|kids|juvenil/.test(
    text,
  )
    ? "infantil"
    : /femin|sand[áa]lia|salto/.test(text)
      ? "feminino"
      : "masculino";

  const inferredStyle: ProductStyle =
    /promo|oferta|desconto/.test(text) || product.price_cents <= 12000
      ? "promocao"
      : /esport|t[êe]nis|corrida|treino/.test(text)
        ? "esportivo"
        : "casual";

  const audience: Exclude<AudienceFilter, "todos"> =
    product.audience ?? inferredAudience;
  const style: Exclude<StyleFilter, "todos"> = product.style ?? inferredStyle;

  return { audience, style };
}

export default function HomePage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [audienceFilter, setAudienceFilter] = useState<AudienceFilter>("todos");
  const [styleFilter, setStyleFilter] = useState<StyleFilter>("todos");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    const refreshProducts = () => {
      setProducts(getLocalProducts().filter((product) => product.active));
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
      const classification = classifyProduct(product);
      const audienceMatch =
        audienceFilter === "todos" || classification.audience === audienceFilter;
      const styleMatch =
        styleFilter === "todos" || classification.style === styleFilter;
      return audienceMatch && styleMatch;
    });
  }, [products, audienceFilter, styleFilter]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [audienceFilter, styleFilter, products.length]);

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
            Estilo, conforto e variedade para todos os passos
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-violet-50 sm:text-base">
            Escolha entre modelos casuais e esportivos, femininos e masculinos.
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
      <div className="mb-6 grid gap-3 rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur-sm sm:grid-cols-2">
        <label className="text-sm font-medium text-stone-700">
          Público
          <select
            className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm shadow-sm outline-none ring-violet-200 transition focus:ring"
            value={audienceFilter}
            onChange={(e) => setAudienceFilter(e.target.value as AudienceFilter)}
          >
            <option value="todos">Todos</option>
            <option value="masculino">Masculino</option>
            <option value="feminino">Feminino</option>
            <option value="infantil">Infantis</option>
          </select>
        </label>
        <label className="text-sm font-medium text-stone-700">
          Estilo
          <select
            className="mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm shadow-sm outline-none ring-violet-200 transition focus:ring"
            value={styleFilter}
            onChange={(e) => setStyleFilter(e.target.value as StyleFilter)}
          >
            <option value="todos">Todos</option>
            <option value="casual">Casual</option>
            <option value="esportivo">Esportivo</option>
            <option value="promocao">Em promoção</option>
          </select>
        </label>
      </div>
      {!filteredProducts.length ? (
        <p className="text-stone-500">Nenhum produto cadastrado ainda.</p>
      ) : (
        <>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {visibleProducts.map((p) => {
            const classification = classifyProduct(p);
            return (
            <li key={p.id}>
              <ProductCard
                product={p}
                badges={[classification.audience, classification.style]}
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
