"use client";

import { citaEnCurso, formatClock, nombreCorto, PLAYBACK_RATES, t, type Episode, type PlaybackRate, type UiLocale } from "@audite/domain";
import { obraDeEpisodio, obrasVisibles, rotuloObra } from "@audite/content/obras";
import Link from "next/link";
import { ObraFoto, Placa } from "@/components/placa";

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
  const cita = preparado && episode ? citaEnCurso(episode.scriptureRangeLabel, fraccion) : null;
  const titulo = episode ? nombreCorto(episode, locale) : obra ? rotuloObra(obra, locale) : t(locale, "listenComingTitle");
  const maximo = duracion > 0 ? duracion : 1;

  return (
    <section aria-label={t(locale, "nowKicker")} className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-background text-foreground">
      <header className="relative z-10 flex items-center justify-between px-4 py-3">
        <Link href="/escuchar" className="inline-flex min-h-11 items-center text-sm text-[#E0C48A]">
          {t(locale, "navListen")}
        </Link>
        <p className="kicker text-[#C9A96E]">{t(locale, "nowKicker")}</p>
        <p className="min-w-16 text-right text-sm tabular-nums">{preparado ? formatClock(tiempo) : t(locale, "statusPreparing")}</p>
      </header>
      <div className="relative z-10 mx-4 mt-2 overflow-hidden rounded-3xl border border-white/10 bg-[#0C0B09]">
        <div className="relative h-52">
          {obra ? <ObraFoto obra={obra} priority className="h-full w-full object-cover" /> : null}
          <div className="absolute inset-0 bg-gradient-to-t from-[#100E0C] to-transparent" />
        </div>
      </div>
      <div className="relative z-10 mt-auto px-4 pb-5 pt-4">
        {obra ? <p className="kicker text-[#C9A96E]">{rotuloObra(obra, locale)}</p> : null}
        <h1 className="mt-1 max-w-xl font-serif text-3xl leading-tight">{titulo}</h1>
        <p className="mt-1 text-sm text-muted">{cita ?? (preparado ? episode?.scriptureRangeLabel : t(locale, "statusPreparing"))}</p>
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
          <span>{preparado ? formatClock(duracion) : "—"}</span>
        </div>
        <div className="mt-3 flex items-center justify-center gap-2">
          <Control label={t(locale, "skipBack15")} disabled={!preparado} onClick={() => onSeekBy(-15)}>
            −15
          </Control>
          <button
            type="button"
            disabled={!preparado}
            onClick={() => (sonando ? onPause() : onPlay())}
            className="inline-flex min-h-14 min-w-36 items-center justify-center rounded-full bg-[#E0C48A] px-6 text-[#100E0C] disabled:cursor-not-allowed disabled:bg-[#5E564C] disabled:text-[#F4ECE2]"
            aria-label={preparado ? (sonando ? t(locale, "playerPause") : t(locale, "playerPlay")) : t(locale, "statusPreparing")}
          >
            {preparado ? (sonando ? t(locale, "playerPause") : t(locale, "playerPlay")) : t(locale, "statusPreparing")}
          </button>
          <Control label={t(locale, "skipForward15")} disabled={!preparado} onClick={() => onSeekBy(15)}>
            +15
          </Control>
        </div>
        <div className="mt-3 flex flex-wrap justify-center gap-2" role="group" aria-label={t(locale, "playerSpeed")}>
          {PLAYBACK_RATES.map((rate) => (
            <button
              key={rate}
              type="button"
              disabled={!preparado}
              aria-pressed={velocidad === rate}
              onClick={() => onRate(rate)}
              className={`min-h-11 min-w-12 rounded-full px-3 text-sm tabular-nums disabled:opacity-40 ${velocidad === rate && preparado ? "bg-[#E0C48A] text-[#100E0C]" : "border border-[#F4ECE2]/25 text-[#F4ECE2]"}`}
            >
              {rate}×
            </button>
          ))}
        </div>
        <div className="mt-4 border-t border-[#F4ECE2]/15 pt-3">
          <p className="kicker text-[#C9A96E]">{t(locale, "navPath")}</p>
          {preparado && episode && !enCamino ? (
            <button type="button" className="mt-2 inline-flex min-h-11 items-center text-sm text-[#E0C48A]" onClick={onAdd}>
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
    </section>
  );
}

function Control({ label, disabled, onClick, children }: { label: string; disabled: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex min-h-12 min-w-12 items-center justify-center rounded-full border border-[#F4ECE2]/30 px-3 text-sm text-[#F4ECE2] disabled:cursor-not-allowed disabled:opacity-40"
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
