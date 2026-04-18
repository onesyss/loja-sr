import type { ColorLinkedImageEntry, ProductRow } from "@/types/database";
import { resolveProductCategory } from "@/lib/product-category";

const IMAGE_LIBRARY = {
  tenis: [
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=1200&q=80",
  ],
  sapato: [
    "https://images.unsplash.com/photo-1614252369475-531eba835eb1?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1514989940723-e8e51635b782?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1612471795821-6b2fbb0f8ef1?auto=format&fit=crop&w=1200&q=80",
  ],
  sandalia: [
    "https://images.unsplash.com/photo-1603487742131-4160ec999306?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1582588678413-dbf45f4823e9?auto=format&fit=crop&w=1200&q=80",
  ],
  bota: [
    "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=1200&q=80",
  ],
  infantil: [
    "https://images.unsplash.com/photo-1519861531473-9200262188bf?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1515347619252-60a4bf4fff4f?auto=format&fit=crop&w=1200&q=80",
  ],
  geral: [
    "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1562183241-b937e95585b6?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1612015670817-0127d21628a4?auto=format&fit=crop&w=1200&q=80",
  ],
} as const;

/** Fotos de tênis alinhadas à cor (Unsplash). */
const TENIS_POR_COR = {
  vermelho: [
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1608231387042-66d1773070a5?auto=format&fit=crop&w=1200&q=80",
  ],
  verde: [
    "https://images.unsplash.com/photo-1606107550945-3490a7b67144?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1551107696-4b6c56c2fc28?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1595950653106-fb8a2cb38e8f?auto=format&fit=crop&w=1200&q=80",
  ],
  azul: [
    "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1543508282-6319a3e2621f?auto=format&fit=crop&w=1200&q=80",
    "https://images.unsplash.com/photo-1605348532760-6753d2c43329?auto=format&fit=crop&w=1200&q=80",
  ],
} as const;

type TomTenis = keyof typeof TENIS_POR_COR;

function hashString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/** Cor a partir do texto (cor escolhida, nome do produto ou descrição). */
export function inferTenisColorTone(text: string): TomTenis | null {
  const t = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
  if (/vermelh|red|bordo|vinho|rubro/.test(t)) return "vermelho";
  if (/verde|green|militar|oliva|lima/.test(t)) return "verde";
  if (/azul|blue|marinho|navy|celeste|turques/.test(t)) return "azul";
  return null;
}

function inferColorHintForTenis(
  product: ProductRow,
  colorHint?: string | null,
): string {
  const fromHint = colorHint?.trim();
  if (fromHint) return fromHint;
  const first = product.available_colors?.[0]?.trim();
  if (first) return first;
  return `${product.name} ${product.description ?? ""}`;
}

function getImageGroup(product: Pick<ProductRow, "name" | "description">) {
  const text = `${product.name} ${product.description ?? ""}`.toLowerCase();

  if (/infan|kids|juvenil/.test(text)) return IMAGE_LIBRARY.infantil;
  if (/bota|boot/.test(text)) return IMAGE_LIBRARY.bota;
  if (/sand[áa]lia|salto|chinelo/.test(text)) return IMAGE_LIBRARY.sandalia;
  if (/sapato|social|mocassim/.test(text)) return IMAGE_LIBRARY.sapato;
  if (/t[êe]nis|esport|corrida|treino/.test(text)) return IMAGE_LIBRARY.tenis;
  return IMAGE_LIBRARY.geral;
}

const MAX_IMAGES_PER_COLOR_ENTRY = 3;

/** URLs da entrada (principal + extras), no máximo 3. */
export function entryImageUrls(e: ColorLinkedImageEntry): string[] {
  const main = e.url?.trim();
  const extras = (e.extra_urls ?? [])
    .map((u) => String(u).trim())
    .filter(Boolean);
  const merged = [main, ...extras].filter(Boolean) as string[];
  return merged.slice(0, MAX_IMAGES_PER_COLOR_ENTRY);
}

/** Normaliza JSON do banco para até 5 entradas `{ url, extra_urls?, colors, sizes? }`. */
export function normalizeColorLinkedImages(raw: unknown): ColorLinkedImageEntry[] {
  let data: unknown = raw;
  if (typeof raw === "string") {
    const s = raw.trim();
    if (!s) return [];
    try {
      data = JSON.parse(s) as unknown;
    } catch {
      return [];
    }
  }
  if (!data || !Array.isArray(data)) return [];
  const out: ColorLinkedImageEntry[] = [];
  for (const item of data) {
    if (!item || typeof item !== "object") continue;
    const o = item as {
      urls?: unknown;
      url?: unknown;
      extra_urls?: unknown;
      colors?: unknown;
      sizes?: unknown;
    };
    let imageUrls: string[] = [];
    if (Array.isArray(o.urls)) {
      imageUrls = o.urls
        .map((x) => String(x).trim())
        .filter(Boolean)
        .slice(0, MAX_IMAGES_PER_COLOR_ENTRY);
    } else {
      const main = String(o.url ?? "").trim();
      const extra = Array.isArray(o.extra_urls)
        ? o.extra_urls.map((x) => String(x).trim()).filter(Boolean)
        : [];
      imageUrls = [main, ...extra].filter(Boolean).slice(0, MAX_IMAGES_PER_COLOR_ENTRY);
    }
    if (imageUrls.length === 0) continue;
    const c = o.colors;
    const colors = Array.isArray(c)
      ? [...new Set(c.map((x) => String(x).trim()).filter(Boolean))]
      : [];
    let sizes: number[] | undefined;
    if (Array.isArray(o.sizes)) {
      const nums = o.sizes
        .map((x) => Number(x))
        .filter((n) => Number.isFinite(n) && n > 0) as number[];
      sizes = [...new Set(nums)].sort((a, b) => a - b);
      if (sizes.length === 0) sizes = undefined;
    }
    const entry: ColorLinkedImageEntry = { url: imageUrls[0], colors };
    if (imageUrls.length > 1) entry.extra_urls = imageUrls.slice(1);
    if (sizes?.length) entry.sizes = sizes;
    out.push(entry);
    if (out.length >= 5) break;
  }
  return out;
}

/** Nomes de cor únicos usados em `color_linked_images` (máx. 5), para vitrine/PDP. */
export function uniqueLinkedColorNames(product: ProductRow): string[] {
  const entries = normalizeColorLinkedImages(product.color_linked_images);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const e of entries) {
    for (const c of e.colors) {
      const t = c.trim();
      if (!t) continue;
      const k = t.toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(t);
      if (out.length >= 5) break;
    }
  }
  return out;
}

/**
 * URLs da galeria para a cor escolhida (PDP/carrinho).
 * Inclui, em ordem do JSON: (1) fotos com `colors` vazio (= todas as cores) e (2) fotos cuja lista
 * inclui a cor escolhida. Antes usávamos só um grupo quando havia fotos específicas — escondia as
 * marcadas «todas» junto com as da cor.
 * Sem `color_linked_images`: usa `image_url` + `extra_image_urls` (legado).
 */
export function galleryUrlsForColor(
  product: ProductRow,
  selectedColor: string | null | undefined,
): string[] {
  const entries = normalizeColorLinkedImages(product.color_linked_images);
  const sel = (selectedColor ?? "").trim().toLowerCase();

  if (entries.length === 0) {
    return getProductUploadedImageUrls(product);
  }

  const out: string[] = [];
  const seen = new Set<string>();
  for (const e of entries) {
    const cols = e.colors.map((c) => c.trim().toLowerCase()).filter(Boolean);
    const urls = entryImageUrls(e);
    if (urls.length === 0) continue;
    if (sel === "") {
      for (const u of urls) {
        if (!u || seen.has(u)) continue;
        seen.add(u);
        out.push(u);
      }
      continue;
    }
    const forAllColors = cols.length === 0;
    const forThisColor = cols.includes(sel);
    if (!forAllColors && !forThisColor) continue;
    for (const u of urls) {
      if (!u || seen.has(u)) continue;
      seen.add(u);
      out.push(u);
    }
  }
  if (out.length > 0) {
    return out;
  }
  if (entries.length > 0) {
    const all: string[] = [];
    const seenAll = new Set<string>();
    for (const e of entries) {
      for (const u of entryImageUrls(e)) {
        if (!u || seenAll.has(u)) continue;
        seenAll.add(u);
        all.push(u);
      }
    }
    if (all.length > 0) return all;
  }
  return getProductUploadedImageUrls(product);
}

/** Fotos guardadas no produto (principal + extras), sem placeholders da vitrine. */
export function getProductUploadedImageUrls(product: ProductRow): string[] {
  const main = product.image_url?.trim();
  const extras = (product.extra_image_urls ?? [])
    .map((u) => String(u).trim())
    .filter(Boolean);
  const out: string[] = [];
  if (main) out.push(main);
  for (const u of extras) {
    if (!out.includes(u)) out.push(u);
  }
  return out;
}

export function getPlaceholderImage(product: Pick<ProductRow, "slug" | "id">, variant = 0) {
  const base = hashString(`${product.slug}-${product.id}`);
  const pool = IMAGE_LIBRARY.geral;
  const idx = (base + variant) % pool.length;
  return pool[idx];
}

/**
 * `colorHint`: cor escolhida (PDP/carrinho) ou vazio — para **tênis**, tenta casar
 * vermelho / verde / azul com fotos correspondentes.
 */
export function getDisplayImage(
  product: ProductRow,
  variant = 0,
  colorHint?: string | null,
) {
  const linkedUrls = galleryUrlsForColor(product, colorHint);
  if (linkedUrls.length > 0) {
    const idx = Math.min(Math.max(0, variant), linkedUrls.length - 1);
    return linkedUrls[idx] ?? linkedUrls[0];
  }

  if (resolveProductCategory(product) === "tenis") {
    const raw = inferColorHintForTenis(product, colorHint);
    const tom = inferTenisColorTone(raw);
    if (tom) {
      const pool = TENIS_POR_COR[tom];
      const base = hashString(`${product.slug}-${product.id}-${tom}`);
      const idx = (base + variant) % pool.length;
      return pool[idx];
    }
  }

  const pool = getImageGroup(product);
  const base = hashString(`${product.slug}-${product.id}`);
  const idx = (base + variant) % pool.length;
  return pool[idx];
}
