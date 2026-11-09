"use client";

import { esFavorito, parseMarcadores, CLAVE_MARCADORES } from "@audite/domain";
import Link from "next/link";
import { useSyncExternalStore, useState } from "react";
import { useLibrary } from "@/components/library";
import { TarjetaCuadro } from "@/components/v2/fichas";

const marcadoresVacios = parseMarcadores(null);
let marcadoresCache = marcadoresVacios;
let marcadoresLeidos = false;
function leerMarcadores() {
  if (!marcadoresLeidos && typeof localStorage !== "undefined") {
    marcadoresLeidos = true;
    try {
      marcadoresCache = parseMarcadores(JSON.parse(localStorage.getItem(CLAVE_MARCADORES) || "null") as unknown);
    } catch {
      marcadoresCache = marcadoresVacios;
    }
  }
  return marcadoresCache;
}
const filtros = [
  { id: "todo", es: "Todo", en: "All" },
  { id: "pasajes", es: "Mis pasajes", en: "My passages" },
  { id: "favoritos", es: "Favoritos", en: "Favorites" },
  { id: "descargas", es: "Descargas", en: "Downloads" },
  { id: "notas", es: "Notas", en: "Notes" },
  { id: "caminos", es: "Caminos", en: "Paths" },
] as const;

export function BibliotecaV2() {
  const library = useLibrary();
  const locale = library.settings.uiLocale;
  const es = locale === "es";
  const [filtro, setFiltro] = useState<(typeof filtros)[number]["id"]>("todo");
  const [rejilla, setRejilla] = useState(true);
  const marcadores = useSyncExternalStore(() => () => {}, leerMarcadores, () => marcadoresVacios);
  const caminos = library.path.steps;
  const favoritos = library.catalog.books.filter((libro) => esFavorito(marcadores, `${libro.id}-01`) || marcadores.favoritos.some((favorito) => favorito.episodeId.startsWith(`${libro.id}-`)));
  const visible = filtro === "notas" || filtro === "descargas" || filtro === "pasajes" ? [] : filtro === "favoritos" ? favoritos : filtro === "caminos" ? [] : library.catalog.books.slice(0, 18);

  return (
    <main id="contenido" className="app-clear px-4 pt-4">
      <div className="flex items-end justify-between gap-3">
        <h1 className="font-display text-4xl leading-none">{es ? "Tu biblioteca" : "Your library"}</h1>
        <button type="button" className="min-h-11 text-sm" onClick={() => setRejilla((valor) => !valor)}>{rejilla ? (es ? "Lista" : "List") : (es ? "Rejilla" : "Grid")}</button>
      </div>
      <div className="estante mt-4 flex gap-2 overflow-x-auto">
        {filtros.map((item) => (
          <button key={item.id} type="button" className={`neo-chip shrink-0 ${filtro === item.id ? "bg-acento text-acento-ink" : ""}`} onClick={() => setFiltro(item.id)}>{es ? item.es : item.en}</button>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Link href="/listas" className="neo-card flex min-h-20 items-end p-3 font-display text-xl">{es ? "Mis pasajes" : "My passages"}</Link>
        <Link href="/descargas" className="neo-card flex min-h-20 items-end p-3 font-display text-xl">{es ? "Descargas" : "Downloads"}</Link>
        <Link href="/notas" className="neo-card flex min-h-20 items-end p-3 font-display text-xl">{es ? "Notas" : "Notes"}</Link>
        <Link href="/camino" className="neo-card flex min-h-20 items-end p-3 font-display text-xl">{es ? "Caminos" : "Paths"}</Link>
      </div>
      {filtro === "notas" ? <p className="mt-4 text-sm">{marcadores.notas.length}</p> : null}
      {rejilla ? (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {(filtro === "caminos" ? caminos.map((paso) => library.catalog.books.find((libro) => paso.episodeId.startsWith(`${libro.id}-`))).filter((libro): libro is NonNullable<typeof libro> => Boolean(libro)) : visible).map((libro) => (
            <TarjetaCuadro key={libro.id} href={`/libro/${libro.id}`} episodioId={`${libro.id}-01`} titulo={libro.name[locale] || libro.name.es} pronto={!library.catalog.episodes.some((episodio) => episodio.bookId === libro.id)} prontoTexto={es ? "Pronto" : "Soon"} />
          ))}
        </div>
      ) : (
        <ul className="mt-4">
          {visible.map((libro) => (
            <li key={libro.id}><Link href={`/libro/${libro.id}`} className="flex min-h-12 items-center justify-between border-b border-border"><span className="font-display text-xl">{libro.name[locale] || libro.name.es}</span></Link></li>
          ))}
        </ul>
      )}
    </main>
  );
}
