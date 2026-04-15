import Link from "next/link";

export default function PagamentoFalhaPage() {
  return (
    <main className="mx-auto max-w-lg px-4 py-20 text-center">
      <h1 className="text-2xl font-bold text-stone-900">Pagamento não concluído</h1>
      <p className="mt-4 text-stone-600">
        Algo deu errado ou você cancelou. Nenhum valor foi cobrado. Você pode tentar novamente pelo carrinho.
      </p>
      <Link
        href="/carrinho"
        className="mt-8 inline-block font-medium text-violet-600 hover:underline"
      >
        Ir ao carrinho
      </Link>
    </main>
  );
}
