import type {
  ProductAudience,
  ProductCategory,
  ProductRow,
  ProductStyle,
} from "@/types/database";

/** Mantém compatibilidade com `product-options` (cores / tamanhos). */
export function styleFromCategory(category: ProductCategory): ProductStyle {
  return category === "tenis" ? "esportivo" : "casual";
}

export function audienceFromProductName(name: string): ProductAudience {
  return /infan|kids|juvenil/i.test(name) ? "infantil" : "feminino";
}

export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  sandalia: "Sandália",
  tenis: "Tênis",
  sapato: "Sapato (social, scarpin)",
  bota: "Bota",
  rasteirinha: "Rasteirinha",
  chinelo: "Chinelo",
  mule: "Mule",
  sapatilha: "Sapatilha",
  tamanco: "Tamanco",
  melissa: "Melissa",
};

export const PRODUCT_CATEGORY_ORDER: ProductCategory[] = [
  "sandalia",
  "tenis",
  "sapato",
  "bota",
  "rasteirinha",
  "chinelo",
  "mule",
  "sapatilha",
  "tamanco",
  "melissa",
];

/** Inferência quando o produto ainda não tem `category` salva. */
export function inferProductCategoryFromText(raw: string): ProductCategory {
  const t = raw.toLowerCase();
  if (/melissa/.test(t)) return "melissa";
  if (/bota|coturno/.test(t)) return "bota";
  if (/rasteir/.test(t)) return "rasteirinha";
  if (/chinelo|slide/.test(t)) return "chinelo";
  if (/\bmule\b/.test(t)) return "mule";
  if (/sapatilha|alpargata/.test(t)) return "sapatilha";
  if (/tamanco/.test(t)) return "tamanco";
  if (/sand[áa]lia/.test(t)) return "sandalia";
  if (/t[êe]nis|tênis|tenis/.test(t)) return "tenis";
  if (/sapato|social|scarpin|oxford|loafer|mocassim/.test(t)) return "sapato";
  return "sandalia";
}

export function resolveProductCategory(product: ProductRow): ProductCategory {
  if (product.category) return product.category;
  return inferProductCategoryFromText(
    `${product.name} ${product.description ?? ""} ${product.slug}`,
  );
}
