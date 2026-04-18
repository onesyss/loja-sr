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
  salto_bloco_fino: "Salto Bloco Fino",
  salto_bloco_grosso: "Salto Bloco Grosso",
  anabela: "Anabela",
  plataforma: "Plataforma",
  papete: "Papete",
  sandalia: "Sandália",
  chinelo: "Chinelo",
  rasteirinha: "Rasteirinha",
  tenis: "Tênis",
  melissa: "Melissa",
  bolsas: "Bolsas",
};

export const PRODUCT_CATEGORY_ORDER: ProductCategory[] = [
  "salto_bloco_fino",
  "salto_bloco_grosso",
  "anabela",
  "plataforma",
  "papete",
  "sandalia",
  "chinelo",
  "rasteirinha",
  "tenis",
  "melissa",
  "bolsas",
];

/** Inferência quando o produto ainda não tem `category` salva. */
export function inferProductCategoryFromText(raw: string): ProductCategory {
  const t = raw.toLowerCase();
  if (/melissa/.test(t)) return "melissa";
  if (/bolsa/.test(t)) return "bolsas";
  if (/rasteir/.test(t)) return "rasteirinha";
  if (/chinelo|slide/.test(t)) return "chinelo";
  if (/papete/.test(t)) return "papete";
  if (/anabela/.test(t)) return "anabela";
  if (/plataforma/.test(t)) return "plataforma";
  if (/salto\s*bloco\s*grosso|bloco\s*grosso/.test(t)) return "salto_bloco_grosso";
  if (/salto\s*bloco\s*fino|bloco\s*fino/.test(t)) return "salto_bloco_fino";
  if (/t[êe]nis|tênis|tenis/.test(t)) return "tenis";
  if (/sand[áa]lia/.test(t)) return "sandalia";
  return "sandalia";
}

export function resolveProductCategory(product: ProductRow): ProductCategory {
  if (product.category) return product.category;
  return inferProductCategoryFromText(
    `${product.name} ${product.description ?? ""} ${product.slug}`,
  );
}
