"use client";

import Link from "next/link";
import { useCart } from "@/context/cart-context";

export function CartLink() {
  const { itemCount } = useCart();

  return (
    <Link href="/carrinho" className="transition-colors hover:text-violet-600">
      Carrinho
      {itemCount > 0 ? (
        <span className="ml-1 rounded-full bg-violet-100 px-2 py-0.5 text-xs text-violet-800">
          {itemCount}
        </span>
      ) : null}
    </Link>
  );
}
