"use client";

import { useId, useState, type ReactNode } from "react";

/** Un libro del índice. El botón abre y cierra sus capítulos al instante, sin animación. */
export function LibroDesplegable({
  nombre,
  detalle,
  testamento,
  busqueda,
  children,
}: {
  nombre: string;
  detalle: string;
  testamento: "at" | "nt";
  busqueda: string;
  children: ReactNode;
}) {
  const [abierto, setAbierto] = useState(false);
  const panel = useId();
  return (
    <li data-libro="" data-nombre={busqueda} data-testamento={testamento} className={abierto ? "min-w-0 md:col-span-2 lg:col-span-3" : "min-w-0"}>
      <h4 className="m-0">
        <button
          type="button"
          aria-expanded={abierto}
          aria-controls={panel}
          onClick={() => setAbierto((valor) => !valor)}
          className="flex min-h-14 w-full items-center justify-between gap-3 rounded-xl border border-[#2E2924] bg-[#1B1815] px-4 py-2 text-left hover:border-[#B7AB9C] aria-expanded:border-[#E0C48A]"
        >
          <span className="min-w-0">
            <span className="block font-display text-xl leading-tight">{nombre}</span>
            <span className="block text-sm text-[#B7AB9C] tabular-nums">{detalle}</span>
          </span>
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" className={abierto ? "shrink-0 rotate-180 text-[#E0C48A]" : "shrink-0 text-[#B7AB9C]"}>
            <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </h4>
      <div id={panel} hidden={!abierto} className="pt-3 pb-2">
        {children}
      </div>
    </li>
  );
}
