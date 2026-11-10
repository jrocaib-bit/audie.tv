"use client";

import { idiomaContenido,
  booksOnTheWay,
  episodeById,
  formatClock,
  formatSpokenDuration,
  frameAt,
  journeyState,
  creditoVisible,
  listeningDayCount,
  playableByBook,
  nombreCorto,
  rotuloEpisodio,
  playableEpisodes,
  PLAYBACK_RATES,
  t,
  type DailyMinutes,
  type PendingEpisode,
  type TextScale,
  type ThemeChoice,
} from "@audite/domain";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { obraDeEpisodio, obrasVisibles } from "@audite/content/obras";
import { ListaPorLibros } from "@/components/lista-libros";
import { useLibrary } from "@/components/library";
import { ObraFoto, Placa } from "@/components/placa";
import { colaDesdeCamino, Reproductor } from "@/components/reproductor";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

function Page({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <main id="contenido" className={`mx-auto w-full px-5 py-8 md:py-12 ${wide ? "max-w-6xl" : "max-w-3xl"}`}>
      {children}
    </main>
  );
}

export function TodayScreen() {
  const library = useLibrary();
  const router = useRouter();
  const locale = library.settings.uiLocale;
  const episodeId = library.daily.kind === "continue" ? library.daily.episodeId : playableEpisodes(library.catalog)[0]?.id;
  const episode = episodeId ? episodeById(library.catalog, episodeId) : null;
  const onPath = episode ? library.path.steps.some((step) => step.episodeId === episode.id) : false;
  const days = listeningDayCount(library.progress.listenedOn ?? []);
  const resume = library.daily.kind === "continue" ? library.daily.resumeSeconds : 0;
  const [primeroRemoto, setPrimeroRemoto] = useState<PendingEpisode | null>(null);
  useEffect(() => {
    if (library.catalog.pendientes.length > 0) return;
    let cancelado = false;
    void fetch("/api/libro/gn")
      .then((respuesta) => (respuesta.ok ? respuesta.json() : null))
      .then((dato: { episodios?: PendingEpisode[] } | null) => {
        if (!cancelado) setPrimeroRemoto(dato?.episodios?.[0] ?? null);
      })
      .catch(() => undefined);
    return () => {
      cancelado = true;
    };
  }, [library.catalog.pendientes.length]);
  const primero = library.catalog.pendientes.find((episodio) => episodio.bookId === "gn") ?? primeroRemoto;
  const obra = obraDeEpisodio(primero?.id ?? episode?.id ?? "gn-01");

  return (
    <main id="contenido" className="bg-background">
      <section className="relative min-h-[calc(100svh-7.5rem)] bg-[#0C0B09] text-[#F4ECE2]">
        {obra ? (
          <div className="absolute inset-0 overflow-hidden">
            <ObraFoto obra={obra} priority mover={!library.reduceMotion} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#100E0C] via-[#100E0C]/72 to-transparent" />
          </div>
        ) : null}
        <div className="relative z-10 flex min-h-[calc(100svh-7.5rem)] flex-col justify-end px-5 pb-6 pt-8 md:px-10">
          <div className="max-w-xl rounded-sm bg-[#100E0C]/82 px-4 py-5">
          <p className="kicker text-[#C9A96E]">{t(locale, "todayEyebrow")}</p>
          <h1 className="font-display mt-3 max-w-xl text-5xl leading-[0.95] md:text-6xl">{t(locale, "listenTitle")}</h1>
          <p className="mt-4 text-sm text-[#B7AB9C]">
            {t(locale, "todayDays")} · {days}
          </p>
          {!library.hydrated ? <p className="mt-6 text-[#B7AB9C]">{t(locale, "listenLoading")}</p> : null}
          {library.hydrated && episode && library.daily.kind !== "path_complete" ? (
            <div className="mt-6 max-w-xl">
              <p className="text-sm text-[#B7AB9C]">{episode.scriptureRangeLabel}</p>
              <h2 className="mt-1 font-serif text-4xl leading-tight">{episode.title}</h2>
              <p className="mt-3 tabular-nums">
                {formatClock(resume)} / {formatSpokenDuration(episode.durationSeconds)}
              </p>
              <Button
                type="button"
                size="lg"
                className="mt-6"
                onClick={() => {
                  if (!onPath) library.addEpisode(episode.id);
                  library.playEpisode(episode.id, false);
                  router.push("/ahora");
                }}
              >
                {onPath && resume > 0 ? t(locale, "todayPrimary") : t(locale, "todayBegin")}
              </Button>
            </div>
          ) : null}
          {library.hydrated && !episode && library.daily.kind !== "path_complete" ? (
            <div className="mt-6 max-w-xl">
              {primero ? <p className="font-serif text-4xl leading-tight">{rotuloEpisodio(primero, locale) ?? t(locale, "comingSoon")}</p> : <h2 className="font-serif text-4xl leading-tight">{t(locale, "listenComingTitle")}</h2>}
              <p className="mt-3 text-[#B7AB9C]">{t(locale, "listenComingBody")}</p>
              <Button asChild className="mt-6" size="lg">
                <Link href={`/${locale}/catalogo/${primero?.id ?? "gn-01"}`}>{t(locale, "seeEpisode")}</Link>
              </Button>
            </div>
          ) : null}
          {library.hydrated && library.daily.kind === "path_complete" ? (
            <div className="mt-6">
              <h2 className="font-serif text-3xl">{t(locale, "listenDoneTitle")}</h2>
              <p className="mt-3 text-[#B7AB9C]">{t(locale, "listenDoneBody")}</p>
            </div>
          ) : null}
          {obra ? (
            <div className="mt-8 max-w-xl">
              <Placa obra={obra} lang={locale} />
            </div>
          ) : null}
          <p className="mt-6 text-sm text-[#F4ECE2]">
            {creditoVisible(library.catalog.fuenteTexto[idiomaContenido(locale)], t(locale, "sourceLabel"), t(locale, "sourcePending"))}
          </p>
          </div>
        </div>
      </section>
    </main>
  );
}

export function NowPlayingScreen() {
  const library = useLibrary();
  const locale = library.settings.uiLocale;
  const episode = playableEpisodes(library.catalog)[0] ?? null;
  const hydrated = library.hydrated;
  const loadEpisode = library.loadEpisode;
  useEffect(() => {
    if (hydrated && episode) loadEpisode(episode.id);
  }, [episode, hydrated, loadEpisode]);
  const activo = Boolean(episode && library.player.episodeId === episode.id);
  const tiempo = activo ? library.player.globalTime : 0;
  const sonando = activo && library.player.status === "playing";
  const enCamino = episode ? library.path.steps.some((paso) => paso.episodeId === episode.id) : false;
  const cola = colaDesdeCamino(
    library.path.steps.map((paso) => paso.episodeId),
    episode?.id ?? null,
    locale,
  );
  return (
    <Reproductor
      locale={locale}
      preparado={Boolean(episode)}
      episode={episode}
      tiempo={tiempo}
      duracion={activo ? library.player.duration : episode?.durationSeconds ?? 0}
      sonando={sonando}
      velocidad={library.player.rate}
      cola={cola}
      enCamino={enCamino}
      onPlay={() => {
        if (!episode) return;
        library.playEpisode(episode.id, library.player.status === "ended");
      }}
      onPause={() => library.toggle()}
      onSeek={(segundos) => {
        library.setDragging(true);
        library.seek(segundos);
        library.setDragging(false);
      }}
      onSeekBy={(delta) => library.seekBy(delta)}
      onRate={(rate) => library.setRate(rate)}
      onAdd={() => {
        if (episode) library.addEpisode(episode.id);
      }}
    />
  );
}

export function PathScreen() {
  const library = useLibrary();
  const router = useRouter();
  const locale = library.settings.uiLocale;
  const episode = playableEpisodes(library.catalog)[0];
  const onPath = episode ? library.path.steps.some((step) => step.episodeId === episode.id) : false;
  const books = booksOnTheWay(library.catalog.books);
  const byBook = playableByBook(library.catalog.episodes);
  return (
    <Page wide>
      <p className="kicker">{t(locale, "navPath")}</p>
      <h1 className="mt-3 max-w-3xl font-serif text-5xl">{t(locale, "pathTitle")}</h1>
      <p className="mt-4 max-w-2xl text-muted">{t(locale, "pathIntro")}</p>
      <ul className="mt-8 flex gap-3 overflow-x-auto pb-2">
        {obrasVisibles().map((obra) => (
          <li key={obra.id} className="w-36 shrink-0">
            <Link href={`/${locale}/catalogo/${obra.episodio}`} className="block min-h-11">
              <span className="block aspect-[3/4] overflow-hidden bg-[#0C0B09]">
                <ObraFoto obra={obra} className="h-full w-full object-cover" />
              </span>
              <span className="mt-2 block text-[11px] tracking-[0.14em] text-brand uppercase">{obra.numero}</span>
            </Link>
          </li>
        ))}
      </ul>
      {episode ? (
        <Button
          type="button"
          size="lg"
          className="mt-8"
          onClick={() => {
            if (!onPath) library.addEpisode(episode.id);
            library.playEpisode(episode.id, false);
            router.push("/ahora");
          }}
        >
          {onPath ? t(locale, "todayPrimary") : t(locale, "todayBegin")}
        </Button>
      ) : null}
      <ol className="mt-8 max-w-2xl space-y-3">
        {library.path.steps.map((step, index) => {
          const item = episodeById(library.catalog, step.episodeId);
          if (!item) return null;
          return (
            <li key={step.episodeId} className="flex flex-col gap-3 border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-muted">
                  {index + 1}. {item.scriptureRangeLabel}
                </p>
                <p className="font-serif text-2xl">{nombreCorto(item, locale)}</p>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => library.moveEpisode(index, -1)} disabled={index === 0}>
                  {t(locale, "pathUp")}
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => library.moveEpisode(index, 1)} disabled={index === library.path.steps.length - 1}>
                  {t(locale, "pathDown")}
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => library.removeEpisode(item.id)}>
                  {t(locale, "pathRemove")}
                </Button>
              </div>
            </li>
          );
        })}
      </ol>
      <section className="mt-14">
        <h2 className="font-serif text-3xl">{t(locale, "journeyLabel")}</h2>
        <ol className="mt-6 grid gap-x-8 sm:grid-cols-2">
          {books.map((book) => {
            const state = journeyState(book.id, library.path, library.progress, byBook);
            const label =
              state === "heard" ? t(locale, "journeyHeard") : state === "on_path" || state === "playable" ? t(locale, "journeyCurrent") : t(locale, "journeyAhead");
            return (
              <li key={book.id} className="flex items-baseline justify-between gap-4 border-b border-border py-2">
                <span className={state === "ahead" ? "text-muted" : "text-foreground"}>{book.name[idiomaContenido(locale)]}</span>
                <span className="text-xs text-muted">{label}</span>
              </li>
            );
          })}
        </ol>
      </section>
    </Page>
  );
}

export function LibraryScreen({ bare = false }: { bare?: boolean }) {
  const { catalog, settings } = useLibrary();
  const locale = settings.uiLocale;
  const episode = playableEpisodes(catalog)[0];
  const frame = frameAt(catalog.cues, catalog.captions, 12, true);
  const artwork = catalog.artworks.find((item) => item.id === frame.artworkId);
  const cuerpo = (
    <>
      {bare ? null : <p className="kicker">{t(locale, "navLibrary")}</p>}
      {bare ? null : <h1 className="mt-3 font-serif text-5xl">{t(locale, "catalogTitle")}</h1>}
      <p className={bare ? "text-muted" : "mt-4 text-muted"}>{t(locale, "libraryQuiet")}</p>
      {episode ? (
        <article className="mt-8 overflow-hidden border border-border bg-card">
          {artwork ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={artwork.publicPath} alt={`${artwork.title[idiomaContenido(locale)]}. ${artwork.artist[idiomaContenido(locale)]}`} loading="lazy" className="h-72 w-full bg-[#141210] object-contain" />
          ) : null}
          <div className="p-6">
            <p className="text-sm text-muted">{episode.scriptureRangeLabel}</p>
            <h2 className="mt-1 font-serif text-4xl">{episode.title}</h2>
            <p className="mt-3 text-muted">{episode.summary[idiomaContenido(locale)]}</p>
            <Button asChild className="mt-6" size="lg">
              <Link href="/ahora">{t(locale, "catalogListen")}</Link>
            </Button>
          </div>
        </article>
      ) : null}
      <div className="mt-10">
        <ListaPorLibros catalog={catalog} locale={locale} diferir />
      </div>
    </>
  );
  if (bare) return cuerpo;
  return <Page>{cuerpo}</Page>;
}

const themes: ThemeChoice[] = ["system", "light", "dark"];
const scales: TextScale[] = ["sm", "md", "lg", "xl"];
const minutes: DailyMinutes[] = [10, 15, 20, 30];

export function SettingsScreen() {
  const { settings, updateSettings, setRate } = useLibrary();
  const locale = settings.uiLocale;
  return (
    <Page>
      <p className="kicker">{t(locale, "settingsKicker")}</p>
      <h1 className="mt-3 font-serif text-5xl">{t(locale, "settingsTitle")}</h1>
      <div className="mt-10 grid max-w-2xl gap-8">
        <Choice
          legend={t(locale, "settingsTheme")}
          value={settings.theme}
          options={themes.map((value) => ({
            value,
            label: t(locale, value === "system" ? "settingsThemeSystem" : value === "light" ? "settingsThemeLight" : "settingsThemeDark"),
          }))}
          onChange={(theme) => updateSettings({ theme })}
        />
        <Choice
          legend={t(locale, "settingsText")}
          value={settings.textScale}
          options={scales.map((value) => ({
            value,
            label: t(locale, value === "sm" ? "settingsTextSm" : value === "md" ? "settingsTextMd" : value === "lg" ? "settingsTextLg" : "settingsTextXl"),
          }))}
          onChange={(textScale) => updateSettings({ textScale })}
        />
        <Choice
          legend={t(locale, "settingsDaily")}
          help={t(locale, "settingsDailyHelp")}
          value={String(settings.dailyMinutes)}
          options={minutes.map((value) => ({ value: String(value), label: `${value} min` }))}
          onChange={(value) => updateSettings({ dailyMinutes: Number(value) as DailyMinutes })}
        />
        <Choice
          legend={t(locale, "settingsSpeed")}
          value={String(settings.rate)}
          options={PLAYBACK_RATES.map((value) => ({ value: String(value), label: `${value}×` }))}
          onChange={(value) => setRate(Number(value) as (typeof PLAYBACK_RATES)[number])}
        />
        <Choice
          legend={t(locale, "settingsLanguage")}
          help={t(locale, "settingsLanguageHelp")}
          value={settings.uiLocale}
          options={[
            { value: "es" as const, label: t(locale, "commonSpanish") },
            { value: "en" as const, label: t(locale, "commonEnglish") },
          ]}
          onChange={(uiLocale) => updateSettings({ uiLocale })}
        />
        <Toggle id="motion" label={t(locale, "settingsMotion")} help={t(locale, "settingsMotionHelp")} checked={settings.reduceMotion} onCheckedChange={(reduceMotion) => updateSettings({ reduceMotion })} />
        <Toggle id="captions" label={t(locale, "settingsCaptions")} help={t(locale, "settingsCaptionsHelp")} checked={settings.captions} onCheckedChange={(captions) => updateSettings({ captions })} />
        <section>
          <h2 className="font-serif text-3xl">{t(locale, "settingsAboutTitle")}</h2>
          <p className="mt-3 text-muted">{t(locale, "settingsAboutBody")}</p>
          <Link href="/membresia" className="mt-4 inline-block underline decoration-border underline-offset-4">
            {t(locale, "navMembership")}
          </Link>
        </section>
      </div>
    </Page>
  );
}

function Choice<T extends string>({
  legend,
  help,
  value,
  options,
  onChange,
}: {
  legend: string;
  help?: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <fieldset>
      <legend className="font-serif text-2xl">{legend}</legend>
      {help ? <p className="mt-1 text-sm text-muted">{help}</p> : null}
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => (
          <Button key={option.value} type="button" variant={option.value === value ? "default" : "outline"} aria-pressed={option.value === value} onClick={() => onChange(option.value)}>
            {option.label}
          </Button>
        ))}
      </div>
    </fieldset>
  );
}

function Toggle({ id, label, help, checked, onCheckedChange }: { id: string; label: string; help: string; checked: boolean; onCheckedChange: (checked: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-6 border-t border-border pt-6">
      <div>
        <label htmlFor={id} className="font-serif text-2xl">
          {label}
        </label>
        <p className="mt-1 text-sm text-muted">{help}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} aria-label={label} />
    </div>
  );
}

export function MembershipScreen() {
  const { settings } = useLibrary();
  const locale = settings.uiLocale;
  return (
    <Page>
      <p className="kicker">{t(locale, "membershipKicker")}</p>
      <h1 className="mt-3 font-serif text-5xl">{t(locale, "membershipTitle")}</h1>
      <p className="mt-6 max-w-2xl text-lg leading-relaxed">{t(locale, "membershipBody")}</p>
      <p className="mt-4 max-w-2xl text-muted">{t(locale, "membershipNoPrice")}</p>
      <Button asChild className="mt-8" variant="outline">
        <Link href="/escuchar">{t(locale, "membershipBack")}</Link>
      </Button>
    </Page>
  );
}
