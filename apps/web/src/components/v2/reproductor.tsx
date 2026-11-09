"use client";

import { PLAYBACK_RATES, SLEEP_CHOICES, capituloDePrueba, citaEnCurso, etiquetaCita, formatClock, fundidoMs, metadatosReproduccion, nombreCorto, playableEpisodes, referenciasDe, segundoDeCita, siguienteEnCola, type ReferenciaCruzada, type SleepMinutes } from "@audite/domain";
import { obraDeEpisodio, obraWebp, rotuloObra } from "@audite/content/obras";
import dataset from "../../../../../content/referencias/openbible.json";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useLibrary } from "@/components/library";
import { Placa } from "@/components/placa";
import { formatoNumero } from "@/lib/numeros";

const refs = dataset.refs as ReferenciaCruzada[];
const COLORES: Record<string, string> = {
  "gn-01": "#1C3328",
  "gn-02": "#3A2418",
  "gn-05": "#3A2A18",
};

export function ReproductorV2() {
  const library = useLibrary();
  const locale = library.settings.uiLocale;
  const es = locale === "es";
  const pedido = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("e") : null;
  const episode = library.catalog.episodes.find((item) => item.id === (library.player.episodeId || pedido)) ?? playableEpisodes(library.catalog)[0] ?? null;
  const obra = obraDeEpisodio(episode?.id ?? "gn-01");
  const titulo = episode ? nombreCorto(episode, locale) : obra ? rotuloObra(obra, locale) : "Audite";
  const duracion = episode?.durationSeconds ?? 0;
  const tiempo = library.player.episodeId === episode?.id ? library.player.globalTime : 0;
  const sonando = library.player.status === "playing";
  const fraccion = duracion > 0 ? tiempo / duracion : 0;
  const cita = episode ? citaEnCurso(episode.scriptureRangeLabel, fraccion) : null;
  const [cap, ver] = (cita ?? "1:1").split(":").map(Number);
  const relacionadas = referenciasDe(refs, { libroId: episode?.bookId ?? "gn", capitulo: cap || 1, versiculo: ver || 1 }).slice(0, 4);
  const lectura = capituloDePrueba(episode?.bookId ?? "gn", cap || 1, locale, undefined);
  const [sueno, setSueno] = useState<SleepMinutes | "fin" | null>(null);
  const [obraAbierta, setObraAbierta] = useState(false);
  const [fundido, setFundido] = useState(false);
  const estado = library.player.status;
  const cola = library.path.steps.map((paso) => paso.episodeId).join("|");
  const playEpisode = library.playEpisode;
  const reducir = library.reduceMotion;
  const oibles = library.catalog.episodes.map((item) => item.id).join("|");
  useEffect(() => {
    if (estado !== "ended" || !episode || sueno === "fin") return;
    const siguiente = siguienteEnCola(cola.split("|").filter(Boolean), episode.id);
    if (!siguiente || !oibles.split("|").includes(siguiente)) return;
    setFundido(true);
    const espera = window.setTimeout(() => {
      playEpisode(siguiente, true);
      setFundido(false);
    }, fundidoMs(reducir));
    return () => window.clearTimeout(espera);
  }, [cola, episode, estado, oibles, playEpisode, reducir, sueno]);
  const fondo = COLORES[episode?.id ?? "gn-01"] ?? "#241C16";
  const oible = Boolean(episode);

  function tocar(accion: () => void) {
    if (!library.reduceMotion && typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(8);
    accion();
  }

  return (
    <main className="min-h-full text-[#F4ECE2]" style={{ background: `linear-gradient(180deg, ${fondo} 0%, #100E0C 46%)` }}>
      <header className="flex items-center justify-between px-4 py-3">
        <Link href="/escuchar" className="inline-flex min-h-11 items-center text-sm">↓</Link>
        <p className="kicker text-[#C9A96E]">{es ? "Escuchando" : "Playing"}</p>
        <Link href={episode ? `/compartir?e=${episode.id}&t=${Math.floor(tiempo)}` : "/compartir"} aria-label={es ? "Compartir" : "Share"} className="inline-flex size-11 items-center justify-center">↑</Link>
      </header>
      <div className="mx-auto w-[min(100%,22rem)] px-6">
        <div className="overflow-hidden rounded-2xl shadow-2xl">
          {obra ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={obraWebp(obra)} alt="" className={`aspect-square w-full object-cover transition-opacity duration-500 ${fundido ? "opacity-40" : "opacity-100"} ${library.reduceMotion ? "" : "obra-drift"}`} />
          ) : <div className="aspect-square bg-[#0C0B09]" />}
        </div>
      </div>
      <div className="mx-auto w-full max-w-lg px-4 pt-5 pb-16">
        <h1 className="font-display text-[1.7rem] leading-tight">{titulo}</h1>
        <p className="font-display-regular mt-1 truncate text-lg text-[#E7D7C3]">{episode?.scriptureRangeLabel}</p>
        <label className="mt-4 block">
          <span className="sr-only">{es ? "Posición" : "Position"}</span>
          <input type="range" className="h-11 w-full accent-[#C9A96E]" min={0} max={duracion || 1} step={0.1} value={Math.min(tiempo, duracion || 1)} disabled={!oible} onChange={(event) => library.seek(Number(event.target.value))} />
        </label>
        <div className="flex justify-between text-xs tabular-nums text-[#B7AB9C]">
          <span>{formatClock(tiempo)}</span>
          <span>{formatClock(duracion)}</span>
        </div>
        <div className="mt-2 flex items-center justify-center gap-3">
          <button type="button" className="inline-flex size-12 items-center justify-center rounded-full border border-white/20" onClick={() => tocar(() => library.seekBy(-15))}>−15</button>
          <button type="button" disabled={!oible} className="inline-flex size-16 items-center justify-center rounded-full bg-[#F4ECE2] text-lg text-[#100E0C] disabled:opacity-40" onClick={() => tocar(() => episode && (sonando ? library.toggle() : library.playEpisode(episode.id)))}>
            {sonando ? (es ? "Pausa" : "Pause") : (es ? "Oír" : "Play")}
          </button>
          <button type="button" className="inline-flex size-12 items-center justify-center rounded-full border border-white/20" onClick={() => tocar(() => library.seekBy(15))}>+15</button>
        </div>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {PLAYBACK_RATES.map((rate) => (
            <button key={rate} type="button" className={`min-h-11 rounded-full px-3 text-sm tabular-nums ${library.settings.rate === rate ? "bg-[#C9A96E] text-[#100E0C]" : "border border-white/20"}`} onClick={() => library.setRate(rate)}>
              {formatoNumero(locale, rate)}×
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {SLEEP_CHOICES.map((minutos) => (
            <button key={minutos} type="button" className={`min-h-11 rounded-full px-3 text-sm ${sueno === minutos ? "bg-[#C9A96E] text-[#100E0C]" : "border border-white/15"}`} onClick={() => { setSueno(minutos); library.setSleep(minutos); }}>
              {minutos}
            </button>
          ))}
          <button type="button" className={`min-h-11 rounded-full px-3 text-sm ${sueno === "fin" ? "bg-[#C9A96E] text-[#100E0C]" : "border border-white/15"}`} onClick={() => { setSueno("fin"); library.setSleep(null); }}>
            {es ? "Fin del capítulo" : "End of chapter"}
          </button>
        </div>
        <section className="mt-8">
          <h2 className="font-display text-2xl">{cita ?? episode?.scriptureRangeLabel}</h2>
          <ol className="mt-3 space-y-2">
            {lectura?.versiculos.map((versiculo) => (
              <li key={versiculo.versiculo} className={`rounded-xl px-2 py-1 ${cita === `${versiculo.capitulo}:${versiculo.versiculo}` ? "bg-white/10" : "text-[#B7AB9C]"}`}>
                <span className="mr-2 text-[#C9A96E]">{versiculo.versiculo}</span>{versiculo.texto}
              </li>
            ))}
          </ol>
        </section>
        <section className="mt-8">
          <h2 className="font-display text-2xl">{es ? "Al margen" : "Margin"}</h2>
          <ul className="mt-3 space-y-2">
            {relacionadas.map((referencia) => {
              const citaDestino = `${referencia.hacia.capitulo}:${referencia.hacia.versiculo}`;
              const nombre = referencia.hacia.libroId === "ap" ? (es ? "Apocalipsis" : "Revelation") : referencia.hacia.libroId === "jn" ? (es ? "Juan" : "John") : referencia.hacia.libroId === "heb" ? (es ? "Hebreos" : "Hebrews") : referencia.hacia.libroId === "is" ? (es ? "Isaías" : "Isaiah") : (es ? "Génesis" : "Genesis");
              const dentro = Boolean(episode && referencia.hacia.libroId === episode.bookId && segundoDeCita(episode.scriptureRangeLabel, citaDestino, duracion) != null);
              return (
                <li key={referencia.orden}>
                  <button type="button" className="flex min-h-14 w-full items-center justify-between gap-3 rounded-2xl bg-white/5 px-3 text-left" onClick={() => {
                    if (!episode || !dentro) return;
                    const segundo = segundoDeCita(episode.scriptureRangeLabel, citaDestino, duracion);
                    if (segundo != null) library.seek(segundo);
                  }}>
                    <span className="font-display truncate text-[clamp(1.05rem,4.6vw,1.45rem)] leading-none whitespace-nowrap">{etiquetaCita(referencia.hacia, nombre)}</span>
                    {dentro ? null : <span className="shrink-0 text-xs text-[#B7AB9C]">{es ? "Pronto" : "Soon"}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
        {obra ? (
          <section className="mt-8">
            <button type="button" className="flex w-full items-center justify-between gap-3 text-left" onClick={() => setObraAbierta((valor) => !valor)}>
              <span>
                <span className="font-display block text-2xl">{es ? "Sobre la obra" : "About the art"}</span>
                <span className="mt-1 block text-sm text-[#B7AB9C]">{obra.titulo[locale]}</span>
              </span>
              <span className="text-sm text-[#C9A96E]">{obraAbierta ? "–" : "+"}</span>
            </button>
            {obraAbierta ? <div className="mt-3"><Placa obra={obra} lang={locale} /></div> : null}
          </section>
        ) : null}
        <section className="mt-8">
          <h2 className="font-display text-2xl">{es ? "A continuación" : "Up next"}</h2>
          <ol className="mt-3 space-y-2">
            {library.path.steps.map((paso, indice) => (
              <li key={paso.episodeId} className="flex min-h-12 items-center justify-between gap-3">
                <span className="truncate">{indice + 1}. {paso.episodeId}</span>
              </li>
            ))}
          </ol>
        </section>
        <p className="sr-only">{metadatosReproduccion({ titulo, libro: episode?.scriptureRangeLabel ?? "", caratula: obra ? obraWebp(obra) : null, duracion, posicion: tiempo, velocidad: library.settings.rate }).artista}</p>
      </div>
    </main>
  );
}
