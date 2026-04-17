"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { CartAddedToast } from "@/components/CartAddedToast";
import type { ProductRow } from "@/types/database";

export interface CartLine {
  lineId: string;
  product: ProductRow;
  quantity: number;
  size?: number;
  color?: string;
}

interface CartContextValue {
  lines: CartLine[];
  add: (
    product: ProductRow,
    quantity?: number,
    options?: { size?: number; color?: string },
  ) => void;
  remove: (lineId: string) => void;
  setQuantity: (lineId: string, quantity: number) => void;
  clear: () => void;
  totalCents: number;
  itemCount: number;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "sr-calcados-cart";

function loadLines(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartLine[];
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((line) => line?.product?.id)
      .map((line) => ({
        ...line,
        lineId:
          line.lineId ??
          `${line.product.id}-${line.size ?? "na"}-${line.color ?? "na"}`,
      }));
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [cartToast, setCartToast] = useState<{
    productName: string;
    key: number;
  } | null>(null);

  useEffect(() => {
    setLines(loadLines());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  }, [lines, hydrated]);

  useEffect(() => {
    if (!cartToast) return;
    const t = window.setTimeout(() => setCartToast(null), 2400);
    return () => window.clearTimeout(t);
  }, [cartToast]);

  const add = useCallback(
    (
      product: ProductRow,
      quantity = 1,
      options?: { size?: number; color?: string },
    ) => {
      const lineId = `${product.id}-${options?.size ?? "na"}-${options?.color ?? "na"}`;
    setLines((prev) => {
      const idx = prev.findIndex((l) => l.lineId === lineId);
      if (idx === -1) {
        return [
          ...prev,
          {
            lineId,
            product,
            quantity: Math.max(1, quantity),
            size: options?.size,
            color: options?.color,
          },
        ];
      }
      const next = [...prev];
      next[idx] = {
        ...next[idx],
        quantity: next[idx].quantity + quantity,
      };
      return next;
    });
    setCartToast({ productName: product.name, key: Date.now() });
    },
    [],
  );

  const remove = useCallback((lineId: string) => {
    setLines((prev) => prev.filter((l) => l.lineId !== lineId));
  }, []);

  const setQuantity = useCallback((lineId: string, quantity: number) => {
    if (quantity < 1) {
      setLines((prev) => prev.filter((l) => l.lineId !== lineId));
      return;
    }
    setLines((prev) =>
      prev.map((l) =>
        l.lineId === lineId ? { ...l, quantity } : l,
      ),
    );
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartContextValue>(() => {
    const totalCents = lines.reduce(
      (acc, l) => acc + l.product.price_cents * l.quantity,
      0,
    );
    const itemCount = lines.reduce((acc, l) => acc + l.quantity, 0);
    return {
      lines,
      add,
      remove,
      setQuantity,
      clear,
      totalCents,
      itemCount,
    };
  }, [lines, add, remove, setQuantity, clear]);

  return (
    <CartContext.Provider value={value}>
      {children}
      <CartAddedToast payload={cartToast} />
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart deve estar dentro de CartProvider");
  return ctx;
}
