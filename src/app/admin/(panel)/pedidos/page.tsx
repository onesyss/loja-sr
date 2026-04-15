import { formatBRL } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";

const statusLabel: Record<string, string> = {
  pending: "Pendente",
  paid: "Pago",
  cancelled: "Cancelado",
  failed: "Falhou",
};

export default async function AdminPedidosPage() {
  const supabase = await createClient();
  const { data: orders, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <p className="text-red-700">
        Erro ao carregar pedidos. Confira as policies RLS para admin.
      </p>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">Pedidos</h1>
      <p className="mt-1 text-stone-600">
        Status atualizado automaticamente pelo webhook do Mercado Pago.
      </p>
      {!orders?.length ? (
        <p className="mt-8 text-stone-600">Nenhum pedido ainda.</p>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-xl border border-stone-200 bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-stone-200 bg-stone-50">
              <tr>
                <th className="px-4 py-3 font-medium text-stone-700">Data</th>
                <th className="px-4 py-3 font-medium text-stone-700">Cliente</th>
                <th className="px-4 py-3 font-medium text-stone-700">Total</th>
                <th className="px-4 py-3 font-medium text-stone-700">Status</th>
                <th className="px-4 py-3 font-medium text-stone-700">MP</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-stone-100 last:border-0">
                  <td className="px-4 py-3 whitespace-nowrap text-stone-600">
                    {new Date(o.created_at).toLocaleString("pt-BR")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-stone-900">{o.customer_name}</div>
                    <div className="text-xs text-stone-500">{o.customer_email}</div>
                  </td>
                  <td className="px-4 py-3">{formatBRL(o.total_cents)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        o.status === "paid"
                          ? "text-green-800"
                          : o.status === "pending"
                            ? "text-violet-700"
                            : "text-stone-600"
                      }
                    >
                      {statusLabel[o.status] ?? o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-stone-500">
                    {o.mercadopago_payment_id ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
