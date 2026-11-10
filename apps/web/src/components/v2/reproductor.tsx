"use client";

import { idiomaContenido, PLAYBACK_RATES, SLEEP_CHOICES, CLAVE_MARCADORES, alternarFavorito, capituloDePrueba, citaEnCurso, esFavorito, etiquetaCita, formatClock, fundidoMs, metadatosReproduccion, nombreCorto, parseMarcadores, playableEpisodes, referenciasDe, segundoDeCita, siguienteEnCola, type ReferenciaCruzada, type SleepMinutes } from "@audite/domain";
import { obraDeEpisodio, obraWebp, rotuloObra } from "@audite/content/obras";
import dataset from "../../../../../content/referencias/openbible.json";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useLibrary } from "@/components/library";
import { Placa } from "@/components/placa";
import { colorDeObra } from "@/components/v2/fichas";
import { formatoNumero } from "@/lib/numeros";

const refs = dataset.refs as ReferenciaCruzada[];
const oyentesFavorito = new Set<() => void>();

function favoritoDe(id: string): boolean {
  if (typeof window === "undefined" || !id) return false;
  try {
    return esFavorito(parseMarcadores(JSON.parse(localStorage.getItem(CLAVE_MARCADORES) || "null") as unknown), id);
  } catch {
    return false;
  }
}

function alternar(id: string) {
  const actual = parseMarcadores(JSON.parse(localStorage.getItem(CLAVE_MARCADORES) || "null") as unknown);
  localStorage.setItem(CLAVE_MARCADORES, JSON.stringify(alternarFavorito(actual, id, new Date().toISOString())));
  oyentesFavorito.forEach((oyente) => oyente());
}

function IconoPlay({ pausa }: { pausa: boolean }) {
  return pausa ? (
    <svg viewBox="0 0 24 24" className="size-8" aria-hidden="true"><path fill="currentColor" d="M6 4h4v16H6zM14 4h4v16h-4z" /></svg>
  ) : (
    <svg viewBox="0 0 24 24" className="size-8" aria-hidden="true"><path fill="currentColor" d="M8 4.5v15l12-7.5z" /></svg>
  );
}

function IconoSalto({ atras }: { atras: boolean }) {
  return (
    <span className="relative inline-flex size-12 items-center justify-center">
      <svg viewBox="0 0 48 48" className="absolute size-12" aria-hidden="true">
        <path fill="none" stroke="currentColor" strokeWidth="1.6" d={atras ? "M30 12a14 14 0 1 1-4 22" : "M18 12a14 14 0 1 0 4 22"} />
        <path fill="currentColor" d={atras ? "M16 8 8 16l8 5z" : "M32 8 40 16l-8 5z"} />
      </svg>
      <span className="text-[11px] leading-none font-semibold">15</span>
    </span>
  );
}

function Icono({ nombre }: { nombre: "corazon" | "bajar" | "compartir" | "cola" | "reloj" }) {
  const caminos: Record<typeof nombre, string> = {
    corazon: "M12 19s-7-4.4-7-8.5A3.5 3.5 0 0 1 12 8a3.5 3.5 0 0 1 7 2.5C19 14.6 12 19 12 19z",
    bajar: "M12 4v10m0 0 4-4m-4 4-4-4M5 19h14",
    compartir: "M12 16V5m0 0 4 4m-4-4-4 4M6 19h12",
    cola: "M5 7h14M5 12h14M5 17h9",
    reloj: "M12 7v5l3 2",
  };
  return (
    <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true">
      {nombre === "reloj" ? <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.7" /> : null}
      <path fill={nombre === "corazon" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" d={caminos[nombre]} />
    </svg>
  );
}

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
  const relacionadas = referenciasDe(refs, { libroId: episode?.bookId ?? "gn", capitulo: cap || 1, versiculo: ver || 1 }).slice(0, 5);
  const lectura = capituloDePrueba(episode?.bookId ?? "gn", cap || 1, locale, undefined);
  const [sueno, setSueno] = useState<SleepMinutes | "fin" | null>(null);
  const [obraAbierta, setObraAbierta] = useState(false);
  const [hoja, setHoja] = useState<"velocidad" | "sueno" | "cola" | null>(null);
  const favorito = useSyncExternalStore((avisar) => { oyentesFavorito.add(avisar); return () => oyentesFavorito.delete(avisar); }, () => favoritoDe(episode?.id ?? ""), () => false);
  const estado = library.player.status;
  const cola = library.path.steps.map((paso) => paso.episodeId).join("|");
  const playEpisode = library.playEpisode;
  const reducir = library.reduceMotion;
  const oibles = library.catalog.episodes.map((item) => item.id).join("|");
  const siguiente = episode && sueno !== "fin" ? siguienteEnCola(cola.split("|").filter(Boolean), episode.id) : null;
  const fundido = estado === "ended" && Boolean(siguiente) && oibles.split("|").includes(siguiente ?? "");
  const origen = useRef(0);
  const pedidoAplicado = useRef("");
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("e");
    const marca = `${id ?? ""}:${params.get("t") ?? ""}`;
    if (!id || pedidoAplicado.current === marca) return;
    if (!library.catalog.episodes.some((item) => item.id === id)) return;
    pedidoAplicado.current = marca;
    const crudo = params.get("t");
    const segundo = crudo != null && crudo !== "" ? Number(crudo) : undefined;
    playEpisode(id, segundo != null, segundo != null && Number.isFinite(segundo) ? segundo : undefined);
  }, [library.catalog.episodes, playEpisode]);
  useEffect(() => {
    if (!fundido || !siguiente) return;
    const espera = window.setTimeout(() => playEpisode(siguiente, true), fundidoMs(reducir));
    return () => window.clearTimeout(espera);
  }, [fundido, playEpisode, reducir, siguiente]);
  const fondo = colorDeObra(obra);
  const oible = Boolean(episode);

  function tocar(accion: () => void) {
    if (!library.reduceMotion && typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(8);
    accion();
  }

  function subir(delta: number) {
    if (delta < 48) return;
    document.getElementById("letras")?.scrollIntoView({ behavior: library.reduceMotion ? "auto" : "smooth", block: "start" });
  }

  return (
    <main className="relative min-h-full text-[#F4ECE2]" style={{ background: "#100E0C" }}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[40rem]" style={{ background: `radial-gradient(90% 80% at 50% -10%, ${fondo} 0%, ${fondo}cc 32%, transparent 70%)` }} />
      <div className="relative flex min-h-dvh flex-col">
      <header className="flex items-center justify-between px-4 py-3">
        <Link href="/escuchar" aria-label={es ? "Cerrar" : "Close"} className="inline-flex size-11 items-center justify-center text-xl">↓</Link>
        <p className="kicker text-[#F4ECE2]/80">{es ? "Escuchando" : "Playing"}</p>
        <button type="button" aria-label={es ? "Letras" : "Lyrics"} className="inline-flex size-11 items-center justify-center text-xl" onClick={() => subir(80)}>↑</button>
      </header>
      <div
        className="relative mx-auto w-[min(100%,16.5rem)] px-2"
        onPointerDown={(event) => { origen.current = event.clientY; }}
        onPointerUp={(event) => subir(origen.current - event.clientY)}
      >
        <div className="overflow-hidden rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
          {obra ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={obraWebp(obra)} alt="" className={`aspect-square w-full object-cover transition-opacity duration-500 ${fundido ? "opacity-40" : "opacity-100"} ${library.reduceMotion ? "" : "obra-drift"}`} />
          ) : <div className="aspect-square bg-[#0C0B09]" />}
        </div>
      </div>
      <div className="relative mx-auto mt-auto w-full max-w-lg px-4 pt-4 pb-6">
        <h1 className="font-display text-[1.7rem] leading-tight">{titulo}</h1>
        <p className="font-display-regular mt-1 text-lg whitespace-nowrap text-[#E7D7C3]">{episode?.scriptureRangeLabel}</p>
        <label className="mt-4 block">
          <span className="sr-only">{es ? "Posición" : "Position"}</span>
          <input type="range" className="h-11 w-full accent-[#C9A96E]" min={0} max={duracion || 1} step={0.1} value={Math.min(tiempo, duracion || 1)} disabled={!oible} onChange={(event) => library.seek(Number(event.target.value))} />
        </label>
        <div className="flex justify-between text-xs tabular-nums text-[#B7AB9C]">
          <span>{formatClock(tiempo)}</span>
          <span>{formatClock(duracion)}</span>
        </div>
        <div className="mt-2 flex items-center justify-center gap-5">
          <button type="button" aria-label={es ? "Retroceder 15 segundos" : "Back 15 seconds"} className="inline-flex size-12 items-center justify-center" onClick={() => tocar(() => library.seekBy(-15))}><IconoSalto atras /></button>
          <button type="button" disabled={!oible} aria-label={sonando ? (es ? "Pausa" : "Pause") : (es ? "Oír" : "Play")} className="inline-flex size-[4.5rem] items-center justify-center rounded-full bg-[#F4ECE2] text-[#100E0C] disabled:opacity-40" onClick={() => tocar(() => episode && (sonando ? library.toggle() : library.playEpisode(episode.id)))}>
            <IconoPlay pausa={sonando} />
          </button>
          <button type="button" aria-label={es ? "Adelantar 15 segundos" : "Forward 15 seconds"} className="inline-flex size-12 items-center justify-center" onClick={() => tocar(() => library.seekBy(15))}><IconoSalto atras={false} /></button>
        </div>
        <div className="mt-4 flex items-center justify-between px-1">
          <button type="button" aria-label={es ? "Favorito" : "Favorite"} className={`inline-flex size-11 items-center justify-center ${favorito ? "text-[#C9A96E]" : ""}`} onClick={() => episode && tocar(() => alternar(episode.id))}><Icono nombre="corazon" /></button>
          <Link href="/descargas" aria-label={es ? "Descargar" : "Download"} className="inline-flex size-11 items-center justify-center"><Icono nombre="bajar" /></Link>
          <Link href={episode ? `/compartir?e=${episode.id}&t=${Math.floor(tiempo)}` : "/compartir"} aria-label={es ? "Compartir" : "Share"} className="inline-flex size-11 items-center justify-center"><Icono nombre="compartir" /></Link>
          <button type="button" aria-label={es ? "Cola" : "Queue"} className="inline-flex size-11 items-center justify-center" onClick={() => setHoja("cola")}><Icono nombre="cola" /></button>
        </div>
        <div className="mt-1 flex items-center justify-center gap-2">
          <button type="button" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/20 px-3 text-sm" onClick={() => setHoja("sueno")}><Icono nombre="reloj" />{sueno === "fin" ? (es ? "Fin" : "End") : sueno ? `${sueno} min` : (es ? "Sueño" : "Sleep")}</button>
          <button type="button" className="inline-flex min-h-11 items-center rounded-full border border-white/20 px-3 text-sm tabular-nums" onClick={() => setHoja("velocidad")}>{formatoNumero(locale, library.settings.rate)}×</button>
        </div>
      </div>
      </div>
        <section id="letras" className="relative mx-auto mt-2 w-full max-w-lg scroll-mt-6 px-4 pb-16">
          <h2 className="font-display text-2xl">{cita ?? episode?.scriptureRangeLabel}</h2>
          <ol className="mt-3 space-y-3">
            {lectura?.versiculos.map((versiculo) => (
              <li key={versiculo.versiculo} className={`font-display text-4xl leading-none ${cita === `${versiculo.capitulo}:${versiculo.versiculo}` ? "text-[#F4ECE2]" : "text-[#B7AB9C]"}`}>
                {versiculo.marca === "ficticio" ? versiculo.versiculo : versiculo.texto}
              </li>
            ))}
          </ol>
        </section>
        <section className="mx-auto mt-8 w-full max-w-lg px-4">
          <h2 className="font-display text-2xl">{es ? "Al margen" : "Margin"}</h2>
          <ul className="mt-3 space-y-2">
            {relacionadas.map((referencia) => {
              const citaDestino = `${referencia.hacia.capitulo}:${referencia.hacia.versiculo}`;
              const nombre = referencia.hacia.libroId === "ap" ? (es ? "Apocalipsis" : "Revelation") : referencia.hacia.libroId === "jn" ? (es ? "Juan" : "John") : referencia.hacia.libroId === "heb" ? (es ? "Hebreos" : "Hebrews") : referencia.hacia.libroId === "is" ? (es ? "Isaías" : "Isaiah") : (es ? "Génesis" : "Genesis");
              const dentro = Boolean(episode && referencia.hacia.libroId === episode.bookId && segundoDeCita(episode.scriptureRangeLabel, citaDestino, duracion) != null);
              return (
                <li key={`${referencia.orden}-${citaDestino}`}>
                  <button type="button" className="flex min-h-14 w-full items-center justify-between gap-3 rounded-2xl bg-white/10 px-3 text-left" onClick={() => {
                    if (!episode || !dentro) return;
                    const segundo = segundoDeCita(episode.scriptureRangeLabel, citaDestino, duracion);
                    if (segundo != null) library.seek(segundo);
                  }}>
                    <span className="font-display min-w-0 text-[clamp(0.95rem,4.2vw,1.35rem)] leading-none whitespace-nowrap">{etiquetaCita(referencia.hacia, nombre)}</span>
                    {dentro ? null : <span className="shrink-0 text-xs text-[#B7AB9C]">{es ? "Pronto" : "Soon"}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
        {obra ? (
          <section className="mx-auto mt-8 w-full max-w-lg px-4">
            <button type="button" className="flex w-full items-center justify-between gap-3 text-left" onClick={() => setObraAbierta((valor) => !valor)}>
              <span>
                <span className="font-display block text-2xl">{es ? "Sobre la obra" : "About the art"}</span>
                <span className="mt-1 block text-sm text-[#B7AB9C]">{obra.titulo[idiomaContenido(locale)]}</span>
              </span>
              <span className="text-sm text-[#C9A96E]">{obraAbierta ? "–" : "+"}</span>
            </button>
            {obraAbierta ? <div className="mt-3"><Placa obra={obra} lang={locale} /></div> : null}
          </section>
        ) : null}
        <p className="sr-only">{metadatosReproduccion({ titulo, libro: episode?.scriptureRangeLabel ?? "", caratula: obra ? obraWebp(obra) : null, duracion, posicion: tiempo, velocidad: library.settings.rate }).artista}</p>
      {hoja ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/50" onClick={() => setHoja(null)}>
          <div className="w-full rounded-t-3xl bg-[#1B1815] px-4 pt-3 pb-8 text-[#F4ECE2]" onClick={(event) => event.stopPropagation()}>
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/30" />
            {hoja === "velocidad" ? (
              <div className="flex flex-wrap gap-2">
                {PLAYBACK_RATES.map((rate) => (
                  <button key={rate} type="button" className={`min-h-11 rounded-full px-4 tabular-nums ${library.settings.rate === rate ? "bg-[#C9A96E] text-[#100E0C]" : "border border-white/20"}`} onClick={() => { library.setRate(rate); setHoja(null); }}>
                    {formatoNumero(locale, rate)}×
                  </button>
                ))}
              </div>
            ) : null}
            {hoja === "sueno" ? (
              <div className="flex flex-wrap gap-2">
                {SLEEP_CHOICES.map((minutos) => (
                  <button key={minutos} type="button" className={`min-h-11 rounded-full px-4 ${sueno === minutos ? "bg-[#C9A96E] text-[#100E0C]" : "border border-white/20"}`} onClick={() => { setSueno(minutos); library.setSleep(minutos); setHoja(null); }}>
                    {minutos} min
                  </button>
                ))}
                <button type="button" className={`min-h-11 rounded-full px-4 ${sueno === "fin" ? "bg-[#C9A96E] text-[#100E0C]" : "border border-white/20"}`} onClick={() => { setSueno("fin"); library.setSleep(null); setHoja(null); }}>
                  {es ? "Fin del capítulo" : "End of chapter"}
                </button>
              </div>
            ) : null}
            {hoja === "cola" ? (
              <ol className="space-y-2">
                <li className="font-display text-2xl">{es ? "A continuación" : "Up next"}</li>
                {library.path.steps.length === 0 ? <li className="text-sm text-[#B7AB9C]">{es ? "Pronto" : "Soon"}</li> : null}
                {library.path.steps.map((paso, indice) => {
                  const item = library.catalog.episodes.find((episodio) => episodio.id === paso.episodeId);
                  return <li key={paso.episodeId} className="flex min-h-12 items-center">{indice + 1}. {item ? nombreCorto(item, locale) : (es ? "Pronto" : "Soon")}</li>;
                })}
              </ol>
            ) : null}
          </div>
        </div>
      ) : null}
    </main>
  );
}
