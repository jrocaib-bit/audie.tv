"use client";

import { idiomaContenido, citaEnCurso, entrarReferencia, etiquetaCita, referenciasDe, segundoDeCita, volverReferencia, type MarcoEscucha, type ReferenciaCruzada } from "@audite/domain";
import dataset from "../../../../content/referencias/openbible.json";
import { useState } from "react";
import { useLibrary } from "@/components/library";

const lista = dataset.refs as ReferenciaCruzada[];
const nombres: Record<string, { es: string; en: string }> = {
  gn: { es: "Génesis", en: "Genesis" },
  jn: { es: "Juan", en: "John" },
  heb: { es: "Hebreos", en: "Hebrews" },
  is: { es: "Isaías", en: "Isaiah" },
  ap: { es: "Apocalipsis", en: "Revelation" },
  col: { es: "Colosenses", en: "Colossians" },
  sal: { es: "Salmos", en: "Psalms" },
  job: { es: "Job", en: "Job" },
  hch: { es: "Hechos", en: "Acts" },
  ex: { es: "Éxodo", en: "Exodus" },
  jr: { es: "Jeremías", en: "Jeremiah" },
  pr: { es: "Proverbios", en: "Proverbs" },
  ne: { es: "Nehemías", en: "Nehemiah" },
  zac: { es: "Zacarías", en: "Zechariah" },
  ro: { es: "Romanos", en: "Romans" },
};

export function ReferenciasPantalla() {
  const library = useLibrary();
  const locale = library.settings.uiLocale;
  const episode = library.catalog.episodes[0] ?? null;
  const fraccion = episode && episode.durationSeconds > 0 ? library.player.globalTime / episode.durationSeconds : 0;
  const enCurso = episode ? citaEnCurso(episode.scriptureRangeLabel, fraccion) : "1:1";
  const [cap, ver] = (enCurso ?? "1:1").split(":").map(Number);
  const relacionadas = referenciasDe(lista, { libroId: episode?.bookId ?? "gn", capitulo: cap || 1, versiculo: ver || 1 });
  const [pila, setPila] = useState<MarcoEscucha[]>([]);
  const es = locale === "es";

  function saltar(referencia: ReferenciaCruzada) {
    if (!episode) return;
    const cita = `${referencia.hacia.capitulo}:${referencia.hacia.versiculo}`;
    const segundo = referencia.hacia.libroId === episode.bookId ? segundoDeCita(episode.scriptureRangeLabel, cita, episode.durationSeconds) : null;
    if (segundo == null) return;
    setPila(entrarReferencia(pila, { episodeId: episode.id, segundo: library.player.globalTime, cita: enCurso ?? "1:1" }));
    library.playEpisode(episode.id);
    library.seek(segundo);
  }

  function volver() {
    const resultado = volverReferencia(pila);
    setPila(resultado.pila);
    if (resultado.marco && episode) {
      library.playEpisode(resultado.marco.episodeId);
      library.seek(resultado.marco.segundo);
    }
  }

  return (
    <main id="contenido" className="app-clear mx-auto w-full max-w-lg px-4 pt-4">
      <h1 className="font-display text-4xl leading-none">{es ? "Al margen" : "Margin"}</h1>
      <p className="font-display-regular mt-4 text-3xl">{es ? "Génesis" : "Genesis"} {enCurso ?? "1:1"}</p>
      <ul className="mt-3 space-y-2">
        {relacionadas.map((referencia) => {
          const nombre = nombres[referencia.hacia.libroId]?.[idiomaContenido(locale)] ?? referencia.hacia.libroId;
          const cita = `${referencia.hacia.capitulo}:${referencia.hacia.versiculo}`;
          const oible = Boolean(episode && referencia.hacia.libroId === episode.bookId && segundoDeCita(episode.scriptureRangeLabel, cita, episode.durationSeconds) != null);
          return (
            <li key={`${etiquetaCita(referencia.hacia, nombre)}-${referencia.orden}`} className="neo-card flex items-center justify-between gap-3 px-4 py-3">
              <span className="font-display text-xl leading-tight">{etiquetaCita(referencia.hacia, nombre)}</span>
              <button type="button" disabled={!oible} className="min-h-11 shrink-0 rounded-full bg-acento px-4 text-sm text-acento-ink disabled:bg-transparent disabled:text-muted" onClick={() => saltar(referencia)}>
                {oible ? (es ? "Oír" : "Hear") : (es ? "En preparación" : "In preparation")}
              </button>
            </li>
          );
        })}
      </ul>
      <button type="button" className="mt-4 inline-flex min-h-11 items-center text-sm text-acento disabled:text-muted" disabled={pila.length === 0} onClick={volver}>
        {es ? "Volver al pasaje anterior" : "Back to the previous passage"}{pila.length ? ` (${pila.length})` : ""}
      </button>
    </main>
  );
}
