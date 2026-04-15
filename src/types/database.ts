export type OrderStatus = "pending" | "paid" | "cancelled" | "failed";

export type ProfileRole = "customer" | "admin";

export interface ProductRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_cents: number;
  stock: number;
  image_url: string | null;
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
