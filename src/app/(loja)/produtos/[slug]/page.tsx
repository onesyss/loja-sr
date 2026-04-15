import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/AddToCartButton";
import { getMockProductBySlug } from "@/lib/mock-products";
import { formatBRL } from "@/lib/money";

type Props = { params: Promise<{ slug: string }> };

export default async function ProdutoPage({ params }: Props) {
  const { slug } = await params;
  const product = getMockProductBySlug(slug);

  if (!product) notFound();

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <Link
        href="/"
        className="text-sm font-medium text-violet-600 hover:underline"
      >
        ← Voltar à loja
      </Link>
      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-stone-100">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover"
              priority
              sizes="(max-width:1024px) 100vw, 50vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-stone-400">
              Sem imagem
            </div>
          )}
        </div>
        <div>
          <h1 className="text-3xl font-bold text-stone-900">{product.name}</h1>
          <p className="mt-4 text-2xl font-semibold text-violet-600">
            {formatBRL(product.price_cents)}
          </p>
          {product.description ? (
            <p className="mt-6 whitespace-pre-wrap text-stone-600 leading-relaxed">
              {product.description}
            </p>
          ) : null}
          <p className="mt-4 text-sm text-stone-500">
            Estoque: {product.stock} un.
          </p>
          <div className="mt-8 max-w-xs">
            <AddToCartButton product={product} />
          </div>
        </div>
      </div>
    </main>
  );
}
