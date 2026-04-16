export type OrderStatus = "pending" | "paid" | "cancelled" | "failed";
export type ProductAudience = "feminino" | "infantil";
export type ProductStyle = "casual" | "esportivo" | "promocao";

/** Tipo de calçado (filtro da vitrine e cadastro). */
export type ProductCategory =
  | "sandalia"
  | "tenis"
  | "sapato"
  | "bota"
  | "rasteirinha"
  | "chinelo"
  | "mule"
  | "sapatilha"
  | "tamanco"
  | "melissa";

export type ProfileRole = "customer" | "admin";

export interface ProductRow {
  id: string;
  code?: string | null;
  name: string;
  slug: string;
  description: string | null;
  price_cents: number;
  discount_percent?: number | null;
  max_installments?: number | null;
  stock: number;
  image_url: string | null;
  audience?: ProductAudience | null;
  style?: ProductStyle | null;
  category?: ProductCategory | null;
  available_sizes?: number[] | null;
  available_colors?: string[] | null;
  extra_image_urls?: string[] | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrderRow {
  id: string;
  status: OrderStatus;
  total_cents: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  shipping_address: Record<string, string> | null;
  mercadopago_preference_id: string | null;
  mercadopago_payment_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItemRow {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price_cents: number;
}

/** Pedido enviado pelo fluxo WhatsApp (armazenamento local no admin). */
export interface WhatsAppOrderRecord {
  id: string;
  created_at: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  total_cents: number;
  /** Texto completo enviado ao WhatsApp. */
  whatsapp_message: string;
}
