import { ProductCard } from "@/components/ProductCard";
import { mockProducts } from "@/lib/mock-products";

export default async function HomePage() {
  const products = mockProducts.filter((product) => product.active);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-10">
        <p className="text-sm font-semibold uppercase tracking-wider text-violet-600">
          Moda a seus pés
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-stone-900">
          SR CALÇADOS
        </h1>
        <p className="mt-2 max-w-xl text-stone-600">
          Explore a vitrine, monte seu carrinho e pague com Mercado Pago. Dúvidas? Fale no WhatsApp.
        </p>
      </div>
      {!products?.length ? (
        <p className="text-stone-500">Nenhum produto cadastrado ainda.</p>
      ) : (
        <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <li key={p.id}>
              <ProductCard product={p} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
