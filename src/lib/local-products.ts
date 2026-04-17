import { mockProducts } from "@/lib/mock-products";
import type { ProductRow } from "@/types/database";

export const PRODUCTS_UPDATED_EVENT = "sr-calcados-products-updated";

function normalizeLegacyProduct(product: ProductRow): ProductRow {
  let p = { ...product };
  if ((p.audience as string | undefined) === "masculino") {
    p = { ...p, audience: "feminino" };
  }
  if (p.slug === "mocassim-casual-masculino") {
    p = {
      ...p,
      slug: "mocassim-casual-classico",
      name: "Mocassim Casual Clássico",
      audience: "feminino",
    };
  }
  return p;
}

function ensureProductCodes(products: ProductRow[]) {
  return products.map((product, index) => {
    const normalized = normalizeLegacyProduct(product);
    return {
      ...normalized,
      code: normalized.code?.trim()
        ? normalized.code
        : `SR-${String(index + 1).padStart(3, "0")}`,
      discount_percent:
        typeof normalized.discount_percent === "number"
          ? normalized.discount_percent
          : 6,
      max_installments:
        typeof normalized.max_installments === "number"
          ? normalized.max_installments
          : 5,
    };
  });
}

/** Mocks só quando a API falha (dev/offline). Resposta 200 da API = só Supabase. */
function fallbackProducts() {
  return ensureProductCodes([...mockProducts]);
}

async function requestProducts(path: string, init?: RequestInit) {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }
  return { response, data };
}

export async function getLocalProducts(): Promise<ProductRow[]> {
  try {
    const { response, data } = await requestProducts("/api/products", {
      method: "GET",
      cache: "no-store",
    });
    if (!response.ok || !Array.isArray(data)) {
      return fallbackProducts();
    }
    return ensureProductCodes(data as ProductRow[]);
  } catch {
    return fallbackProducts();
  }
}

export async function getLocalProductBySlug(slug: string): Promise<ProductRow | null> {
  try {
    const { response, data } = await requestProducts(
      `/api/products?slug=${encodeURIComponent(slug)}`,
      { method: "GET", cache: "no-store" },
    );
    if (!response.ok || !data || Array.isArray(data)) return null;
    return ensureProductCodes([data as ProductRow])[0] ?? null;
  } catch {
    const fallback = fallbackProducts();
    return fallback.find((product) => product.slug === slug) ?? null;
  }
}

export async function getLocalProductById(id: string): Promise<ProductRow | null> {
  try {
    const { response, data } = await requestProducts(`/api/products/${id}`, {
      method: "GET",
      cache: "no-store",
    });
    if (!response.ok || !data || Array.isArray(data)) return null;
    return ensureProductCodes([data as ProductRow])[0] ?? null;
  } catch {
    const fallback = fallbackProducts();
    return fallback.find((product) => product.id === id) ?? null;
  }
}

export async function upsertLocalProduct(
  payload: Omit<ProductRow, "id" | "created_at" | "updated_at">,
  currentId?: string,
) {
  const path = currentId ? `/api/products/${currentId}` : "/api/products";
  const method = currentId ? "PUT" : "POST";
  const { response, data } = await requestProducts(path, {
    method,
    body: JSON.stringify(payload),
  });
  if (!response.ok || !data || Array.isArray(data)) {
    return null;
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(PRODUCTS_UPDATED_EVENT));
  }
  return ensureProductCodes([data as ProductRow])[0] ?? null;
}
