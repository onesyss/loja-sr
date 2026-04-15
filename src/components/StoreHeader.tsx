import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { CartLink } from "./CartLink";

export function StoreHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/60 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
        <Link href="/" className="min-w-0">
          <span className="block text-lg font-bold tracking-wide text-violet-700">
            {BRAND.name}
          </span>
          <span className="block text-xs font-medium text-violet-700/80">
            {BRAND.tagline}
          </span>
        </Link>
        <nav className="flex flex-wrap items-center gap-4 text-sm font-medium text-stone-700 sm:gap-6">
          <Link
            href="/"
            className="rounded-full bg-white/70 px-3 py-1.5 shadow-sm ring-1 ring-violet-100 transition hover:text-violet-600"
          >
            Loja
          </Link>
          <CartLink />
        </nav>
      </div>
    </header>
  );
}
