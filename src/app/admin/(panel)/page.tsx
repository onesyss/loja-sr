import Link from "next/link";

export default function AdminHomePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">Painel</h1>
      <p className="mt-2 text-stone-600">
        Gerencie produtos e acompanhe pedidos.
      </p>
      <ul className="mt-8 flex flex-col gap-4 sm:flex-row">
        <li>
          <Link
            href="/admin/produtos"
            className="block rounded-xl border border-stone-200 bg-white px-6 py-4 font-medium text-violet-700 shadow-sm hover:border-violet-200"
          >
            Produtos
          </Link>
        </li>
        <li>
          <Link
            href="/admin/pedidos"
            className="block rounded-xl border border-stone-200 bg-white px-6 py-4 font-medium text-violet-700 shadow-sm hover:border-violet-200"
          >
            Pedidos
          </Link>
        </li>
      </ul>
    </div>
  );
}
