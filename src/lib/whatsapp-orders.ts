import type { WhatsAppOrderRecord } from "@/types/database";

const STORAGE_KEY = "sr-calcados-whatsapp-orders";
export const WHATSAPP_ORDERS_UPDATED = "sr-calcados-whatsapp-orders-updated";

function canUseStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function getWhatsappOrders(): WhatsAppOrderRecord[] {
  if (!canUseStorage()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as WhatsAppOrderRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveWhatsappOrder(
  payload: Omit<WhatsAppOrderRecord, "id" | "created_at">,
): WhatsAppOrderRecord {
  const id =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const created_at = new Date().toISOString();
  const record: WhatsAppOrderRecord = {
    id,
    created_at,
    ...payload,
  };
  const next = [record, ...getWhatsappOrders()];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(WHATSAPP_ORDERS_UPDATED));
  return record;
}

export function deleteWhatsappOrder(id: string): void {
  if (!canUseStorage()) return;
  const next = getWhatsappOrders().filter((o) => o.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(WHATSAPP_ORDERS_UPDATED));
}
