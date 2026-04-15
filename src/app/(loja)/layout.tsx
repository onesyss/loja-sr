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
      <div className="flex min-h-screen flex-1 flex-col">
        <StoreHeader />
        <div className="flex-1">{children}</div>
        <StoreFooter />
      </div>
    </CartProvider>
  );
}
