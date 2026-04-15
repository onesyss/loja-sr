import Link from "next/link";
import { formatBRL } from "@/lib/money";
import { mockProducts } from "@/lib/mock-products";

export default async function AdminProdutosPage() {
  const products = [...mockProducts].sort((a, b) =>
    a.created_at < b.created_at ? 1 : -1,
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-stone-900">Produtos</h1>
        <Link
          href="/admin/produtos/novo"
          className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
        >
          Novo produto
        </Link>
      </div>
      {!products?.length ? (
        <p className="mt-8 text-stone-600">Nenhum produto cadastrado.</p>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-xl border border-stone-200 bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-stone-200 bg-stone-50">
              <tr>
                <th className="px-4 py-3 font-medium text-stone-700">Nome</th>
                <th className="px-4 py-3 font-medium text-stone-700">Preço</th>
                <th className="px-4 py-3 font-medium text-stone-700">Estoque</th>
                <th className="px-4 py-3 font-medium text-stone-700">Ativo</th>
                <th className="px-4 py-3 font-medium text-stone-700" />
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-stone-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-stone-900">{p.name}</td>
                  <td className="px-4 py-3">{formatBRL(p.price_cents)}</td>
                  <td className="px-4 py-3">{p.stock}</td>
                  <td className="px-4 py-3">{p.active ? "Sim" : "Não"}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/produtos/${p.id}`}
                      className="font-medium text-violet-600 hover:underline"
                    >
                      Editar
                    </Link>
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
