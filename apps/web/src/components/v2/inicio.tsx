"use client";

import { estantes, type FiltroInicio } from "@audite/domain";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Mark } from "@/components/brand";
import { useLibrary } from "@/components/library";
import { EstanteFila, TarjetaCuadro } from "@/components/v2/fichas";

function saludo(locale: "es" | "en", hora: number): string {
  if (locale === "en") return hora < 12 ? "Good morning" : hora < 20 ? "Good afternoon" : "Good evening";
  return hora < 12 ? "Buenos días" : hora < 20 ? "Buenas tardes" : "Buenas noches";
}

const filtros: { id: FiltroInicio; es: string; en: string }[] = [
  { id: "todo", es: "Todo", en: "All" },
  { id: "caminos", es: "Caminos", en: "Paths" },
  { id: "libros", es: "Libros", en: "Books" },
  { id: "temas", es: "Temas", en: "Themes" },
];

export function InicioV2() {
  const library = useLibrary();
  const locale = library.settings.uiLocale;
  const [filtro, setFiltro] = useState<FiltroInicio>("todo");
  const ahora = useMemo(() => new Date(), []);
  const hora = ahora.getHours();
  const dia = Math.floor((ahora.getTime() - Date.parse(`${ahora.getFullYear()}-01-01`)) / 86400000);
  const nombre = (id: string) => {
    const libro = library.catalog.books.find((item) => item.id === id.split("-")[0]);
    const episodio = library.catalog.episodes.find((item) => item.id === id) ?? library.catalog.pendientes.find((item) => item.id === id);
    return episodio?.etiqueta?.[locale] || episodio?.tituloCorto?.[locale] || libro?.name[locale] || id;
  };
  const oibles = new Set(library.catalog.episodes.map((episodio) => episodio.id));
  const filas = estantes({
    locale,
    filtro,
    hora,
    diaDelAno: dia,
    escuchados: Object.entries(library.progress.episodes)
      .filter(([, episodio]) => episodio.positionSeconds > 0)
      .map(([id]) => ({ id, titulo: nombre(id) })),
    camino: library.path.steps.map((paso) => ({ id: paso.episodeId, titulo: nombre(paso.episodeId) })),
    libros: library.catalog.books.slice(0, 12).map((libro) => ({ id: libro.id, titulo: libro.name[locale] || libro.name.es })),
  });

  return (
    <main id="contenido" className="app-clear pt-3">
      <div className="flex items-center justify-between px-4">
        <Link href={`/${locale}`} aria-label="Audite" className="inline-flex min-h-11 items-center">
          <Mark className="size-8 rounded-lg" />
        </Link>
        <Link href="/ajustes" aria-label={locale === "en" ? "Settings" : "Ajustes"} className="inline-flex size-11 items-center justify-center rounded-full border border-border text-sm">
          A
        </Link>
      </div>
      <h1 className="font-display mt-2 px-4 text-4xl leading-none">{saludo(locale, hora)}</h1>
      <div className="estante mt-4 flex gap-2 overflow-x-auto px-4">
        {filtros.map((item) => (
          <button key={item.id} type="button" className={`neo-chip shrink-0 ${filtro === item.id ? "border-acento bg-acento text-acento-ink" : ""}`} onClick={() => setFiltro(item.id)}>
            {locale === "en" ? item.en : item.es}
          </button>
        ))}
      </div>
      {filas.map((estante) => (
        <EstanteFila key={estante.id} titulo={estante.titulo}>
          {estante.tarjetas.map((tarjeta) => (
            <TarjetaCuadro
              key={tarjeta.id}
              href={tarjeta.href}
              episodioId={tarjeta.episodioId}
              titulo={tarjeta.titulo}
              subtitulo={tarjeta.subtitulo}
              color={tarjeta.id === "mix-manana" ? "#3D2B1F" : tarjeta.id === "mix-hoy" ? "#2C3348" : tarjeta.id === "mix-dormir" ? "#1E3A34" : undefined}
              pronto={Boolean(tarjeta.episodioId) && !oibles.has(tarjeta.episodioId ?? "") && tarjeta.href.startsWith("/ahora")}
              prontoTexto={locale === "en" ? "Soon" : "Pronto"}
            />
          ))}
        </EstanteFila>
      ))}
    </main>
  );
}
