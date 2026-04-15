import { ProductForm } from "@/components/ProductForm";

export default function NovoProdutoPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">Novo produto</h1>
      <p className="mt-1 text-stone-600">
        Preencha os dados e envie uma imagem (JPEG, PNG ou WebP).
      </p>
      <div className="mt-8">
        <ProductForm />
      </div>
    </div>
  );
}
