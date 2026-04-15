import { CartProvider } from "@/context/cart-context";
import { StoreFooter } from "@/components/StoreFooter";
import { StoreHeader } from "@/components/StoreHeader";

export default function LojaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <div className="flex min-h-full flex-1 flex-col bg-white">
        <StoreHeader />
        <div className="flex-1">{children}</div>
        <StoreFooter />
      </div>
    </CartProvider>
  );
}
