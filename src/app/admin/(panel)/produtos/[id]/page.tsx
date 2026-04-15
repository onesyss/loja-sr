import { notFound } from "next/navigation";
import { ProductForm } from "@/components/ProductForm";
import { mockProducts } from "@/lib/mock-products";

type Props = { params: Promise<{ id: string }> };

export default async function EditarProdutoPage({ params }: Props) {
  const { id } = await params;
  const product = mockProducts.find((item) => item.id === id);

  if (!product) notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">Editar produto</h1>
      <p className="mt-1 text-stone-600">{product.name}</p>
      <div className="mt-8">
        <ProductForm initial={product} />
      </div>
    </div>
  );
}
