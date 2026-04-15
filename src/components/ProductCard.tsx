import Image from "next/image";
import Link from "next/link";
import { formatBRL } from "@/lib/money";
import type { ProductRow } from "@/types/database";
import { AddToCartButton } from "./AddToCartButton";

export function ProductCard({ product }: { product: ProductRow }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-sm transition hover:border-violet-200 hover:shadow-md">
      <Link href={`/produtos/${product.slug}`} className="relative aspect-[4/3] bg-stone-100">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className="object-cover transition group-hover:scale-[1.02]"
            sizes="(max-width:768px) 100vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-stone-400 text-sm">
            Sem imagem
          </div>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <Link href={`/produtos/${product.slug}`}>
          <h2 className="line-clamp-2 font-semibold text-stone-900 hover:text-violet-600">
            {product.name}
          </h2>
        </Link>
        <p className="text-lg font-semibold text-violet-600">
          {formatBRL(product.price_cents)}
        </p>
        <AddToCartButton product={product} />
      </div>
    </article>
  );
}
