"use client";

import { useState } from "react";
import { useCart } from "@/context/cart-context";
import { formatBRL } from "@/lib/money";

export default function CheckoutPage() {
  const { lines, totalCents, clear } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    street: "",
    city: "",
    postal_code: "",
  });

  if (lines.length === 0) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-16">
        <h1 className="text-2xl font-bold text-stone-900">Checkout</h1>
        <p className="mt-4 text-stone-600">Adicione itens ao carrinho primeiro.</p>
      </main>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const items = lines.map((l) => ({
        product_id: l.product.id,
        quantity: l.quantity,
      }));
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          customer_name: form.customer_name.trim(),
          customer_email: form.customer_email.trim(),
          customer_phone: form.customer_phone.trim() || undefined,
          shipping_address: {
            street: form.street.trim(),
            city: form.city.trim(),
            postal_code: form.postal_code.trim(),
          },
        }),
      });
      const data = (await res.json()) as { init_point?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Erro ao criar pedido.");
        return;
      }
      if (data.init_point) {
        clear();
        window.location.href = data.init_point;
        return;
      }
      setError("Resposta inválida do servidor.");
    } catch {
      setError("Falha de rede. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-bold text-stone-900">Checkout</h1>
      <p className="mt-1 text-sm text-stone-500">
        Total: <span className="font-semibold text-violet-600">{formatBRL(totalCents)}</span> — pagamento via Mercado Pago
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-10 grid max-w-xl gap-6"
      >
        <div>
          <label className="block text-sm font-medium text-stone-700" htmlFor="customer_name">
            Nome completo
          </label>
          <input
            id="customer_name"
            required
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
            value={form.customer_name}
            onChange={(e) => setForm((f) => ({ ...f, customer_name: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700" htmlFor="customer_email">
            E-mail
          </label>
          <input
            id="customer_email"
            type="email"
            required
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
            value={form.customer_email}
            onChange={(e) => setForm((f) => ({ ...f, customer_email: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700" htmlFor="customer_phone">
            Telefone (opcional)
          </label>
          <input
            id="customer_phone"
            type="tel"
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
            value={form.customer_phone}
            onChange={(e) => setForm((f) => ({ ...f, customer_phone: e.target.value }))}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700" htmlFor="street">
            Endereço
          </label>
          <input
            id="street"
            required
            placeholder="Rua, número, complemento"
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
            value={form.street}
            onChange={(e) => setForm((f) => ({ ...f, street: e.target.value }))}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-stone-700" htmlFor="city">
              Cidade
            </label>
            <input
              id="city"
              required
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700" htmlFor="postal_code">
              CEP
            </label>
            <input
              id="postal_code"
              required
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
              value={form.postal_code}
              onChange={(e) => setForm((f) => ({ ...f, postal_code: e.target.value }))}
            />
          </div>
        </div>

        {error ? (
          <p className="text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-violet-600 px-6 py-3 font-medium text-white hover:bg-violet-700 disabled:opacity-60"
        >
          {loading ? "Redirecionando…" : "Pagar com Mercado Pago"}
        </button>
      </form>
    </main>
  );
}
