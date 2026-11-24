"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

/** Una ruta está activa si es la propia o cuelga de ella: `/es/libros/x` marca `/es/libros`. */
export function rutaActiva(pathname: string | null, href: string, exacta = false): boolean {
  if (!pathname) return false;
  const ruta = pathname.replace(/\/$/, "") || "/";
  return ruta === href || (!exacta && ruta.startsWith(`${href}/`));
}

/** Enlace de la cabecera pública con estado activo (`aria-current` y color dorado). */
export function EnlaceNav({ href, className, exacta = false, children }: { href: string; className: string; exacta?: boolean; children: ReactNode }) {
  const activo = rutaActiva(usePathname(), href, exacta);
  return (
    <Link href={href} aria-current={activo ? "page" : undefined} data-activo={activo ? "" : undefined} className={`${className}${activo ? " text-[#C9A96E] underline decoration-[#C9A96E] decoration-2 underline-offset-8" : ""}`}>
      {children}
    </Link>
  );
}
