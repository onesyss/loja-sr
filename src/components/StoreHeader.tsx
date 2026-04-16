import Link from "next/link";
import { BrandLogo } from "./BrandLogo";
import { CartLink } from "./CartLink";

export function StoreHeader() {
  return (
    <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:gap-6 sm:py-4">
        <BrandLogo
          href="/"
          heightClassName="h-14 w-auto max-w-[min(52vw,220px)] sm:h-[72px] sm:max-w-[260px] md:h-20 md:max-w-[300px] lg:h-[88px] lg:max-w-[320px]"
        />
        <nav className="flex shrink-0 items-center gap-3 text-sm font-medium text-stone-700 sm:gap-4">
          <Link
            href="/"
            className="rounded-full bg-white/70 px-3 py-1.5 shadow-sm ring-1 ring-violet-100 transition hover:text-violet-600"
          >
            Loja
          </Link>
          <CartLink />
        </nav>
      </div>
      <div
        className="h-px w-full bg-gradient-to-r from-transparent via-violet-500/55 to-fuchsia-500/45"
        aria-hidden
      />
    </header>
  );
}
