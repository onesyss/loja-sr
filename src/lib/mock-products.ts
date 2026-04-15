import type { ProductRow } from "@/types/database";

const now = new Date().toISOString();

export const mockProducts: ProductRow[] = [
  {
    id: "mock-1",
    name: "Tênis Urbano Confort",
    slug: "tenis-urbano-confort",
    description:
      "Modelo versátil para o dia a dia, com solado leve e ótima respirabilidade.",
    price_cents: 18990,
    stock: 12,
    image_url: null,
    active: true,
    created_at: now,
    updated_at: now,
  },
  {
    id: "mock-2",
    name: "Sandália Elegance Salto Médio",
    slug: "sandalia-elegance-salto-medio",
    description:
      "Acabamento premium e palmilha macia para eventos e uso prolongado.",
    price_cents: 14990,
    stock: 7,
    image_url: null,
    active: true,
    created_at: now,
    updated_at: now,
  },
  {
    id: "mock-3",
    name: "Mocassim Casual Masculino",
    slug: "mocassim-casual-masculino",
    description:
      "Estilo clássico com toque moderno. Ideal para trabalho e ocasiões sociais.",
    price_cents: 16990,
    stock: 0,
    image_url: null,
    active: true,
    created_at: now,
    updated_at: now,
  },
  {
    id: "mock-4",
    name: "Bota Adventure Couro",
    slug: "bota-adventure-couro",
    description:
      "Bota resistente com excelente tração para trilhas leves e uso urbano.",
    price_cents: 25990,
    stock: 4,
    image_url: null,
    active: true,
    created_at: now,
    updated_at: now,
  },
  {
    id: "mock-5",
    name: "Chinelo Slide Flex",
    slug: "chinelo-slide-flex",
    description:
      "Praticidade e conforto para rotina, praia e momentos de descanso.",
    price_cents: 7990,
    stock: 20,
    image_url: null,
    active: true,
    created_at: now,
    updated_at: now,
  },
  {
    id: "mock-6",
    name: "Sapato Social Premium",
    slug: "sapato-social-premium",
    description:
      "Visual sofisticado com estrutura reforçada para maior durabilidade.",
    price_cents: 21990,
    stock: 9,
    image_url: null,
    active: true,
    created_at: now,
    updated_at: now,
  },
];

export function getMockProductBySlug(slug: string) {
  return mockProducts.find((product) => product.slug === slug);
}
