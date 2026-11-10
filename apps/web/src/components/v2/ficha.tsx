"use client";

import { PERSONAJES, TEMAS, playableEpisodes } from "@audite/domain";
import Link from "next/link";
import { useLibrary } from "@/components/library";
import { Arte, Candado } from "@/components/v2/fichas";

export function FichaV2({ tipo, id, filas = [] }: { tipo: "libro" | "tema" | "personaje"; id: string; filas?: { id: string; etiqueta: string }[] }) {
  const { catalog, settings } = useLibrary();
  const locale = settings.uiLocale;
  const es = locale === "es";
  const tema = TEMAS.find((item) => item.id === id);
  const persona = PERSONAJES.find((item) => item.id === id);
  const libroId = tipo === "libro" ? id : tema?.libroId ?? persona?.libroId ?? id;
  const libro = catalog.books.find((item) => item.id === libroId);
  const titulo = tipo === "tema" ? tema?.titulo[locale] : tipo === "personaje" ? persona?.titulo[locale] : libro?.name[locale] || libro?.name.es || id;
  const color = tema?.color ?? persona?.color ?? "#1B1815";
  const episodios = filas.length > 0 ? filas : catalog.pendientes.filter((episodio) => episodio.bookId === libroId).map((episodio) => ({ id: episodio.id, etiqueta: episodio.etiqueta?.[locale] || episodio.capitulos || episodio.id }));
  const oibles = new Set(playableEpisodes(catalog).map((episodio) => episodio.id));
  const aleatorio = libroId === "sal" || libroId === "prov";
  const destino = [...oibles].find((episodio) => episodio.startsWith(`${libroId}-`));

  return (
    <main id="contenido" className="app-clear">
      <div className="relative h-64 overflow-hidden" style={{ background: color }}>
        <Arte episodioId={`${libroId}-01`} className="h-full w-full opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        <h1 className="font-display absolute right-4 bottom-4 left-4 text-[clamp(2.1rem,10vw,3.25rem)] leading-none whitespace-nowrap">{titulo}</h1>
      </div>
      <div className="flex items-center gap-3 px-4 py-4">
        {destino ? (
          <Link href={`/ahora?e=${destino}`} aria-label={es ? "Oír" : "Play"} className="inline-flex size-14 items-center justify-center rounded-full bg-acento text-acento-ink">
            <svg viewBox="0 0 24 24" className="size-7" aria-hidden="true"><path fill="currentColor" d="M8 4.5v15l12-7.5z" /></svg>
          </Link>
        ) : <span className="inline-flex size-14 items-center justify-center rounded-full border border-border"><Candado /></span>}
        {aleatorio && destino ? (
          <Link href={`/ahora?e=${destino}&azar=1`} aria-label={es ? "Aleatorio" : "Shuffle"} className="inline-flex size-11 items-center justify-center rounded-full border border-border">
            <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true"><path fill="none" stroke="currentColor" strokeWidth="1.7" d="M4 7h3l4 10h3m6 0-2.5-3M4 17h3l2-5m9-5 2.5 3L20 7" /></svg>
          </Link>
        ) : null}
      </div>
      <ul className="px-4">
        {(episodios.length > 0 ? episodios : catalog.books.filter((item) => item.id === libroId)).slice(0, 12).map((item) => {
          const episodeId = "id" in item && String(item.id).includes("-") ? String(item.id) : `${libroId}-01`;
          const etiqueta = "etiqueta" in item && typeof item.etiqueta === "string" ? item.etiqueta : titulo;
          const listo = oibles.has(episodeId);
          return (
            <li key={episodeId} className="flex min-h-14 items-center justify-between gap-3 border-b border-border">
              <Link href={listo ? `/ahora?e=${episodeId}` : `/libro/${libroId}`} className="font-display min-w-0 truncate text-xl">{etiqueta}</Link>
              {listo ? null : <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted"><Candado />{es ? "Pronto" : "Soon"}</span>}
            </li>
          );
        })}
      </ul>
    </main>
  );
}
