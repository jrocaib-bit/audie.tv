"use client";

import { SALTO_SEGUNDOS, citaEnCurso, formatClock, metadatosReproduccion, nombreCorto, PLAYBACK_RATES, t, type Episode, type MetadatosReproduccion, type PlaybackRate, type UiLocale } from "@audite/domain";
import { obraDeEpisodio, obraWebp, obrasVisibles, rotuloObra } from "@audite/content/obras";
import Link from "next/link";
import { useEffect } from "react";
import { ObraFoto, Placa } from "@/components/placa";
import { formatoNumero } from "@/lib/numeros";

export type PasoCamino = { id: string; titulo: string; actual: boolean };

export function Reproductor({
  locale,
  preparado,
  episode,
  tiempo,
  duracion,
  sonando,
  velocidad,
  cola,
  onPlay,
  onPause,
  onSeek,
  onSeekBy,
  onRate,
  onAdd,
  enCamino,
}: {
  locale: UiLocale;
  preparado: boolean;
  episode: Episode | null;
  tiempo: number;
  duracion: number;
  sonando: boolean;
  velocidad: PlaybackRate;
  cola: PasoCamino[];
  onPlay: () => void;
  onPause: () => void;
  onSeek: (segundos: number) => void;
  onSeekBy: (delta: number) => void;
  onRate: (rate: PlaybackRate) => void;
  onAdd: () => void;
  enCamino: boolean;
}) {
  const obra = obraDeEpisodio(episode?.id ?? "gn-01");
  const fraccion = duracion > 0 ? tiempo / duracion : 0;
  const titulo = episode ? nombreCorto(episode, locale) : obra ? rotuloObra(obra, locale) : t(locale, "listenComingTitle");
  const meta = metadatosReproduccion({
    titulo,
    libro: episode?.scriptureRangeLabel ?? (obra ? rotuloObra(obra, locale) : ""),
    caratula: obra ? obraWebp(obra) : null,
    duracion,
    posicion: tiempo,
    velocidad,
  });
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    const sesion = navigator.mediaSession;
    const caratula = meta.caratula ? new URL(meta.caratula, window.location.origin).href : "";
    sesion.metadata = new MediaMetadata({
      title: meta.titulo,
      artist: meta.artista,
      album: meta.libro,
      artwork: caratula ? [{ src: caratula, sizes: "512x512", type: meta.caratula?.endsWith(".avif") ? "image/avif" : "image/webp" }] : [],
    });
    sesion.playbackState = sonando ? "playing" : "paused";
    sesion.setActionHandler("play", onPlay);
    sesion.setActionHandler("pause", onPause);
    sesion.setActionHandler("seekbackward", () => onSeekBy(-SALTO_SEGUNDOS));
    sesion.setActionHandler("seekforward", () => onSeekBy(SALTO_SEGUNDOS));
    if (meta.duracion > 0) {
      try {
        sesion.setPositionState({ duration: meta.duracion, playbackRate: meta.velocidad, position: meta.posicion });
      } catch {
        /* El navegador rechaza una duración que aún no conoce. */
      }
    }
  }, [meta.artista, meta.caratula, meta.duracion, meta.libro, meta.posicion, meta.titulo, meta.velocidad, onPause, onPlay, onSeekBy, sonando]);
  const cita = preparado && episode ? citaEnCurso(episode.scriptureRangeLabel, fraccion) : null;
  const maximo = duracion > 0 ? duracion : 1;

  return (
    <section aria-label={t(locale, "nowKicker")} className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-background text-foreground">
      <header className="relative z-10 flex items-center justify-between gap-3 px-4 py-3">
        <Link href="/escuchar" className="inline-flex min-h-11 shrink-0 items-center text-sm text-acento">
          {t(locale, "navListen")}
        </Link>
        <p className="kicker text-acento">{t(locale, "nowKicker")}</p>
        <p className="min-w-16 shrink-0 text-right text-sm tabular-nums">{preparado ? formatClock(tiempo) : ""}</p>
      </header>
      <div className="relative z-10 min-h-0 flex-1 overflow-y-auto">
      <div className="mx-4 mt-2 overflow-hidden rounded-3xl border border-white/10 bg-[#0C0B09]">
        <div className="relative h-52">
          {obra ? <ObraFoto obra={obra} priority className="h-full w-full object-cover" /> : null}
          <div className="absolute inset-0 bg-gradient-to-t from-[#100E0C] to-transparent" />
        </div>
      </div>
      <div className="px-4 pb-8 pt-4">
        {obra ? <p className="kicker text-acento">{rotuloObra(obra, locale)}</p> : null}
        <h1 className="font-display mt-1 max-w-xl text-[1.7rem] leading-tight">{titulo}</h1>
        <TarjetaBloqueo meta={meta} sonando={sonando} locale={locale} />
        {cita ? <p className="font-display-regular mt-1 text-2xl">{cita}</p> : null}
        <p className="mt-1 text-sm text-muted">{preparado ? episode?.scriptureRangeLabel : t(locale, "statusPreparing")}</p>
        <label className="mt-4 block">
          <span className="sr-only">{t(locale, "playerSeek")}</span>
          <input
            type="range"
            className="h-11 w-full accent-[#E0C48A] disabled:opacity-40"
            min={0}
            max={maximo}
            step={0.1}
            value={preparado ? Math.min(tiempo, maximo) : 0}
            disabled={!preparado}
            aria-valuetext={preparado ? formatClock(tiempo) : t(locale, "statusPreparing")}
            onChange={(event) => onSeek(Number(event.currentTarget.value))}
          />
        </label>
        <div className="flex justify-between text-xs tabular-nums text-muted">
          <span>{preparado ? formatClock(tiempo) : "0:00"}</span>
          <span>{preparado ? formatClock(duracion) : "0:00"}</span>
        </div>
        <div className="mt-3 flex items-center justify-center gap-2">
          <Control label={t(locale, "skipBack15")} disabled={!preparado} onClick={() => onSeekBy(-15)}>
            −15
          </Control>
          <button
            type="button"
            disabled={!preparado}
            onClick={() => (sonando ? onPause() : onPlay())}
            className="inline-flex min-h-14 min-w-36 items-center justify-center rounded-full bg-acento px-6 text-acento-ink disabled:cursor-not-allowed disabled:bg-[#5E564C] disabled:text-[#F4ECE2]"
            aria-label={preparado ? (sonando ? t(locale, "playerPause") : t(locale, "playerPlay")) : t(locale, "statusPreparing")}
          >
            {preparado ? (sonando ? t(locale, "playerPause") : t(locale, "playerPlay")) : t(locale, "statusPreparing")}
          </button>
          <Control label={t(locale, "skipForward15")} disabled={!preparado} onClick={() => onSeekBy(15)}>
            +15
          </Control>
        </div>
        <div className="mt-3 grid grid-cols-5 gap-2" role="group" aria-label={t(locale, "playerSpeed")}>
          {PLAYBACK_RATES.map((rate) => (
            <button
              key={rate}
              type="button"
              disabled={!preparado}
              aria-pressed={velocidad === rate}
              onClick={() => onRate(rate)}
              className={`min-h-11 rounded-full px-1 text-sm tabular-nums disabled:opacity-40 ${velocidad === rate && preparado ? "bg-acento text-acento-ink" : "border border-border text-foreground"}`}
            >
              {formatoNumero(locale, rate)}×
            </button>
          ))}
        </div>
        <div className="mt-4 border-t border-border pt-3">
          <p className="kicker text-acento">{t(locale, "navPath")}</p>
          {preparado && episode && !enCamino ? (
            <button type="button" className="mt-2 inline-flex min-h-11 items-center text-sm text-acento" onClick={onAdd}>
              {t(locale, "pathAdd")}
            </button>
          ) : null}
          {cola.length === 0 ? <p className="mt-2 text-sm text-muted">{t(locale, "pathEmpty")}</p> : null}
          <ol className="mt-2 max-h-28 space-y-1 overflow-y-auto">
            {cola.map((paso, indice) => (
              <li key={paso.id} className={`flex min-h-11 items-center justify-between gap-3 text-sm ${paso.actual ? "text-foreground" : "text-muted"}`}>
                <span>
                  {indice + 1}. {paso.titulo}
                </span>
                <span>{paso.actual && preparado ? formatClock(tiempo) : t(locale, "statusPreparing")}</span>
              </li>
            ))}
          </ol>
          {obra ? (
            <div className="mt-3 max-w-xl">
              <Placa obra={obra} lang={locale} />
            </div>
          ) : null}
        </div>
      </div>
      </div>
    </section>
  );
}

export function TarjetaBloqueo({ meta, sonando, locale }: { meta: MetadatosReproduccion; sonando: boolean; locale: UiLocale }) {
  return (
    <figure className="mt-3 rounded-3xl bg-[#100E0C] p-4 text-[#F4ECE2]">
      <figcaption className="kicker text-[#C9A96E]">{locale === "en" ? "Lock screen" : "Pantalla bloqueada"}</figcaption>
      <div className="mt-3 flex items-center gap-3">
        {meta.caratula ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={meta.caratula} alt="" className="size-16 shrink-0 rounded-2xl object-cover" />
        ) : (
          <span className="size-16 shrink-0 rounded-2xl bg-[#0C0B09]" />
        )}
        <span className="min-w-0">
          <span className="font-display block truncate text-xl leading-tight">{meta.titulo}</span>
          <span className="mt-1 block truncate text-sm text-[#B7AB9C]">{meta.libro}</span>
        </span>
      </div>
      <div className="mt-3 flex items-center justify-center gap-3 text-sm">
        <span className="inline-flex size-11 items-center justify-center rounded-full border border-[#F4ECE2]/30">−15</span>
        <span className="inline-flex min-h-11 min-w-24 items-center justify-center rounded-full bg-[#C9A96E] text-[#100E0C]">{sonando ? (locale === "en" ? "Pause" : "Pausa") : (locale === "en" ? "Play" : "Oír")}</span>
        <span className="inline-flex size-11 items-center justify-center rounded-full border border-[#F4ECE2]/30">+15</span>
      </div>
    </figure>
  );
}

function Control({ label, disabled, onClick, children }: { label: string; disabled: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex min-h-12 min-w-12 items-center justify-center rounded-full border border-border px-3 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

export function colaDesdeCamino(ids: string[], actual: string | null, locale: UiLocale): PasoCamino[] {
  const obras = obrasVisibles();
  return ids.map((id) => {
    const obra = obras.find((item) => item.episodio === id);
    return { id, titulo: obra ? rotuloObra(obra, locale) : id, actual: id === actual };
  });
}
