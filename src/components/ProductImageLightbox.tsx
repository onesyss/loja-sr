"use client";

import { useEffect } from "react";

type Props = {
  src: string;
  alt: string;
  open: boolean;
  onClose: () => void;
};

export function ProductImageLightbox({ src, alt, open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/88 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-label="Ampliar imagem"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-zoom-out"
        onClick={onClose}
        aria-label="Fechar"
      />
      <div className="relative z-[1] max-h-[min(90vh,900px)] max-w-[min(96vw,56rem)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="max-h-[min(90vh,900px)] w-auto max-w-full object-contain shadow-2xl"
        />
      </div>
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-[2] rounded-full bg-white/15 px-3 py-1.5 text-sm font-medium text-white ring-1 ring-white/30 backdrop-blur-sm transition hover:bg-white/25"
      >
        Fechar
      </button>
    </div>
  );
}
