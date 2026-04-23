/** Identidade SR CALÇADOS — roxo #7C3AED (Tailwind: violet-600) + branco */
export const BRAND = {
  name: "SR CALÇADOS",
  tagline: "Moda a seus pés",

  /** wa.me sem + */
  whatsappE164: "5591985240488",
  /** Número dedicado para pedidos Melissa (wa.me sem +). */
  whatsappMelissaE164: "5591992292691",
  instagramUrl: "https://www.instagram.com/src_alcados/",
  address: "Rua Coronel Garcia, Centro — Igarape-Miri/PA",
} as const;

export const whatsappHref = `https://wa.me/${BRAND.whatsappE164}`;
export const whatsappMelissaHref = `https://wa.me/${BRAND.whatsappMelissaE164}`;
