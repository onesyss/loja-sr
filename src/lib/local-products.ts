import { mockProducts } from "@/lib/mock-products";
import type { ProductRow } from "@/types/database";

const PRODUCTS_STORAGE_KEY = "sr-calcados-products";
export const PRODUCTS_UPDATED_EVENT = "sr-calcados-products-updated";

function canUseBrowserStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function ensureProductCodes(products: ProductRow[]) {
  return products.map((product, index) => ({
    ...product,
    code: product.code?.trim() ? product.code : `SR-${String(index + 1).padStart(3, "0")}`,
    discount_percent:
      typeof product.discount_percent === "number" ? product.discount_percent : 6,
    max_installments:
      typeof product.max_installments === "number" ? product.max_installments : 5,
  }));
}

function ensureSeedProducts(products: ProductRow[]) {
  const bySlug = new Map(products.map((product) => [product.slug, product]));
  for (const seed of mockProducts) {
    if (!bySlug.has(seed.slug)) {
      products.push(seed);
    }
  }
  return products;
}

export function getLocalProducts(): ProductRow[] {
  if (!canUseBrowserStorage()) return mockProducts;

  try {
    const raw = localStorage.getItem(PRODUCTS_STORAGE_KEY);
    if (!raw) {
      const normalized = ensureProductCodes(mockProducts);
      localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(normalized));
      return normalized;
    }

    const parsed = JSON.parse(raw) as ProductRow[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      const normalized = ensureProductCodes(mockProducts);
      localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(normalized));
      return normalized;
    }

    const normalized = ensureProductCodes(ensureSeedProducts([...parsed]));
    localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(normalized));
    return normalized;
  } catch {
    return mockProducts;
  }
}

export function saveLocalProducts(products: ProductRow[]) {
  if (!canUseBrowserStorage()) return;
  localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
  window.dispatchEvent(new Event(PRODUCTS_UPDATED_EVENT));
}

export function getLocalProductBySlug(slug: string) {
  return getLocalProducts().find((product) => product.slug === slug);
}

export function getLocalProductById(id: string) {
  return getLocalProducts().find((product) => product.id === id);
}

export function upsertLocalProduct(
  payload: Omit<ProductRow, "id" | "created_at" | "updated_at">,
  currentId?: string,
) {
  const now = new Date().toISOString();
  const products = getLocalProducts();
  const hasDuplicateSlug = products.some(
    (product) => product.slug === payload.slug && product.id !== currentId,
  );

  if (hasDuplicateSlug) return null;

  if (currentId) {
    const updated = products.map((product) =>
      product.id === currentId
        ? {
            ...product,
            ...payload,
            updated_at: now,
          }
        : product,
    );
    saveLocalProducts(updated);
    return updated.find((product) => product.id === currentId) ?? null;
  }

  const id =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}`;

  const created: ProductRow = {
    id,
    ...payload,
    created_at: now,
    updated_at: now,
  };

  const next = [created, ...products];
  saveLocalProducts(next);
  return created;
}
