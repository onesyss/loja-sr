"use client";

import { useCallback, useEffect, useState } from "react";
import { ConfirmModal } from "@/components/ConfirmModal";
import { formatBRL } from "@/lib/money";
import {
  deleteWhatsappOrder,
  getWhatsappOrders,
  WHATSAPP_ORDERS_UPDATED,
} from "@/lib/whatsapp-orders";
import type { WhatsAppOrderRecord } from "@/types/database";

export default function AdminPedidosPage() {
  const [orders, setOrders] = useState<WhatsAppOrderRecord[]>([]);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const refresh = useCallback(() => {
    void getWhatsappOrders().then(setOrders);
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener(WHATSAPP_ORDERS_UPDATED, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(WHATSAPP_ORDERS_UPDATED, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [refresh]);

  async function confirmRemoveOrder() {
    if (!pendingDeleteId) return;
    setDeleteBusy(true);
    await deleteWhatsappOrder(pendingDeleteId);
    setDeleteBusy(false);
    setPendingDeleteId(null);
    refresh();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">Pedidos (WhatsApp)</h1>
      <p className="mt-1 text-stone-600">
        Registro dos pedidos finalizados na loja — o mesmo texto enviado ao WhatsApp fica salvo aqui
        (navegador deste computador).
      </p>

      {!orders.length ? (
        <p className="mt-8 text-stone-600">
          Nenhum pedido registrado ainda. Ao finalizar um pedido no checkout, ele aparece aqui.
        </p>
      ) : (
        <ul className="mt-8 space-y-6">
          {orders.map((o) => (
            <li
              key={o.id}
              className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-100 bg-stone-50/80 px-4 py-3 sm:px-5">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
                    {new Date(o.created_at).toLocaleString("pt-BR")}
                  </p>
                  <p className="mt-1 font-semibold text-stone-900">{o.customer_name}</p>
                  <p className="text-sm text-stone-600">{o.customer_email}</p>
                  {o.customer_phone ? (
                    <p className="text-sm text-stone-500">{o.customer_phone}</p>
                  ) : null}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <p className="text-lg font-bold text-violet-700">{formatBRL(o.total_cents)}</p>
                  <button
                    type="button"
                    onClick={() => setPendingDeleteId(o.id)}
                    className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50"
                  >
                    Apagar pedido
                  </button>
                </div>
              </div>
              <details className="group">
                <summary className="cursor-pointer select-none px-4 py-3 text-sm font-medium text-violet-700 hover:bg-violet-50/50 sm:px-5">
                  Ver mensagem enviada ao WhatsApp
                </summary>
                <div className="border-t border-stone-100 px-4 pb-4 sm:px-5">
                  <pre className="mt-3 max-h-[min(70vh,28rem)] overflow-auto whitespace-pre-wrap rounded-xl bg-stone-900/5 p-4 text-xs leading-relaxed text-stone-800">
                    {o.whatsapp_message}
                  </pre>
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}

      <ConfirmModal
        open={pendingDeleteId !== null}
        title="Remover pedido?"
        description="Este registo deixará de aparecer na lista. Não é possível recuperar depois."
        confirmText="Remover"
        cancelText="Cancelar"
        confirmVariant="danger"
        busy={deleteBusy}
        onCancel={() => {
          if (!deleteBusy) setPendingDeleteId(null);
        }}
        onConfirm={() => void confirmRemoveOrder()}
      />
    </div>
  );
}
