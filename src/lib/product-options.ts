import type { ProductRow } from "@/types/database";
import { resolveProductCategory, styleFromCategory } from "@/lib/product-category";
import {
  normalizeColorLinkedImages,
  uniqueLinkedColorNames,
} from "@/lib/product-images";

type ProductOptions = {
  sizes: number[];
  colors: string[];
};

function inferAudience(text: string) {
  if (/infan|kids|juvenil/.test(text)) return "infantil";
  return "feminino";
}

function inferStyle(text: string) {
  if (/esport|t[êe]nis|corrida|treino/.test(text)) return "esportivo";
  return "casual";
}

function getBaseSizesForAudience(audience: string) {
  return audience === "infantil"
    ? [28, 29, 30, 31, 32, 33, 34]
    : [34, 35, 36, 37, 38, 39, 40];
}

function getBaseColorsForStyle(style: string) {
  return style === "esportivo"
    ? ["Preto", "Branco", "Azul", "Cinza"]
    : ["Preto", "Marrom", "Bege", "Caramelo"];
}

/**
 * Numerações mostradas na PDP para a cor escolhida.
 * Se alguma entrada de `color_linked_images` tiver `sizes`, usa esses valores (e `available_sizes`
 * nas entradas sem `sizes`). Caso contrário, comportamento igual a `getProductOptions().sizes`.
 */
export function getProductSizesForColor(
  product: ProductRow,
  selectedColor: string | null | undefined,
): number[] {
  const baseline = getProductOptions(product).sizes;
  const entries = normalizeColorLinkedImages(product.color_linked_images);
  const hasPerEntrySizes = entries.some((e) => (e.sizes?.length ?? 0) > 0);
  if (entries.length === 0 || !hasPerEntrySizes) {
    return baseline;
  }

  const sel = (selectedColor ?? "").trim().toLowerCase();
  if (!sel) return baseline;

  const out: number[] = [];
  for (const e of entries) {
    const cols = e.colors.map((c) => c.trim().toLowerCase()).filter(Boolean);
    const forAllColors = cols.length === 0;
    const forThisColor = cols.includes(sel);
    if (!forAllColors && !forThisColor) continue;
    const rowSizes = (e.sizes?.length ?? 0) > 0 ? (e.sizes as number[]) : baseline;
    out.push(...rowSizes);
  }
  if (out.length === 0) return baseline;
  return [...new Set(out)].sort((a, b) => a - b);
}

export function getProductOptions(product: ProductRow): ProductOptions {
  const manualSizes = (product.available_sizes ?? [])
    .filter((size) => Number.isFinite(size))
    .map((size) => Number(size))
    .sort((a, b) => a - b);
  const manualColors = (product.available_colors ?? [])
    .map((color) => color.trim())
    .filter(Boolean);
  const linkedColors = uniqueLinkedColorNames(product);
  const hasGallery = normalizeColorLinkedImages(product.color_linked_images).length > 0;

  if (manualSizes.length > 0 || manualColors.length > 0 || linkedColors.length > 0 || hasGallery) {
    const colors =
      manualColors.length > 0
        ? manualColors
        : linkedColors.length > 0
          ? linkedColors
          : [];
    return {
      sizes:
        manualSizes.length > 0
          ? manualSizes.slice(0, Math.max(0, product.stock))
          : [],
      colors,
    };
  }

  const text = `${product.name} ${product.description ?? ""}`.toLowerCase();
  const audience = product.audience ?? inferAudience(text);
  const style =
    product.style ??
    (product.category
      ? styleFromCategory(resolveProductCategory(product))
      : inferStyle(text));

  const baseSizes = getBaseSizesForAudience(audience);

  const baseColors = getBaseColorsForStyle(style);

  const availableCount = Math.max(0, Math.min(baseSizes.length, product.stock));

  return {
    sizes: baseSizes.slice(0, availableCount),
    colors: baseColors,
  };
}

export function getProductSizeGrid(product: ProductRow) {
  const text = `${product.name} ${product.description ?? ""}`.toLowerCase();
  const audience = product.audience ?? inferAudience(text);
  const allSizes = getBaseSizesForAudience(audience);
  const availableSizes = getProductOptions(product).sizes;
  return { allSizes, availableSizes };
}

export function getProductColorGrid(product: ProductRow) {
  const availableColors = getProductOptions(product).colors;
  return { allColors: availableColors, availableColors };
}
