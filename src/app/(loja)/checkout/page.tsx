"use client";

import { useState } from "react";
import { useCart } from "@/context/cart-context";
import { BRAND, whatsappHref } from "@/lib/brand";
import { formatBRL } from "@/lib/money";
import { getDisplayImage } from "@/lib/product-images";
import { productRequiresBirthDate } from "@/lib/melissa-product";

const COUPONS: Record<string, { type: "percent" | "fixed"; value: number }> = {
  BEMVINDO10: { type: "percent", value: 10 },
  SR20: { type: "fixed", value: 2000 },
};

export default function CheckoutPage() {
  const { lines, totalCents, clear } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [form, setForm] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    birth_date: "",
    street: "",
    city: "",
    postal_code: "",
    payment_method: "pix",
    installments: "1",
  });

  const couponRule = appliedCoupon ? COUPONS[appliedCoupon] : null;
  const discountCents = couponRule
    ? couponRule.type === "percent"
      ? Math.round(totalCents * (couponRule.value / 100))
      : couponRule.value
    : 0;
  const safeDiscountCents = Math.min(discountCents, totalCents);
  const finalTotalCents = totalCents - safeDiscountCents;
  const requiresBirthDate = lines.some((line) => productRequiresBirthDate(line.product));
  const formattedBirthDate = form.birth_date
    ? form.birth_date.split("-").reverse().join("/")
    : "Não informada";

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
    if (requiresBirthDate && !form.birth_date.trim()) {
      setError("Para produtos Melissa, informe a data de nascimento.");
      setLoading(false);
      return;
    }
  const paymentLabel =
    form.payment_method === "credito"
      ? `crédito em ${form.installments}x`
      : form.payment_method;

    const itemsText = lines
      .map((line, index) => {
        const sizeText = line.size ? ` | Tam: ${line.size}` : "";
        const colorText = line.color ? ` | Cor: ${line.color}` : "";
        const codeText = line.product.code ? ` [Cód: ${line.product.code}]` : "";
        const imageUrl = getDisplayImage(line.product);
        const photoText = imageUrl ? `\n   Foto: ${imageUrl}` : "";
        return `${index + 1}. ${line.product.name}${codeText} x${line.quantity}${sizeText}${colorText} - ${formatBRL(line.product.price_cents * line.quantity)}${photoText}`;
      })
      .join("\n");

    const message =
      `Olá, ${BRAND.name}! Gostaria de finalizar este pedido:\n\n` +
      `*Cliente*\n` +
      `Nome: ${form.customer_name.trim()}\n` +
      `E-mail: ${form.customer_email.trim()}\n` +
      `Telefone: ${form.customer_phone.trim() || "Não informado"}\n` +
      `Data de nascimento: ${formattedBirthDate}\n\n` +
      `*Entrega*\n` +
      `Endereço: ${form.street.trim()}\n` +
      `Cidade: ${form.city.trim()}\n` +
      `CEP: ${form.postal_code.trim()}\n\n` +
      `*Itens*\n${itemsText}\n\n` +
      `*Cupom:* ${appliedCoupon ?? "Não aplicado"}\n` +
      `*Desconto:* ${formatBRL(safeDiscountCents)}\n` +
      `*Forma de pagamento:* ${paymentLabel}\n` +
      `*Total:* ${formatBRL(finalTotalCents)}\n\n` +
      `Pode me enviar as instruções para pagamento, por favor?`;

    const targetUrl = `${whatsappHref}?text=${encodeURIComponent(message)}`;
    window.open(targetUrl, "_blank", "noopener,noreferrer");
    clear();
    setLoading(false);
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-bold text-stone-900">Checkout</h1>
      <p className="mt-1 text-sm text-stone-500">
        Total: <span className="font-semibold text-violet-600">{formatBRL(finalTotalCents)}</span> — pedido enviado direto no WhatsApp
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        <form onSubmit={handleSubmit} className="grid max-w-xl gap-6">
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
          <label className="block text-sm font-medium text-stone-700" htmlFor="birth_date">
            Data de nascimento
            {requiresBirthDate ? (
              <span className="text-red-600" title="Obrigatório para produtos Melissa">
                {" "}
                *
              </span>
            ) : (
              <span className="font-normal text-stone-500"> (opcional)</span>
            )}
          </label>
          <input
            id="birth_date"
            type="date"
            required={requiresBirthDate}
            aria-required={requiresBirthDate}
            className={
              "mt-1 w-full rounded-lg border px-3 py-2 " +
              (requiresBirthDate ? "border-stone-400 border-l-4 border-l-violet-600" : "border-stone-300")
            }
            value={form.birth_date}
            onChange={(e) => setForm((f) => ({ ...f, birth_date: e.target.value }))}
          />
          {requiresBirthDate ? (
            <p className="mt-1 text-xs text-stone-600">Obrigatório para pedidos com Melissa.</p>
          ) : null}
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
        <div>
          <label className="block text-sm font-medium text-stone-700" htmlFor="payment_method">
            Forma de pagamento
          </label>
          <select
            id="payment_method"
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
            value={form.payment_method}
            onChange={(e) => setForm((f) => ({ ...f, payment_method: e.target.value }))}
          >
            <option value="pix">Pix</option>
            <option value="credito">Crédito</option>
            <option value="debito">Débito</option>
          </select>
        </div>
        {form.payment_method === "credito" ? (
          <div>
            <label className="block text-sm font-medium text-stone-700" htmlFor="installments">
              Parcelamento no crédito
            </label>
            <select
              id="installments"
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
              value={form.installments}
              onChange={(e) => setForm((f) => ({ ...f, installments: e.target.value }))}
            >
              <option value="1">1x</option>
              <option value="2">2x</option>
              <option value="3">3x</option>
              <option value="4">4x</option>
              <option value="5">5x</option>
            </select>
          </div>
        ) : null}
        <div>
          <label className="block text-sm font-medium text-stone-700" htmlFor="coupon_code">
            Cupom (opcional)
          </label>
          <div className="mt-1 flex gap-2">
            <input
              id="coupon_code"
              className="w-full rounded-lg border border-stone-300 px-3 py-2"
              placeholder="Digite o cupom"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            />
            <button
              type="button"
              className="rounded-lg border border-violet-200 px-3 py-2 text-sm font-medium text-violet-700 hover:bg-violet-50"
              onClick={() => {
                const code = couponCode.trim().toUpperCase();
                if (!code) {
                  setAppliedCoupon(null);
                  return;
                }
                if (!COUPONS[code]) {
                  setError("Cupom inválido.");
                  setAppliedCoupon(null);
                  return;
                }
                setError(null);
                setAppliedCoupon(code);
              }}
            >
              Aplicar
            </button>
          </div>
          {appliedCoupon ? (
            <p className="mt-1 text-xs text-green-700">
              Cupom {appliedCoupon} aplicado.
            </p>
          ) : null}
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
          {loading ? "Abrindo WhatsApp..." : "Finalizar pedido no WhatsApp"}
        </button>
        </form>
        <aside className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="text-sm font-semibold text-stone-800">Resumo do pedido</p>
          <ul className="mt-3 space-y-2">
            {lines.map((line) => (
              <li key={line.lineId} className="rounded-lg bg-stone-50 px-3 py-2">
                <p className="text-xs font-medium text-stone-800">{line.product.name}</p>
                <p className="text-[11px] text-stone-600">
                  Cód: {line.product.code ?? "—"} | Tam: {line.size ?? "—"} | Cor:{" "}
                  {line.color ?? "—"}
                </p>
                <p className="text-[11px] text-stone-600">
                  Qtd: {line.quantity} | {formatBRL(line.product.price_cents * line.quantity)}
                </p>
              </li>
            ))}
          </ul>
          <div className="mt-3 border-t border-stone-200 pt-3 text-xs text-stone-600">
            <p>Subtotal: {formatBRL(totalCents)}</p>
            <p>Desconto: {formatBRL(safeDiscountCents)}</p>
            <p className="font-semibold text-stone-800">
              Total final: {formatBRL(finalTotalCents)}
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
