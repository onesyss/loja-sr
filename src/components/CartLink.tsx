"use client";

import Link from "next/link";
import { useCart } from "@/context/cart-context";

export function CartLink() {
  const { itemCount } = useCart();

  return (
    <Link
      href="/carrinho"
      className="rounded-full bg-white/70 px-3 py-1.5 shadow-sm ring-1 ring-violet-100 transition-colors hover:text-violet-600"
    >
      Carrinho
      {itemCount > 0 ? (
        <span className="ml-1 rounded-full bg-violet-600 px-2 py-0.5 text-xs text-white">
          {itemCount}
        </span>
      ) : null}
    </Link>
  );
}
