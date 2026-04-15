import Link from "next/link";

export default function PagamentoPendentePage() {
  return (
    <main className="mx-auto max-w-lg px-4 py-20 text-center">
      <h1 className="text-2xl font-bold text-stone-900">Pagamento pendente</h1>
      <p className="mt-4 text-stone-600">
        Seu pagamento está sendo processado (ex.: boleto ou revisão). Você receberá a confirmação pelo Mercado Pago.
      </p>
      <Link
        href="/"
        className="mt-8 inline-block font-medium text-violet-600 hover:underline"
      >
        Voltar à loja
      </Link>
    </main>
  );
}
