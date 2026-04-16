import type { ProductRow } from "@/types/database";

const now = new Date().toISOString();

export const mockProducts: ProductRow[] = [
  {
    id: "mock-1",
    code: "SR-001",
    name: "Tênis Urbano Confort",
    slug: "tenis-urbano-confort",
    description:
      "Modelo versátil para o dia a dia, com solado leve e ótima respirabilidade.",
    category: "tenis",
    price_cents: 18990,
    stock: 12,
    image_url: null,
    active: true,
    created_at: now,
    updated_at: now,
  },
  {
    id: "mock-2",
    code: "SR-002",
    name: "Sandália Elegance Salto Médio",
    slug: "sandalia-elegance-salto-medio",
    description:
      "Acabamento premium e palmilha macia para eventos e uso prolongado.",
    category: "sandalia",
    price_cents: 14990,
    stock: 7,
    image_url: null,
    active: true,
    created_at: now,
    updated_at: now,
  },
  {
    id: "mock-3",
    code: "SR-003",
    name: "Mocassim Casual Clássico",
    slug: "mocassim-casual-classico",
    description:
      "Estilo clássico com toque moderno. Ideal para trabalho e ocasiões sociais.",
    category: "sapato",
    audience: "feminino",
    style: "casual",
    price_cents: 16990,
    stock: 0,
    image_url: null,
    active: true,
    created_at: now,
    updated_at: now,
  },
  {
    id: "mock-4",
    code: "SR-004",
    name: "Bota Adventure Couro",
    slug: "bota-adventure-couro",
    description:
      "Bota resistente com excelente tração para trilhas leves e uso urbano.",
    category: "bota",
    price_cents: 25990,
    stock: 4,
    image_url: null,
    active: true,
    created_at: now,
    updated_at: now,
  },
  {
    id: "mock-5",
    code: "SR-005",
    name: "Chinelo Slide Flex",
    slug: "chinelo-slide-flex",
    description:
      "Praticidade e conforto para rotina, praia e momentos de descanso.",
    category: "chinelo",
    price_cents: 7990,
    stock: 20,
    image_url: null,
    active: true,
    created_at: now,
    updated_at: now,
  },
  {
    id: "mock-6",
    code: "SR-006",
    name: "Sapato Social Premium",
    slug: "sapato-social-premium",
    description:
      "Visual sofisticado com estrutura reforçada para maior durabilidade.",
    category: "sapato",
    price_cents: 21990,
    stock: 9,
    image_url: null,
    active: true,
    created_at: now,
    updated_at: now,
  },
  {
    id: "mock-7",
    code: "SR-007",
    name: "Sandália Melissa Flow",
    slug: "sandalia-melissa-flow",
    description:
      "Modelo Melissa com design moderno, confortável e ideal para o dia a dia.",
    category: "melissa",
    price_cents: 17990,
    discount_percent: 8,
    max_installments: 5,
    stock: 10,
    image_url: null,
    audience: "feminino",
    style: "casual",
    available_sizes: [33, 34, 35, 36, 37, 38, 39],
    available_colors: ["Preto", "Rosa", "Nude"],
    active: true,
    created_at: now,
    updated_at: now,
  },
];

export function getMockProductBySlug(slug: string) {
  return mockProducts.find((product) => product.slug === slug);
}
