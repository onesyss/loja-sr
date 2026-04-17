"use client";

/**
 * Popup compacto exibido ao adicionar item ao carrinho (renderizado pelo CartProvider).
 */
export function CartAddedToast({
  payload,
}: {
  payload: { productName: string; key: number } | null;
}) {
  if (!payload) return null;

  return (
    <div
      className="fixed bottom-6 left-1/2 z-[100] max-w-[min(90vw,20rem)] -translate-x-1/2"
      role="status"
      aria-live="polite"
    >
      <div
        key={payload.key}
        style={{ animation: "cart-toast-pop 0.35s ease-out" }}
        className="flex items-start gap-2.5 rounded-2xl border border-violet-400/40 bg-gradient-to-r from-violet-700 to-purple-700 px-4 py-3 text-white shadow-lg shadow-violet-900/25 ring-1 ring-white/15"
      >
        <span
          className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 text-xs font-bold"
          aria-hidden
        >
          ✓
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-medium uppercase tracking-wide text-violet-100/90">
            Carrinho
          </p>
          <p className="truncate text-sm font-semibold leading-snug text-white">
            {payload.productName}
          </p>
          <p className="mt-0.5 text-xs text-violet-100/95">Adicionado com sucesso</p>
        </div>
      </div>
    </div>
  );
}
