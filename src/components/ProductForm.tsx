"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { upsertLocalProduct } from "@/lib/local-products";
import { slugify } from "@/lib/slug";
import {
  PRODUCT_CATEGORY_LABELS,
  PRODUCT_CATEGORY_ORDER,
  audienceFromProductName,
  inferProductCategoryFromText,
  styleFromCategory,
} from "@/lib/product-category";
import {
  PRODUCT_IMAGE_MAX_BYTES,
  PRODUCT_IMAGE_MAX_MB,
} from "@/lib/product-image-upload";
import type { ProductCategory, ProductRow } from "@/types/database";

type Props = {
  initial?: ProductRow | null;
};

export function ProductForm({ initial }: Props) {
  const router = useRouter();
  const editing = Boolean(initial);
  const [code, setCode] = useState(initial?.code ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(initial));
  const [description, setDescription] = useState(initial?.description ?? "");
  const [category, setCategory] = useState<ProductCategory>(
    () =>
      initial?.category ??
      inferProductCategoryFromText(
        `${initial?.name ?? ""} ${initial?.description ?? ""}`,
      ),
  );
  const [availableSizes, setAvailableSizes] = useState(
    initial?.available_sizes?.join(", ") ?? "",
  );
  const [availableColors, setAvailableColors] = useState(
    initial?.available_colors?.join(", ") ?? "",
  );
  const [extraImageUrls, setExtraImageUrls] = useState(
    initial?.extra_image_urls?.join(", ") ?? "",
  );
  const [discountPercent, setDiscountPercent] = useState(
    String(initial?.discount_percent ?? 6),
  );
  const [maxInstallments, setMaxInstallments] = useState(
    String(initial?.max_installments ?? 5),
  );
  const [priceReais, setPriceReais] = useState(
    initial ? String(initial.price_cents / 100) : "",
  );
  const [stock, setStock] = useState(String(initial?.stock ?? 0));
  const [active, setActive] = useState(initial?.active ?? true);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

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
    const discountNum = Number.parseFloat(discountPercent);
    if (Number.isNaN(discountNum) || discountNum < 0 || discountNum > 90) {
      setError("Desconto inválido. Use um valor entre 0 e 90.");
      setLoading(false);
      return;
    }
    const installmentsNum = Number.parseInt(maxInstallments, 10);
    if (Number.isNaN(installmentsNum) || installmentsNum < 1 || installmentsNum > 5) {
      setError("Parcelamento inválido. Use de 1 a 5.");
      setLoading(false);
      return;
    }
    const parsedSizes = availableSizes
      .split(",")
      .map((value) => Number.parseInt(value.trim(), 10))
      .filter((value) => Number.isFinite(value) && value > 0);
    const parsedColors = availableColors
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
    const parsedExtraImages = extraImageUrls
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    if (availableSizes.trim() && parsedSizes.length === 0) {
      setError("Numerações inválidas. Use números separados por vírgula.");
      setLoading(false);
      return;
    }

    let image_url = initial?.image_url ?? null;

    if (file) {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload/product-image", {
        method: "POST",
        body: fd,
        credentials: "same-origin",
      });
      const json: { url?: string; error?: string } = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          typeof json.error === "string" ? json.error : "Falha ao enviar imagem.",
        );
        setLoading(false);
        return;
      }
      if (!json.url) {
        setError("Resposta inválida do servidor.");
        setLoading(false);
        return;
      }
      image_url = json.url;
    }

    const cleanSlug = slug.trim() || slugify(name);
    const trimmedName = name.trim();
    const audience = audienceFromProductName(trimmedName);
    const style = styleFromCategory(category);
    const saved = await upsertLocalProduct(
      {
        code: code.trim() || null,
        name: trimmedName,
        slug: cleanSlug,
        description: description.trim() || null,
        category,
        audience,
        style,
        price_cents,
        discount_percent: discountNum,
        max_installments: installmentsNum,
        stock: stockNum,
        available_sizes: parsedSizes.length > 0 ? parsedSizes : null,
        available_colors: parsedColors.length > 0 ? parsedColors : null,
        extra_image_urls: parsedExtraImages.length > 0 ? parsedExtraImages : null,
        active,
        image_url,
      },
      initial?.id,
    );

    if (!saved.ok) {
      setError(saved.error);
      setLoading(false);
      return;
    }

    setLoading(false);
    router.push("/admin/produtos");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
      <div>
        <label className="block text-sm font-medium text-stone-700" htmlFor="code">
          Código do produto
        </label>
        <input
          id="code"
          placeholder="Ex.: SR-001"
          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
      </div>
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
      <div>
        <label className="block text-sm font-medium text-stone-700" htmlFor="category">
          Tipo de calçado (vitrine)
        </label>
        <select
          id="category"
          className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
          value={category}
          onChange={(e) => setCategory(e.target.value as ProductCategory)}
        >
          {PRODUCT_CATEGORY_ORDER.map((key) => (
            <option key={key} value={key}>
              {PRODUCT_CATEGORY_LABELS[key]}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            className="block text-sm font-medium text-stone-700"
            htmlFor="available_sizes"
          >
            Numerações disponíveis
          </label>
          <input
            id="available_sizes"
            placeholder="34, 35, 36, 37"
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
            value={availableSizes}
            onChange={(e) => setAvailableSizes(e.target.value)}
          />
          <p className="mt-1 text-xs text-stone-500">
            Separe por vírgula. Ex.: 37, 38, 39
          </p>
        </div>
        <div>
          <label
            className="block text-sm font-medium text-stone-700"
            htmlFor="available_colors"
          >
            Cores disponíveis
          </label>
          <input
            id="available_colors"
            placeholder="Preto, Branco, Azul"
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
            value={availableColors}
            onChange={(e) => setAvailableColors(e.target.value)}
          />
          <p className="mt-1 text-xs text-stone-500">
            Separe por vírgula. Ex.: Preto, Bege
          </p>
        </div>
      </div>
      <div className="rounded-xl border border-stone-200 bg-stone-50/60 p-4">
        <p className="text-sm font-semibold text-stone-900">Imagens do produto</p>

        <div className="mt-4">
          <span className="block text-sm font-medium text-stone-700">Foto principal</span>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <label className="inline-flex cursor-pointer items-center rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-violet-700">
              Escolher imagem
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(e) => {
                  const selected = e.target.files?.[0] ?? null;
                  if (selected && selected.size > PRODUCT_IMAGE_MAX_BYTES) {
                    setError(
                      `Arquivo acima de ${PRODUCT_IMAGE_MAX_MB} MB. Escolha uma imagem menor.`,
                    );
                    setFile(null);
                    e.target.value = "";
                    return;
                  }
                  setError(null);
                  setFile(selected);
                }}
              />
            </label>
            <span className="text-sm text-stone-600">
              {file
                ? file.name
                : editing && initial?.image_url
                  ? "Imagem atual será mantida (ou escolha outra)"
                  : "Opcional no cadastro"}
            </span>
          </div>
          <p className="mt-2 text-xs text-stone-500">
            Até {PRODUCT_IMAGE_MAX_MB} MB · JPEG, PNG ou WebP
          </p>
          {(previewUrl || (editing && initial?.image_url && !file)) ? (
            <div className="mt-3 flex">
              <div className="relative h-28 w-36 overflow-hidden rounded-lg border border-stone-200 bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl ?? initial?.image_url ?? ""}
                  alt=""
                  className="h-full w-full object-contain p-1"
                />
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-6 border-t border-stone-200 pt-4">
          <label
            className="block text-sm font-medium text-stone-700"
            htmlFor="extra_image_urls"
          >
            Outras fotos (links)
          </label>
          <input
            id="extra_image_urls"
            placeholder="https://..., https://..."
            className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-3 py-2"
            value={extraImageUrls}
            onChange={(e) => setExtraImageUrls(e.target.value)}
          />
          <p className="mt-1 text-xs text-stone-500">
            Até 2 URLs separadas por vírgula — galeria na página do produto.
          </p>
        </div>
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
          <label className="block text-sm font-medium text-stone-700" htmlFor="discount_percent">
            Desconto no Pix (%)
          </label>
          <input
            id="discount_percent"
            type="number"
            min={0}
            max={90}
            step={0.1}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
            value={discountPercent}
            onChange={(e) => setDiscountPercent(e.target.value)}
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
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
        <div>
          <label className="block text-sm font-medium text-stone-700" htmlFor="max_installments">
            Parcelamento no cartão (1 a 5x)
          </label>
          <input
            id="max_installments"
            type="number"
            min={1}
            max={5}
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
            value={maxInstallments}
            onChange={(e) => setMaxInstallments(e.target.value)}
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
