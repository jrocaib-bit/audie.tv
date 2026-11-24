"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState, type ReactNode } from "react";

export type EnlaceNav = { href: string; etiqueta: string };

function activo(pathname: string, href: string): boolean {
  // Inicio (`/es`) solo está activo en la portada: no es la sección de todo lo que cuelga de `/es/...`.
  const inicio = /^\/[a-z]{2}$/.test(href);
  return pathname === href || (!inicio && pathname.startsWith(`${href}/`));
}

/** Navegación principal: enlaces en cabecera en escritorio, menú desplegable en móvil. */
export function NavSitio({
  enlaces,
  menu,
  cerrar,
  children,
}: {
  enlaces: EnlaceNav[];
  menu: string;
  cerrar: string;
  children: ReactNode;
}) {
  const pathname = usePathname() || "";
  const [abierto, setAbierto] = useState(false);
  const [rutaMenu, setRutaMenu] = useState(pathname);
  if (rutaMenu !== pathname) {
    setRutaMenu(pathname);
    setAbierto(false);
  }
  const id = useId();
  useEffect(() => {
    if (!abierto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAbierto(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [abierto]);

  const links = (clase: string) =>
    enlaces.map((item) => {
      const current = activo(pathname, item.href);
      return (
        <Link
          key={item.href}
          href={item.href}
          aria-current={current ? "page" : undefined}
          className={`inline-flex min-h-11 items-center ${clase}`}
          onClick={() => setAbierto(false)}
        >
          {item.etiqueta}
        </Link>
      );
    });

  return (
    <div className="flex items-center gap-3 text-sm text-[#F4ECE2] md:gap-4">
      <nav data-nav="escritorio" aria-label={menu} className="hidden items-center gap-4 md:flex">
        {links("")}
      </nav>
      {children}
      <button
        type="button"
        className="inline-flex min-h-11 items-center md:hidden"
        aria-expanded={abierto}
        aria-controls={id}
        data-menu-boton=""
        onClick={() => setAbierto((v) => !v)}
      >
        {abierto ? cerrar : menu}
      </button>
      {abierto ? (
        <nav
          id={id}
          data-menu="abierto"
          aria-label={menu}
          className="absolute inset-x-0 top-full z-40 border-t border-[#2E2924] bg-[#100E0C] px-5 py-3 md:hidden"
        >
          <div className="mx-auto flex w-full max-w-6xl flex-col">{links("w-full")}</div>
        </nav>
      ) : null}
    </div>
  );
}
