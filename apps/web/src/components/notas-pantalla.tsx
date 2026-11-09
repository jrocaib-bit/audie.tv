"use client";

import { CLAVE_MARCADORES, agregarNota, alternarFavorito, borrarNota, esFavorito, marcadoresVacios, parseMarcadores, type Marcadores } from "@audite/domain";
import { useSyncExternalStore, useState } from "react";
import { useLibrary } from "@/components/library";
import { formatoNumero } from "@/lib/numeros";

const servidor = marcadoresVacios();
let marcadores = servidor;
let hidratado = false;
const oyentes = new Set<() => void>();

function leer(): Marcadores {
  if (!hidratado && typeof localStorage !== "undefined") {
    hidratado = true;
    try {
      marcadores = parseMarcadores(JSON.parse(localStorage.getItem(CLAVE_MARCADORES) || "null") as unknown);
    } catch {
      marcadores = marcadoresVacios();
    }
  }
  return marcadores;
}

function publicar(siguiente: Marcadores) {
  marcadores = siguiente;
  localStorage.setItem(CLAVE_MARCADORES, JSON.stringify(siguiente));
  oyentes.forEach((oyente) => oyente());
}

export function NotasPantalla() {
  const library = useLibrary();
  const locale = library.settings.uiLocale;
  const actual = useSyncExternalStore(
    (avisar) => {
      oyentes.add(avisar);
      return () => oyentes.delete(avisar);
    },
    leer,
    () => servidor,
  );
  const episodio = library.player.episodeId || library.catalog.episodes[0]?.id || "gn-01";
  const [versiculo, setVersiculo] = useState("1:1");
  const [texto, setTexto] = useState("");
  const es = locale === "es";
  const favorito = esFavorito(actual, episodio);

  function anotar() {
    const siguiente = agregarNota(actual, {
      episodeId: episodio,
      versiculo,
      texto,
      segundo: library.player.globalTime > 0 ? library.player.globalTime : null,
    }, new Date().toISOString());
    if (!siguiente) return;
    publicar(siguiente);
    setTexto("");
  }

  return (
    <main id="contenido" className="app-clear mx-auto w-full max-w-lg px-4 pt-4">
      <h1 className="font-display text-4xl leading-none">{es ? "Notas" : "Notes"}</h1>
      <p className="mt-3 text-sm text-muted">{es ? "Se quedan en este dispositivo. No hay cuenta." : "They stay on this device. There is no account."}</p>
      <section className="neo-card mt-4 p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="font-display text-2xl leading-none">{episodio}</p>
          <button type="button" className={`min-h-11 rounded-full px-4 text-sm ${favorito ? "bg-acento text-acento-ink" : "border border-border"}`} onClick={() => publicar(alternarFavorito(actual, episodio, new Date().toISOString()))}>
            {favorito ? (es ? "Favorito" : "Saved") : (es ? "Marcar" : "Save")}
          </button>
        </div>
        <label className="mt-3 block text-sm">
          {es ? "Versículo" : "Verse"}
          <input className="neo-card mt-1 min-h-11 w-full bg-transparent px-3" value={versiculo} onChange={(event) => setVersiculo(event.target.value)} />
        </label>
        <label className="mt-3 block text-sm">
          {es ? "Nota" : "Note"}
          <textarea className="neo-card mt-1 min-h-24 w-full bg-transparent px-3 py-2" value={texto} onChange={(event) => setTexto(event.target.value)} />
        </label>
        <button type="button" className="mt-3 inline-flex min-h-11 items-center rounded-2xl bg-acento px-4 text-sm text-acento-ink" onClick={anotar}>
          {es ? "Guardar en este punto" : "Save at this point"}
        </button>
      </section>
      <ul className="mt-3 space-y-3">
        {actual.notas.length === 0 ? <li className="text-sm text-muted">{es ? "Todavía no hay notas." : "No notes yet."}</li> : null}
        {actual.notas.map((nota) => (
          <li key={nota.id} className="neo-card p-4">
            <p className="kicker text-muted">{nota.versiculo ?? nota.episodeId}</p>
            <p className="mt-2">{nota.texto}</p>
            <div className="mt-3 flex items-center justify-between gap-3">
              <button
                type="button"
                className="min-h-11 text-sm text-acento"
                disabled={nota.segundo == null}
                onClick={() => {
                  if (nota.segundo == null) return;
                  library.playEpisode(nota.episodeId);
                  library.seek(nota.segundo);
                }}
              >
                {nota.segundo == null ? (es ? "Sin marca de tiempo" : "No timestamp") : (es ? `Volver a ${formatoNumero(locale, nota.segundo, 0)} s` : `Back to ${formatoNumero(locale, nota.segundo, 0)} s`)}
              </button>
              <button type="button" className="min-h-11 text-sm" onClick={() => publicar(borrarNota(actual, nota.id))}>{es ? "Borrar" : "Delete"}</button>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
