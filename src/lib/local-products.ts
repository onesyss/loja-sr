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

/**
 * Mocks desativados por defeito: quando a API falha, lista vazia evita confundir com dados reais.
 * Para demos locais: `NEXT_PUBLIC_USE_MOCK_PRODUCTS=true` no .env.local
 */
function fallbackProducts(): ProductRow[] {
  if (process.env.NEXT_PUBLIC_USE_MOCK_PRODUCTS === "true") {
    return ensureProductCodes([...mockProducts]);
  }
  return [];
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
      if (process.env.NODE_ENV === "development") {
        console.warn(
          "[SR Calçados] GET /api/products não devolveu uma lista.",
          "HTTP:",
          response.status,
          "Resposta:",
          data,
        );
      }
      return fallbackProducts();
    }
    return ensureProductCodes(data as ProductRow[]);
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.warn("[SR Calçados] Erro ao pedir produtos à API:", e);
    }
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
    if (process.env.NEXT_PUBLIC_USE_MOCK_PRODUCTS === "true") {
      const fallback = fallbackProducts();
      return fallback.find((product) => product.slug === slug) ?? null;
    }
    return null;
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
    if (process.env.NEXT_PUBLIC_USE_MOCK_PRODUCTS === "true") {
      const fallback = fallbackProducts();
      return fallback.find((product) => product.id === id) ?? null;
    }
    return null;
  }
}

export type UpsertProductResult =
  | { ok: true; product: ProductRow }
  | { ok: false; error: string };

function errorMessageFromApiBody(data: unknown, status: number, verb = "completar"): string {
  if (
    data &&
    typeof data === "object" &&
    "error" in data &&
    typeof (data as { error: unknown }).error === "string"
  ) {
    return (data as { error: string }).error;
  }
  return `Não foi possível ${verb} (erro ${status}).`;
}

export async function upsertLocalProduct(
  payload: Omit<ProductRow, "id" | "created_at" | "updated_at">,
  currentId?: string,
): Promise<UpsertProductResult> {
  const path = currentId ? `/api/products/${currentId}` : "/api/products";
  const method = currentId ? "PUT" : "POST";
  const { response, data } = await requestProducts(path, {
    method,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    return { ok: false, error: errorMessageFromApiBody(data, response.status, "salvar") };
  }

  if (!data || Array.isArray(data)) {
    return { ok: false, error: "Resposta inválida do servidor." };
  }

  const row = ensureProductCodes([data as ProductRow])[0];
  if (!row) {
    return { ok: false, error: "Resposta inválida do servidor." };
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(PRODUCTS_UPDATED_EVENT));
  }
  return { ok: true, product: row };
}

export type DeleteProductResult = { ok: true } | { ok: false; error: string };

export async function deleteLocalProduct(id: string): Promise<DeleteProductResult> {
  const response = await fetch(`/api/products/${encodeURIComponent(id)}`, {
    method: "DELETE",
    credentials: "same-origin",
  });

  if (response.status === 204) {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(PRODUCTS_UPDATED_EVENT));
    }
    return { ok: true };
  }

  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }
  return {
    ok: false,
    error: errorMessageFromApiBody(data, response.status, "excluir"),
  };
}
