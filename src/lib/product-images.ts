import type { ProductRow } from "@/types/database";

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

function hashString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
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

export function getPlaceholderImage(product: Pick<ProductRow, "slug" | "id">, variant = 0) {
  const base = hashString(`${product.slug}-${product.id}`);
  const pool = IMAGE_LIBRARY.geral;
  const idx = (base + variant) % pool.length;
  return pool[idx];
}

export function getDisplayImage(product: ProductRow, variant = 0) {
  if (product.image_url) return product.image_url;
  const pool = getImageGroup(product);
  const base = hashString(`${product.slug}-${product.id}`);
  const idx = (base + variant) % pool.length;
  return pool[idx];
}
