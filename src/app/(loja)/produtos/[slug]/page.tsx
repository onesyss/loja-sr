"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/context/cart-context";
import { getLocalProductBySlug } from "@/lib/local-products";
import { isHiddenFromStorefront } from "@/lib/storefront-exclude";
import { formatBRL } from "@/lib/money";
import { getDisplayImage, galleryUrlsForColor } from "@/lib/product-images";
import { ProductImageLightbox } from "@/components/ProductImageLightbox";
import {
  getProductColorGrid,
  getProductOptions,
  getProductSizeGrid,
} from "@/lib/product-options";
import type { ProductRow } from "@/types/database";

export default function ProdutoPage() {
  const params = useParams<{ slug: string }>();
  const { add } = useCart();
  const [product, setProduct] = useState<ProductRow | null>(null);
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      const raw = await getLocalProductBySlug(params.slug);
      const found = raw && !isHiddenFromStorefront(raw) ? raw : null;
      setProduct(found);

      if (found) {
        const options = getProductOptions(found);
        setSelectedSize(options.sizes[0] ?? null);
        setSelectedColor(options.colors[0] ?? "");
      }
    };
    void load();
  }, [params.slug]);

  const uploadedImageUrls = useMemo(
    () => (product ? galleryUrlsForColor(product, selectedColor) : []),
    [product, selectedColor],
  );

  useEffect(() => {
    if (!product) return;
    const urls = galleryUrlsForColor(product, selectedColor);
    if (urls.length > 0) {
      setSelectedImage((prev) => (prev && urls.includes(prev) ? prev : urls[0]));
    } else {
      setSelectedImage(getDisplayImage(product, 0, selectedColor || null));
    }
  }, [product, selectedColor]);

  if (!product) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <Link
          href="/"
          className="text-sm font-medium text-violet-600 hover:underline"
        >
          ← Voltar à loja
        </Link>
        <p className="mt-8 text-stone-600">
          Produto não encontrado no armazenamento local.
        </p>
      </main>
    );
  }

  const options = getProductOptions(product);
  const sizeGrid = getProductSizeGrid(product);
  const colorGrid = getProductColorGrid(product);
  const colorRequired = options.colors.length > 0;
  const discountPercent = product.discount_percent ?? 6;
  const maxInstallments = Math.min(Math.max(product.max_installments ?? 5, 1), 5);
  const pixCents = Math.round(product.price_cents * (1 - discountPercent / 100));
  const isUnavailable =
    product.stock < 1 ||
    !selectedSize ||
    !options.sizes.includes(selectedSize) ||
    (colorRequired &&
      (!selectedColor || !options.colors.includes(selectedColor))) ||
    options.sizes.length === 0;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <Link
        href="/"
        className="text-sm font-medium text-violet-600 hover:underline"
      >
        ← Voltar à loja
      </Link>
      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        <div>
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            className="group relative aspect-square w-full overflow-hidden rounded-2xl bg-stone-100 p-3 text-left ring-0 transition hover:ring-2 hover:ring-violet-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            aria-label="Ampliar foto do produto"
          >
            <span className="relative block h-full w-full">
              <Image
                src={
                  selectedImage ||
                  getDisplayImage(product, 0, selectedColor || null)
                }
                alt={product.name}
                fill
                className="object-contain"
                priority
                sizes="(max-width:1024px) 100vw, 50vw"
              />
            </span>
            <span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-stone-900/65 px-2.5 py-1 text-[11px] font-medium text-white opacity-0 transition group-hover:opacity-100">
              Clique para ampliar
            </span>
          </button>
          {uploadedImageUrls.length > 1 ? (
            <div
              className="mt-3 grid gap-3"
              style={{
                gridTemplateColumns: `repeat(${Math.min(uploadedImageUrls.length, 4)}, minmax(0, 1fr))`,
              }}
            >
              {uploadedImageUrls.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  type="button"
                  onClick={() => setSelectedImage(image)}
                  className={`relative aspect-square overflow-hidden rounded-lg border bg-stone-50 p-1 ${
                    selectedImage === image
                      ? "border-violet-600"
                      : "border-stone-200"
                  }`}
                >
                  <Image
                    src={image}
                    alt={`${product.name} - foto ${index + 1}`}
                    fill
                    className="object-contain"
                    sizes="120px"
                  />
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <div>
          {product.code ? (
            <p className="text-xs font-medium uppercase tracking-wide text-stone-500">
              Cód: {product.code}
            </p>
          ) : null}
          <h1 className="text-3xl font-bold text-stone-900">{product.name}</h1>
          <div className="mt-4 border-b border-stone-200 pb-3">
            <p className="text-sm leading-none">
              <span className="text-stone-400 line-through">
                {formatBRL(product.price_cents)}
              </span>{" "}
              <span className="font-medium text-red-600">-{discountPercent}%</span>
            </p>
            <p className="mt-2 text-4xl font-extrabold leading-none text-stone-900">
              {formatBRL(pixCents)} <span className="text-xl font-semibold">no Pix</span>
            </p>
            <p className="mt-1 text-sm font-medium text-stone-700">
              {formatBRL(product.price_cents)} em até {String(maxInstallments).padStart(2, "0")}x no cartão
            </p>
          </div>
          {product.description ? (
            <p className="mt-6 whitespace-pre-wrap text-stone-600 leading-relaxed">
              {product.description}
            </p>
          ) : null}
          <p className="mt-4 text-sm text-stone-500">
            Estoque: {product.stock} un.
          </p>
          <div className="mt-6">
            <p className="text-sm font-medium text-stone-700">Numeração disponível</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {sizeGrid.allSizes.length === 0 ? (
                <span className="text-sm text-stone-500">Sem numeração disponível</span>
              ) : (
                sizeGrid.allSizes.map((size) => {
                  const available = sizeGrid.availableSizes.includes(size);
                  return (
                  <button
                    key={size}
                    type="button"
                    disabled={!available}
                    onClick={() => setSelectedSize(size)}
                    className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                      selectedSize === size
                        ? "border-violet-600 bg-violet-600 text-white"
                        : available
                          ? "border-stone-300 bg-white text-stone-700 hover:border-violet-300"
                          : "cursor-not-allowed border-stone-200 bg-stone-100 text-stone-400 line-through"
                    }`}
                  >
                    {size}
                  </button>
                  );
                })
              )}
            </div>
          </div>
          {colorGrid.allColors.length > 0 ? (
            <div className="mt-4">
              <p className="text-sm font-medium text-stone-700">Cor</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {colorGrid.allColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                      selectedColor === color
                        ? "border-violet-600 bg-violet-600 text-white"
                        : "border-stone-300 bg-white text-stone-700 hover:border-violet-300"
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          <div className="mt-8 max-w-xs">
            <button
              type="button"
              onClick={() =>
                add(product, 1, {
                  size: selectedSize ?? undefined,
                  color:
                    options.colors.length > 0 ? selectedColor || undefined : undefined,
                })
              }
              disabled={isUnavailable}
              className="mt-auto w-full rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:from-violet-700 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isUnavailable ? "Indisponível" : "Adicionar ao carrinho"}
            </button>
            <Link
              href="/carrinho"
              className="mt-3 inline-flex w-full items-center justify-center rounded-lg border border-violet-200 bg-white px-4 py-2.5 text-sm font-medium text-violet-700 transition hover:bg-violet-50"
            >
              Ir para o carrinho
            </Link>
          </div>
        </div>
      </div>

      <ProductImageLightbox
        src={
          selectedImage ||
          getDisplayImage(product, 0, selectedColor || null)
        }
        alt={product.name}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </main>
  );
}
