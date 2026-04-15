import type { ProductRow } from "@/types/database";

type ProductOptions = {
  sizes: number[];
  colors: string[];
};

function inferAudience(text: string) {
  if (/infan|kids|juvenil/.test(text)) return "infantil";
  if (/femin|sand[áa]lia|salto/.test(text)) return "feminino";
  return "masculino";
}

function inferStyle(text: string) {
  if (/esport|t[êe]nis|corrida|treino/.test(text)) return "esportivo";
  return "casual";
}

function getBaseSizesForAudience(audience: string) {
  return audience === "infantil"
    ? [28, 29, 30, 31, 32, 33, 34]
    : audience === "feminino"
      ? [34, 35, 36, 37, 38, 39, 40]
      : [37, 38, 39, 40, 41, 42, 43, 44];
}

function getBaseColorsForStyle(style: string) {
  return style === "esportivo"
    ? ["Preto", "Branco", "Azul", "Cinza"]
    : ["Preto", "Marrom", "Bege", "Caramelo"];
}

export function getProductOptions(product: ProductRow): ProductOptions {
  const manualSizes = (product.available_sizes ?? [])
    .filter((size) => Number.isFinite(size))
    .map((size) => Number(size))
    .sort((a, b) => a - b);
  const manualColors = (product.available_colors ?? [])
    .map((color) => color.trim())
    .filter(Boolean);

  if (manualSizes.length > 0 || manualColors.length > 0) {
    return {
      sizes:
        manualSizes.length > 0
          ? manualSizes.slice(0, Math.max(0, product.stock))
          : [],
      colors: manualColors.length > 0 ? manualColors : ["Preto"],
    };
  }

  const text = `${product.name} ${product.description ?? ""}`.toLowerCase();
  const audience = product.audience ?? inferAudience(text);
  const style = product.style ?? inferStyle(text);

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
  const text = `${product.name} ${product.description ?? ""}`.toLowerCase();
  const style = product.style ?? inferStyle(text);
  const allColors = getBaseColorsForStyle(style);
  const availableColors = getProductOptions(product).colors;
  return { allColors, availableColors };
}
