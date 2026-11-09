"use client";

import { booksOnTheWay, creditoVisible, episodiosDeLibro, rotuloEpisodio, t, type AppCatalog, type PendingEpisode, type UiLocale } from "@audite/domain";
import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";

export function ListaPorLibros({
  catalog,
  locale,
  diferir = false,
  neo = false,
  consulta = "",
  filtroTestamento = "todos",
  estado = "todos",
}: {
  catalog: AppCatalog;
  locale: UiLocale;
  diferir?: boolean;
  neo?: boolean;
  consulta?: string;
  filtroTestamento?: "todos" | "ot" | "nt";
  estado?: "todos" | "preparacion" | "revision" | "propuesto";
}) {
  const libros = useMemo(() => booksOnTheWay(catalog.books), [catalog.books]);
  const inicial = libros.some((libro) => libro.id === "gn") ? "gn" : libros[0]?.id ?? "";
  const [abierto, setAbierto] = useState(inicial);
  const [remotos, setRemotos] = useState<{ libro: string; episodios: PendingEpisode[] } | null>(null);
  useEffect(() => {
    if (catalog.pendientes.some((episodio) => episodio.bookId === abierto)) return;
    let cancelado = false;
    void fetch(`/api/libro/${abierto}`)
      .then((respuesta) => (respuesta.ok ? respuesta.json() : null))
      .then((dato: { episodios?: PendingEpisode[] } | null) => {
        if (!cancelado) setRemotos({ libro: abierto, episodios: dato?.episodios ?? [] });
      })
      .catch(() => {
        if (!cancelado) setRemotos({ libro: abierto, episodios: [] });
      });
    return () => {
      cancelado = true;
    };
  }, [abierto, catalog.pendientes]);
  const episodios = useMemo(() => {
    const locales = episodiosDeLibro(catalog.pendientes, abierto);
    const base = locales.length > 0 ? locales : remotos?.libro === abierto ? remotos.episodios : [];
    const q = consulta.trim().toLowerCase();
    return base.filter((episodio) => {
      if (estado === "revision" && episodio.presentacion !== "revision") return false;
      if (estado === "preparacion" && (episodio.presentacion === "revision" || episodio.propuesta)) return false;
      if (estado === "propuesto" && !episodio.propuesta) return false;
      if (!q) return true;
      const texto = `${episodio.id} ${episodio.capitulos ?? ""} ${episodio.titulo?.es ?? ""} ${episodio.titulo?.en ?? ""} ${episodio.etiqueta?.es ?? ""}`.toLowerCase();
      return texto.includes(q);
    });
  }, [abierto, catalog.pendientes, consulta, estado, remotos]);
  const fuente = catalog.fuenteTexto[locale];
  const mostrarLista = useSyncExternalStore(
    () => () => {},
    () => true,
    () => !diferir,
  );

  return (
    <div>
      <p className="text-sm text-muted">
        {creditoVisible(fuente, t(locale, "sourceLabel"), t(locale, "sourcePending"))}
      </p>
      {mostrarLista ? <div className={neo ? "mt-2" : "mt-8 grid gap-8 lg:grid-cols-[16rem_1fr]"}>
        <div>
          {(["ot", "nt"] as const).map((testamento) => filtroTestamento !== "todos" && filtroTestamento !== testamento ? null : (
            <section key={testamento} className="mb-6">
              <p className="kicker text-muted">{testamento === "ot" ? t(locale, "testamentOt") : t(locale, "testamentNt")}</p>
              <ul className={neo ? "mt-2 flex flex-wrap gap-1.5" : "mt-2 flex gap-1 overflow-x-auto pb-2 lg:block lg:overflow-visible"}>
                {libros
                  .filter((libro) => libro.testament === testamento)
                  .map((libro) => {
                    const activo = libro.id === abierto;
                    return (
                      <li key={libro.id} className={neo ? "" : "shrink-0 lg:shrink"}>
                        <button
                          type="button"
                          aria-expanded={activo}
                          onClick={() => setAbierto(libro.id)}
                          className={`flex min-h-11 items-center gap-3 whitespace-nowrap px-2 py-2 text-left ${neo ? "neo-chip max-w-full" : "border-b border-border lg:w-full lg:justify-between lg:px-0"} ${activo ? "text-foreground" : "text-muted"}`}
                        >
                          <span className={neo ? "text-sm" : "font-serif text-xl"}>{libro.name[locale] || libro.name.es}</span>
                          {libro.deuterocanonico ? <span className="text-[11px] uppercase tracking-wide">{locale === "en" ? "Deuterocanon" : "Deuterocanónico"}</span> : null}
                        </button>
                      </li>
                    );
                  })}
              </ul>
            </section>
          ))}
        </div>
        <div>
          <h2 className="font-display text-3xl leading-none">{libros.find((libro) => libro.id === abierto)?.name[locale]}</h2>
          <ul className="mt-4 max-h-[32rem] space-y-3 overflow-y-auto pr-1">
          {episodios.map((episodio) => (
            <li key={episodio.id} className={neo ? "flex min-h-14 items-center justify-between gap-3 border-b border-border py-2" : "border border-border bg-card px-4 py-4"}>
              {episodio.propuesta && !neo ? <p className="text-xs uppercase tracking-[0.16em] text-muted">{t(locale, "statusProposed")}</p> : null}
              {neo ? (
                <>
                  <Link href={`/${locale}/catalogo/${episodio.id}`} className="font-display block min-w-0 flex-1 truncate text-lg leading-tight">
                    {rotuloEpisodio(episodio, locale) ?? t(locale, "comingSoon")}
                  </Link>
                  <p className="shrink-0 text-right text-xs text-muted">
                    <span className="block">{episodio.capitulos ?? episodio.rango ?? ""}</span>
                    <span className="block">{episodio.presentacion === "revision" ? t(locale, "statusReview") : episodio.propuesta ? t(locale, "statusProposed") : t(locale, "statusPreparing")}</span>
                  </p>
                </>
              ) : (
                <>
                  <Link href={`/${locale}/catalogo/${episodio.id}`} className="font-display block min-h-11 text-3xl leading-tight">
                    {rotuloEpisodio(episodio, locale) ?? t(locale, "comingSoon")}
                  </Link>
                  <p className="mt-1 text-sm text-muted">
                    {episodio.capitulos ?? episodio.rango ?? ""}
                    {episodio.capitulos || episodio.rango ? " · " : ""}
                    {episodio.presentacion === "revision" ? t(locale, "statusReview") : t(locale, "statusPreparing")}
                  </p>
                </>
              )}
            </li>
          ))}
          </ul>
        </div>
      </div> : null}
    </div>
  );
}
