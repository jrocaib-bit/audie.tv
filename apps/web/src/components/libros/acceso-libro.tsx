"use client";

import Link from "next/link";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { botonesFicha, hrefEntrarParaLibros, type Disponibilidad, type MockLibros, type VistaLector } from "@audite/domain";
import { consultarVista, hayProgreso } from "@/lib/libros/acceso-cliente";
import { destinoAccion, etiquetaBoton, type IdiomaUi } from "@/lib/libros/landing";

type Estado = { vista: VistaLector; progreso: boolean };
const Acceso = createContext<Estado>({ vista: "sin-sesion", progreso: false });

/**
 * Una sola consulta de acceso para toda la landing. El servidor y los buscadores reciben `sin-sesion`.
 * Tras montar, el cliente consulta con el mismo mecanismo de la estantería y cambia los botones.
 */
export function ProveedorAcceso({ id, mock, activo, children }: { id: string; mock: MockLibros | null; activo: boolean; children: ReactNode }) {
  const [estado, setEstado] = useState<Estado>({ vista: "sin-sesion", progreso: false });
  useEffect(() => {
    if (!activo) return;
    let vivo = true;
    void consultarVista(mock).then((vista) => {
      if (vivo) setEstado({ vista, progreso: hayProgreso(id) });
    });
    return () => {
      vivo = false;
    };
  }, [id, mock, activo]);
  return <Acceso.Provider value={estado}>{children}</Acceso.Provider>;
}

const CLASES = {
  primario: "inline-flex min-h-12 items-center justify-center rounded-full bg-[#C9A96E] px-6 text-center text-[#100E0C] outline-offset-4 focus-visible:outline-2 focus-visible:outline-[#C9A96E]",
  secundario: "inline-flex min-h-12 items-center justify-center rounded-full border border-[#C9A96E] px-6 text-center text-[#C9A96E] outline-offset-4 focus-visible:outline-2 focus-visible:outline-[#C9A96E]",
  enlace: "inline-flex min-h-11 items-center justify-center px-2 text-[#E7D7C3] underline underline-offset-4 outline-offset-4 focus-visible:outline-2 focus-visible:outline-[#C9A96E]",
} as const;

/** Botones de acceso. Las reglas salen de `botonesFicha`, la misma fuente que la estantería y la app. */
export function BotonesLibro({ lang, id, disponibilidad, ui, mock, ubicacion }: { lang: string; id: string; disponibilidad: Disponibilidad; ui: IdiomaUi; mock: MockLibros | null; ubicacion: "resumen" | "tarjeta" | "cierre" }) {
  const { vista, progreso } = useContext(Acceso);
  const botones = botonesFicha(vista, disponibilidad, { progreso });
  if (botones.length === 0) return null;
  const entrar = hrefEntrarParaLibros(lang, `/${lang}/libros/${id}/leer`);
  return (
    <div data-acciones={ubicacion} data-vista={vista} className="grid max-w-md gap-3 sm:flex sm:max-w-none sm:flex-wrap sm:items-center">
      {botones.map((boton) => (
        <Link key={boton.accion} href={destinoAccion(boton.accion, lang, id, entrar, mock)} data-accion={boton.accion} className={CLASES[boton.nivel]}>
          {etiquetaBoton(boton, ui)}
        </Link>
      ))}
    </div>
  );
}
