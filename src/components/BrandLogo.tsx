import Image from "next/image";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import logoSrc from "@/app/img/logo-sr-calcados.png";

type Props = {
  /** Se definido, a logo vira link (ex.: `/` na loja). */
  href?: string;
  className?: string;
  /** Tamanho exibido (padrão loja: alta; admin passa menor). */
  heightClassName?: string;
};

export function BrandLogo({
  href,
  className = "",
  heightClassName = "h-10 w-10 sm:h-11 sm:w-11",
}: Props) {
  const img = (
    <Image
      src={logoSrc}
      alt={BRAND.name}
      width={50}
      height={50}
      className={`block max-h-full object-contain object-left ${heightClassName} ${className}`}
      priority
      sizes="(max-width: 640px) 48vw, (max-width: 1024px) 260px"
    />
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block min-w-0 shrink-0 leading-none [line-height:0]"
      >
        {img}
      </Link>
    );
  }

  return (
    <span className="block min-w-0 shrink-0 leading-none [line-height:0]">{img}</span>
  );
}
