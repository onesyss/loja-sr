import Image from "next/image";
import Link from "next/link";
import { getDisplayImage } from "@/lib/product-images";
import { formatBRL } from "@/lib/money";
import { getProductOptions } from "@/lib/product-options";
import type { ProductRow } from "@/types/database";
import { AddToCartButton } from "./AddToCartButton";

type Props = {
  product: ProductRow;
  badges?: string[];
};

export function ProductCard({ product, badges = [] }: Props) {
  const options = getProductOptions(product);
  const cardSizes = options.sizes.slice(0, 4);
  const discountPercent = product.discount_percent ?? 6;
  const maxInstallments = Math.min(Math.max(product.max_installments ?? 5, 1), 5);
  const pixCents = Math.round(product.price_cents * (1 - discountPercent / 100));
  const imageSrc = getDisplayImage(product, 0, options.colors[0] ?? null);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-white/80 bg-white/90 shadow-sm ring-1 ring-violet-100/70 backdrop-blur-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <Link
        href={`/produtos/${product.slug}`}
        className="relative aspect-[5/4] bg-stone-100 p-2"
      >
        <span className="relative block h-full w-full overflow-hidden rounded-xl">
          <Image
            src={imageSrc}
            alt={product.name}
            fill
            className="object-contain"
            sizes="(max-width:768px) 100vw, 33vw"
          />
        </span>
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-3.5">
        {badges.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {badges.map((badge) => (
              <span
                key={badge}
                className="rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-700 ring-1 ring-violet-100"
              >
                {badge}
              </span>
            ))}
          </div>
        ) : null}
        {product.code ? (
          <p className="text-[11px] font-medium uppercase tracking-wide text-stone-500">
            Cód: {product.code}
          </p>
        ) : null}
        <Link href={`/produtos/${product.slug}`}>
          <h2 className="line-clamp-2 text-sm font-semibold text-stone-900 hover:text-violet-600">
            {product.name}
          </h2>
        </Link>
        <div className="border-b border-stone-200 pb-2">
          <p className="text-[13px] leading-none">
            <span className="text-stone-400 line-through">
              {formatBRL(product.price_cents)}
            </span>{" "}
            <span className="font-medium text-red-600">-{discountPercent}%</span>
          </p>
          <p className="mt-2 text-[33px] font-extrabold leading-none text-stone-900">
            {formatBRL(pixCents)} <span className="text-[15px] font-semibold">no Pix</span>
          </p>
          <p className="mt-1 text-[13px] font-medium text-stone-700">
            {formatBRL(product.price_cents)} em até {String(maxInstallments).padStart(2, "0")}x no cartão
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-stone-600">
          <span className="font-medium text-stone-700">Tamanhos:</span>
          {cardSizes.length > 0 ? (
            <span>{cardSizes.join(" · ")}</span>
          ) : (
            <span>Indisponível</span>
          )}
        </div>
        <AddToCartButton product={product} />
      </div>
    </article>
  );
}
