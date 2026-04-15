import { BRAND, whatsappHref } from "@/lib/brand";

export function StoreFooter() {
  return (
    <footer className="mt-auto border-t border-white/70 bg-white/70 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-violet-700">{BRAND.name}</p>
          <p className="text-sm text-stone-600">{BRAND.tagline}</p>
          <p className="mt-1 text-sm text-stone-500">{BRAND.address}</p>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <span className="text-stone-500">
            Obrigado por escolher a SR CALÇADOS
          </span>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Abrir WhatsApp"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-violet-600 text-white transition hover:bg-violet-700"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
              <path d="M19.05 4.94A9.87 9.87 0 0 0 12.03 2C6.58 2 2.16 6.43 2.16 11.88c0 1.75.46 3.46 1.33 4.98L2 22l5.28-1.39a9.83 9.83 0 0 0 4.74 1.2h.01c5.45 0 9.88-4.43 9.88-9.88a9.84 9.84 0 0 0-2.86-6.99Zm-7.02 15.2h-.01a8.2 8.2 0 0 1-4.18-1.14l-.3-.18-3.13.82.84-3.05-.2-.31a8.2 8.2 0 0 1-1.25-4.4c0-4.55 3.7-8.25 8.25-8.25 2.2 0 4.27.86 5.82 2.42a8.17 8.17 0 0 1 2.41 5.83c0 4.54-3.7 8.25-8.25 8.25Zm4.52-6.18c-.25-.13-1.47-.72-1.7-.8-.23-.08-.4-.13-.57.12-.17.25-.65.8-.8.96-.15.17-.3.19-.56.06-.25-.13-1.08-.4-2.05-1.29-.76-.67-1.27-1.49-1.42-1.74-.15-.25-.02-.39.11-.52.12-.12.25-.3.38-.45.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.57-1.38-.78-1.89-.21-.5-.43-.44-.57-.45h-.49c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.45 1.03 2.62.13.17 1.76 2.69 4.27 3.77.6.26 1.06.41 1.42.53.6.19 1.14.16 1.57.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.1-.23-.17-.48-.29Z" />
            </svg>
          </a>
          <a
            href={BRAND.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Abrir Instagram"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-violet-700 ring-1 ring-violet-200 transition hover:bg-violet-50"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
              <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm0 1.8A3.95 3.95 0 0 0 3.8 7.75v8.5a3.95 3.95 0 0 0 3.95 3.95h8.5a3.95 3.95 0 0 0 3.95-3.95v-8.5a3.95 3.95 0 0 0-3.95-3.95h-8.5Zm8.95 1.35a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.8A3.2 3.2 0 1 0 12 15.2 3.2 3.2 0 0 0 12 8.8Z" />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  );
}
