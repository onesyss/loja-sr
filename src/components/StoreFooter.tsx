import Link from "next/link";
import { BRAND, whatsappHref } from "@/lib/brand";

export function StoreFooter() {
  return (
    <footer className="mt-auto border-t border-violet-100 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-violet-600">{BRAND.name}</p>
          <p className="text-sm text-stone-600">{BRAND.tagline}</p>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span className="text-stone-500">
            Visitantes navegam sem login; admin acessa o painel com conta.
          </span>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-full border border-violet-200 bg-white px-4 py-2 font-medium text-violet-600 transition hover:bg-violet-50"
          >
            WhatsApp +55 91 98524-0488
          </a>
        </div>
      </div>
    </footer>
  );
}
