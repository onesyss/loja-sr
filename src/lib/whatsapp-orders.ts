import type { WhatsAppOrderRecord } from "@/types/database";

export const WHATSAPP_ORDERS_UPDATED = "sr-calcados-whatsapp-orders-updated";

async function requestApi(path: string, init?: RequestInit) {
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

export async function getWhatsappOrders(): Promise<WhatsAppOrderRecord[]> {
  try {
    const { response, data } = await requestApi("/api/whatsapp-orders", {
      method: "GET",
      cache: "no-store",
    });
    if (!response.ok || !Array.isArray(data)) {
      return [];
    }
    return data as WhatsAppOrderRecord[];
  } catch {
    return [];
  }
}

export async function saveWhatsappOrder(
  payload: Omit<WhatsAppOrderRecord, "id" | "created_at">,
): Promise<WhatsAppOrderRecord | null> {
  try {
    const { response, data } = await requestApi("/api/whatsapp-orders", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (!response.ok || !data || Array.isArray(data)) {
      return null;
    }
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(WHATSAPP_ORDERS_UPDATED));
    }
    return data as WhatsAppOrderRecord;
  } catch {
    return null;
  }
}

export async function deleteWhatsappOrder(id: string): Promise<boolean> {
  try {
    const { response } = await requestApi(`/api/whatsapp-orders/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) return false;
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(WHATSAPP_ORDERS_UPDATED));
    }
    return true;
  } catch {
    return false;
  }
}
