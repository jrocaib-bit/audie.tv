"use client";

import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";

/** Mock de desarrollo con sesión (`?mock=gratis|premium|con`): solo fuera de producción, como `mockDe` de La sala. */
export function mockConSesion(mock: string | null | undefined, entorno: string | undefined = process.env.NODE_ENV): boolean {
  return entorno !== "production" && (mock === "gratis" || mock === "premium" || mock === "con");
}

function Interior({ href, className, cuenta, children }: { href: string; className: string; cuenta: string; children: ReactNode }) {
  const mock = useSearchParams()?.get("mock");
  if (mockConSesion(mock)) return <span data-cuenta-mock className={className}>{cuenta}</span>;
  return <Link href={href} className={className}>{children}</Link>;
}

/** Enlace «Entrar» de la cabecera. Con sesión simulada (solo desarrollo) muestra «Cuenta» sin enlace a /entrar. */
export function EnlaceCuenta({ href, className, cuenta, children }: { href: string; className: string; cuenta: string; children: ReactNode }) {
  return (
    <Suspense fallback={<Link href={href} className={className}>{children}</Link>}>
      <Interior href={href} className={className} cuenta={cuenta}>{children}</Interior>
    </Suspense>
  );
}
