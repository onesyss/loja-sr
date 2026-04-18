"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { upsertLocalProduct } from "@/lib/local-products";
import {
  getProductUploadedImageUrls,
  normalizeColorLinkedImages,
} from "@/lib/product-images";
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
import type { ColorLinkedImageEntry, ProductCategory, ProductRow } from "@/types/database";

const MAX_GALLERY = 5;
const MAX_COLORS = 5;

function newRowKey() {
  return globalThis.crypto?.randomUUID?.() ?? `r-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function unionColorsFromLinked(p: ProductRow | null | undefined): string[] {
  if (!p) return [];
  const linked = normalizeColorLinkedImages(p.color_linked_images);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const e of linked) {
    for (const c of e.colors) {
      const t = c.trim();
      if (!t) continue;
      const k = t.toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(t);
      if (out.length >= MAX_COLORS) return out;
    }
  }
  return out;
}

type PaletteEntry = { id: string; name: string };

function initialPaletteEntries(p: ProductRow | null | undefined): PaletteEntry[] {
  if (!p) return [];
  const db = (p.available_colors ?? []).map((c) => c.trim()).filter(Boolean);
  const names =
    db.length > 0 ? db.slice(0, MAX_COLORS) : unionColorsFromLinked(p);
  return names.map((name) => ({ id: newRowKey(), name }));
}

function reorderList<T>(list: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) {
    return list;
  }
  const next = [...list];
  const [removed] = next.splice(from, 1);
  next.splice(to, 0, removed);
  return next;
}

type GalleryRow = {
  key: string;
  url: string;
  file: File | null;
  colors: string[];
};

function rowsFromProduct(p: ProductRow | null | undefined): GalleryRow[] {
  if (!p) return [];
  const linked = normalizeColorLinkedImages(p.color_linked_images);
  if (linked.length > 0) {
    return linked.map((e, i) => ({
      key: `k-${i}-${e.url.slice(-12)}`,
      url: e.url,
      file: null,
      colors: [...e.colors],
    }));
  }
  const legacy = getProductUploadedImageUrls(p);
  return legacy.map((u, i) => ({
    key: `leg-${i}-${u.slice(-8)}`,
    url: u,
    file: null,
    colors: [] as string[],
  }));
}

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
  const [paletteEntries, setPaletteEntries] = useState<PaletteEntry[]>(() =>
    initialPaletteEntries(initial),
  );
  const [galleryRows, setGalleryRows] = useState<GalleryRow[]>(() => rowsFromProduct(initial));
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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setGalleryRows(rowsFromProduct(initial));
    setPaletteEntries(initialPaletteEntries(initial));
  }, [initial?.id]);

  const colorOptions = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const e of paletteEntries) {
      const t = e.name.trim();
      if (!t) continue;
      const k = t.toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(t);
    }
    return out;
  }, [paletteEntries]);

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
    const parsedColors: string[] = [];
    {
      const seen = new Set<string>();
      for (const e of paletteEntries) {
        const t = e.name.trim();
        if (!t) continue;
        const k = t.toLowerCase();
        if (seen.has(k)) continue;
        seen.add(k);
        parsedColors.push(t);
        if (parsedColors.length >= MAX_COLORS) break;
      }
    }
    const allowedColor = new Set(parsedColors.map((c) => c.toLowerCase()));

    if (availableSizes.trim() && parsedSizes.length === 0) {
      setError("Numerações inválidas. Use números separados por vírgula.");
      setLoading(false);
      return;
    }

    const usedRows = galleryRows.filter((r) => r.url.trim() || r.file);
    if (usedRows.length > MAX_GALLERY) {
      setError(`Máximo ${MAX_GALLERY} fotos.`);
      setLoading(false);
      return;
    }

    const hasTaggedRows = usedRows.some((r) => r.colors.length > 0);
    if (hasTaggedRows && parsedColors.length === 0) {
      setError(
        `Adicione até ${MAX_COLORS} nomes de cor (secção abaixo) ou marque só «Todas as cores» em cada foto.`,
      );
      setLoading(false);
      return;
    }

    async function uploadOne(file: File): Promise<string | null> {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload/product-image", {
        method: "POST",
        body: fd,
        credentials: "same-origin",
      });
      const json: { url?: string; error?: string } = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof json.error === "string" ? json.error : "Falha ao enviar imagem.");
        return null;
      }
      return json.url ?? null;
    }

    const built: ColorLinkedImageEntry[] = [];
    for (const row of usedRows.slice(0, MAX_GALLERY)) {
      let url = row.url.trim();
      if (row.file) {
        const u = await uploadOne(row.file);
        if (!u) {
          setLoading(false);
          return;
        }
        url = u;
      }
      if (!url) continue;
      const rowColors =
        row.colors.length === 0
          ? []
          : row.colors.filter((c) => allowedColor.has(c.trim().toLowerCase()));
      built.push({ url, colors: rowColors });
    }

    const image_url = built[0]?.url ?? null;
    const color_linked_images: ColorLinkedImageEntry[] = built;
    const extra_image_urls = null;

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
        extra_image_urls,
        color_linked_images,
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

  function addGalleryRow() {
    if (galleryRows.length >= MAX_GALLERY) return;
    setGalleryRows((rows) => [
      ...rows,
      { key: newRowKey(), url: "", file: null, colors: [] },
    ]);
  }

  function removeGalleryRow(key: string) {
    setGalleryRows((rows) => rows.filter((r) => r.key !== key));
  }

  function updateRow(key: string, patch: Partial<GalleryRow>) {
    setGalleryRows((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function toggleRowColor(rowKey: string, color: string) {
    setGalleryRows((rows) =>
      rows.map((r) => {
        if (r.key !== rowKey) return r;
        if (r.colors.length === 0) return { ...r, colors: [color] };
        const has = r.colors.some((c) => c.trim().toLowerCase() === color.trim().toLowerCase());
        const next = has
          ? r.colors.filter((c) => c.trim().toLowerCase() !== color.trim().toLowerCase())
          : [...r.colors, color];
        return { ...r, colors: next };
      }),
    );
  }

  function addPaletteColor() {
    if (paletteEntries.length >= MAX_COLORS) return;
    setPaletteEntries((p) => [...p, { id: newRowKey(), name: "" }]);
  }

  function removePaletteColor(id: string) {
    const entry = paletteEntries.find((e) => e.id === id);
    const removed = entry?.name.trim();
    setPaletteEntries((list) => list.filter((e) => e.id !== id));
    if (removed) {
      setGalleryRows((rows) =>
        rows.map((r) => ({
          ...r,
          colors: r.colors.filter((c) => c.trim().toLowerCase() !== removed.toLowerCase()),
        })),
      );
    }
  }

  function updatePaletteColor(id: string, value: string) {
    const entry = paletteEntries.find((e) => e.id === id);
    const oldTrim = entry?.name.trim() ?? "";
    const trimmed = value.trim();
    setPaletteEntries((list) =>
      list.map((e) => (e.id === id ? { ...e, name: value } : e)),
    );
    if (oldTrim && oldTrim.toLowerCase() !== trimmed.toLowerCase()) {
      const oldKey = oldTrim.toLowerCase();
      setGalleryRows((rows) =>
        rows.map((r) => ({
          ...r,
          colors: r.colors.map((c) =>
            c.trim().toLowerCase() === oldKey ? (trimmed || c) : c,
          ),
        })),
      );
    }
  }

  function onPaletteDragStart(e: React.DragEvent, index: number) {
    e.dataTransfer.setData("text/plain", `sr-palette:${index}`);
    e.dataTransfer.effectAllowed = "move";
  }

  function onPaletteDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function onPaletteDrop(e: React.DragEvent, toIndex: number) {
    e.preventDefault();
    const raw = e.dataTransfer.getData("text/plain");
    const m = /^sr-palette:(\d+)$/.exec(raw);
    const from = m ? Number.parseInt(m[1], 10) : NaN;
    if (Number.isNaN(from)) return;
    setPaletteEntries((list) => reorderList(list, from, toIndex));
  }

  function onGalleryDragStart(e: React.DragEvent, index: number) {
    e.dataTransfer.setData("text/plain", `sr-gallery:${index}`);
    e.dataTransfer.effectAllowed = "move";
  }

  function onGalleryDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  function onGalleryDrop(e: React.DragEvent, toIndex: number) {
    e.preventDefault();
    const raw = e.dataTransfer.getData("text/plain");
    const m = /^sr-gallery:(\d+)$/.exec(raw);
    const from = m ? Number.parseInt(m[1], 10) : NaN;
    if (Number.isNaN(from)) return;
    setGalleryRows((list) => reorderList(list, from, toIndex));
  }

  const filledCount = galleryRows.filter((r) => r.url.trim() || r.file).length;

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
          className="mt-1 w-full max-w-xl rounded-lg border border-stone-300 px-3 py-2"
          value={availableSizes}
          onChange={(e) => setAvailableSizes(e.target.value)}
        />
        <p className="mt-1 text-xs text-stone-500">Separe por vírgula. Ex.: 37, 38, 39</p>
      </div>
      <div className="rounded-xl border border-stone-200 bg-stone-50/60 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-stone-900">Cores do produto (até {MAX_COLORS})</p>
          <button
            type="button"
            onClick={addPaletteColor}
            disabled={paletteEntries.length >= MAX_COLORS}
            className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Adicionar cor ({paletteEntries.length}/{MAX_COLORS})
          </button>
        </div>
        <p className="mt-2 text-xs text-stone-500">
          Escolha os nomes que quiser (ex.: Vinho, Nude). Arraste pelo ícone à esquerda para mudar a
          ordem na loja. Depois associe cada foto às cores; no máximo {MAX_COLORS} cores.
        </p>
        {paletteEntries.length === 0 ? (
          <p className="mt-3 text-sm text-stone-500">Nenhuma cor — use só «Todas as cores» nas fotos.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {paletteEntries.map((entry, index) => (
              <li
                key={entry.id}
                onDragOver={onPaletteDragOver}
                onDrop={(e) => onPaletteDrop(e, index)}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-stone-100 bg-white/80 px-1 py-1"
              >
                <button
                  type="button"
                  draggable
                  onDragStart={(e) => onPaletteDragStart(e, index)}
                  className="cursor-grab touch-none rounded px-1.5 py-2 text-stone-400 hover:bg-stone-100 hover:text-stone-700 active:cursor-grabbing"
                  aria-label="Arrastar para reordenar cor"
                  title="Arrastar para reordenar"
                >
                  <span className="block select-none text-xs leading-none" aria-hidden>
                    ⋮⋮
                  </span>
                </button>
                <input
                  type="text"
                  placeholder="Nome da cor"
                  className="min-w-[10rem] flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm"
                  value={entry.name}
                  onChange={(e) => updatePaletteColor(entry.id, e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => removePaletteColor(entry.id)}
                  className="text-xs font-medium text-red-600 hover:underline"
                >
                  Remover
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="rounded-xl border border-stone-200 bg-stone-50/60 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-stone-900">Fotos do produto (até {MAX_GALLERY})</p>
          <button
            type="button"
            onClick={addGalleryRow}
            disabled={galleryRows.length >= MAX_GALLERY}
            className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            Adicionar foto ({filledCount}/{MAX_GALLERY})
          </button>
        </div>
        <p className="mt-2 text-xs text-stone-500">
          Envio por ficheiro apenas (JPEG/PNG/WebP, até {PRODUCT_IMAGE_MAX_MB} MB). Arraste pelo ícone
          ⋮⋮ para mudar a ordem das fotos na galeria. A 1.ª foto é a principal. Marque em que cores cada
          imagem aparece; sem marcação = todas as cores.
        </p>

        <div className="mt-4 space-y-4">
          {galleryRows.length === 0 ? (
            <p className="text-sm text-stone-500">Ainda sem fotos. Use &quot;Adicionar foto&quot;.</p>
          ) : null}
          {galleryRows.map((row, index) => (
            <div
              key={row.key}
              onDragOver={onGalleryDragOver}
              onDrop={(e) => onGalleryDrop(e, index)}
              className="rounded-lg border border-stone-200 bg-white p-3 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    draggable
                    onDragStart={(e) => onGalleryDragStart(e, index)}
                    className="cursor-grab touch-none rounded px-1.5 py-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700 active:cursor-grabbing"
                    aria-label="Arrastar para reordenar foto"
                    title="Arrastar para reordenar"
                  >
                    <span className="block select-none text-xs leading-none" aria-hidden>
                      ⋮⋮
                    </span>
                  </button>
                  <span className="text-xs font-medium text-stone-500">Foto {index + 1}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeGalleryRow(row.key)}
                  className="text-xs font-medium text-red-600 hover:underline"
                >
                  Remover
                </button>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <label className="inline-flex cursor-pointer items-center rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-medium text-violet-800 hover:bg-violet-100">
                  {row.url.trim() && !row.file ? "Substituir imagem" : "Escolher imagem"}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={(e) => {
                      const f = e.target.files?.[0] ?? null;
                      if (f && f.size > PRODUCT_IMAGE_MAX_BYTES) {
                        setError(
                          `Arquivo acima de ${PRODUCT_IMAGE_MAX_MB} MB. Escolha uma imagem menor.`,
                        );
                        e.target.value = "";
                        return;
                      }
                      setError(null);
                      updateRow(row.key, { file: f, url: f ? "" : row.url });
                      e.target.value = "";
                    }}
                  />
                </label>
                {row.url.trim() && !row.file ? (
                  <span className="text-xs text-stone-500">Imagem atual no servidor.</span>
                ) : null}
              </div>
              {row.file ? (
                <p className="mt-1 text-xs text-stone-600">Ficheiro: {row.file.name}</p>
              ) : null}
              <div className="mt-3 border-t border-stone-100 pt-2">
                <p className="text-xs font-medium text-stone-600">Mostrar quando a cor for:</p>
                <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={row.colors.length === 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        updateRow(row.key, { colors: [] });
                      } else {
                        const first = colorOptions[0];
                        updateRow(row.key, { colors: first ? [first] : [] });
                      }
                    }}
                  />
                  Todas as cores
                </label>
                {colorOptions.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {colorOptions.map((c) => (
                      <label key={c} className="flex cursor-pointer items-center gap-1.5 text-sm">
                        <input
                          type="checkbox"
                    checked={row.colors.some(
                      (rc) => rc.trim().toLowerCase() === c.trim().toLowerCase(),
                    )}
                    onChange={() => toggleRowColor(row.key, c)}
                        />
                        {c}
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1 text-xs text-stone-400">
                    Adicione nomes de cor na secção &quot;Cores do produto&quot; para filtrar por cor.
                  </p>
                )}
              </div>
              {row.url.trim() && !row.file ? (
                <div className="mt-2 h-20 w-24 overflow-hidden rounded border border-stone-100 bg-stone-50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={row.url} alt="" className="h-full w-full object-contain p-0.5" />
                </div>
              ) : row.file ? (
                <p className="mt-2 text-xs text-stone-500">Pré-visualização após gravar.</p>
              ) : null}
            </div>
          ))}
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
