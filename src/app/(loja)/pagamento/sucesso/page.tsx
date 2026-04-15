import Link from "next/link";

type Props = { searchParams: Promise<{ order_id?: string }> };

export default async function PagamentoSucessoPage({ searchParams }: Props) {
  const { order_id } = await searchParams;

  return (
    <main className="mx-auto max-w-lg px-4 py-20 text-center">
      <h1 className="text-2xl font-bold text-stone-900">Pagamento recebido</h1>
      <p className="mt-4 text-stone-600">
        Obrigado pela compra! Assim que o Mercado Pago confirmar, seu pedido será marcado como pago.
      </p>
      {order_id ? (
        <p className="mt-2 text-sm text-stone-500">
          Referência do pedido: <code className="rounded bg-stone-100 px-1">{order_id}</code>
        </p>
      ) : null}
      <Link
        href="/"
        className="mt-8 inline-block font-medium text-violet-600 hover:underline"
      >
        Voltar à loja
      </Link>
    </main>
  );
}
