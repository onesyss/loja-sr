"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/cart-context";
import { formatBRL } from "@/lib/money";

export default function CarrinhoPage() {
  const { lines, setQuantity, remove, totalCents, itemCount } = useCart();

  if (lines.length === 0) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-16">
        <h1 className="text-2xl font-bold text-stone-900">Carrinho</h1>
        <p className="mt-4 text-stone-600">Seu carrinho está vazio.</p>
        <Link
          href="/"
          className="mt-6 inline-block font-medium text-violet-600 hover:underline"
        >
          Continuar comprando
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-bold text-stone-900">Carrinho</h1>
      <p className="mt-1 text-sm text-stone-500">
        {itemCount} {itemCount === 1 ? "item" : "itens"}
      </p>
      <ul className="mt-8 divide-y divide-stone-200 border-y border-stone-200">
        {lines.map(({ product, quantity }) => (
          <li
            key={product.id}
            className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center"
          >
            <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-lg bg-stone-100">
              {product.image_url ? (
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="128px"
                />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <Link
                href={`/produtos/${product.slug}`}
                className="font-semibold text-stone-900 hover:text-violet-600"
              >
                {product.name}
              </Link>
              <p className="text-sm text-stone-600">
                {formatBRL(product.price_cents)} cada
              </p>
            </div>
            <div className="flex items-center gap-3">
              <label className="sr-only" htmlFor={`q-${product.id}`}>
                Quantidade
              </label>
              <input
                id={`q-${product.id}`}
                type="number"
                min={1}
                max={product.stock}
                value={quantity}
                onChange={(e) =>
                  setQuantity(product.id, Number.parseInt(e.target.value, 10) || 1)
                }
                className="w-20 rounded-lg border border-stone-300 px-2 py-1.5 text-center text-sm"
              />
              <button
                type="button"
                onClick={() => remove(product.id)}
                className="text-sm text-red-700 hover:underline"
              >
                Remover
              </button>
            </div>
            <p className="font-semibold text-stone-900 sm:w-28 sm:text-right">
              {formatBRL(product.price_cents * quantity)}
            </p>
          </li>
        ))}
      </ul>
      <div className="mt-8 flex flex-col items-end gap-4">
        <p className="text-lg">
          Total:{" "}
          <span className="font-bold text-violet-600">{formatBRL(totalCents)}</span>
        </p>
        <Link
          href="/checkout"
          className="inline-flex rounded-xl bg-violet-600 px-6 py-3 font-medium text-white hover:bg-violet-700"
        >
          Ir para o checkout
        </Link>
      </div>
    </main>
  );
}
