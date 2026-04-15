"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { slugify } from "@/lib/slug";
import type { ProductRow } from "@/types/database";

type Props = {
  initial?: ProductRow | null;
};

export function ProductForm({ initial }: Props) {
  const router = useRouter();
  const editing = Boolean(initial);
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(initial));
  const [description, setDescription] = useState(initial?.description ?? "");
  const [priceReais, setPriceReais] = useState(
    initial ? String(initial.price_cents / 100) : "",
  );
  const [stock, setStock] = useState(String(initial?.stock ?? 0));
  const [active, setActive] = useState(initial?.active ?? true);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function onNameChange(v: string) {
    setName(v);
    if (!slugTouched && !editing) {
      setSlug(slugify(v));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const priceNum = Number.parseFloat(priceReais);
    if (Number.isNaN(priceNum) || priceNum < 0) {
      setError("Preço inválido.");
      setLoading(false);
      return;
    }
    const price_cents = Math.round(priceNum * 100);
    const stockNum = Number.parseInt(stock, 10);
    if (Number.isNaN(stockNum) || stockNum < 0) {
      setError("Estoque inválido.");
      setLoading(false);
      return;
    }

    void file;
    void active;
    void price_cents;
    void stockNum;
    router.push("/admin/produtos");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
      <div>
        <label className="block text-sm font-medium text-stone-700" htmlFor="name">
          Nome
        </label>
        <input
          id="name"
          required
          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-stone-700" htmlFor="slug">
          Slug (URL)
        </label>
        <input
          id="slug"
          required
          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 font-mono text-sm"
          value={slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(e.target.value);
          }}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-stone-700" htmlFor="description">
          Descrição
        </label>
        <textarea
          id="description"
          rows={4}
          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-stone-700" htmlFor="price">
            Preço (R$)
          </label>
          <input
            id="price"
            type="number"
            min={0}
            step={0.01}
            required
            placeholder="99.90"
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
            value={priceReais}
            onChange={(e) => setPriceReais(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700" htmlFor="stock">
            Estoque
          </label>
          <input
            id="stock"
            type="number"
            min={0}
            required
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          id="active"
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
        />
        <label htmlFor="active" className="text-sm text-stone-700">
          Ativo na loja
        </label>
      </div>
      <div>
        <label className="block text-sm font-medium text-stone-700" htmlFor="image">
          Imagem {editing ? "(opcional — substitui a atual)" : ""}
        </label>
        <input
          id="image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="mt-1 w-full text-sm"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </div>
      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-violet-600 px-6 py-2.5 font-medium text-white hover:bg-violet-700 disabled:opacity-60"
      >
        {loading ? "Salvando…" : editing ? "Salvar alterações" : "Cadastrar produto"}
      </button>
    </form>
  );
}
