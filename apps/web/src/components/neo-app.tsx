"use client";

import {
  booksOnTheWay,
  creditoVisible,
  journeyState,
  listeningDayCount,
  nombreCorto,
  playableByBook,
  playableEpisodes,
  rotuloEpisodio,
  t,
  type PendingEpisode,
  type UiLocale,
} from "@audite/domain";
import { obraDeEpisodio, obrasVisibles, rotuloObra } from "@audite/content/obras";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { ListaPorLibros } from "@/components/lista-libros";
import { useLibrary } from "@/components/library";
import { ObraFoto, Placa } from "@/components/placa";
import { Switch } from "@/components/ui/switch";

function tx(locale: UiLocale, es: string, en: string): string {
  return locale === "en" ? en : es;
}

function toque(reducir: boolean) {
  if (reducir || typeof navigator === "undefined" || !("vibrate" in navigator)) return;
  navigator.vibrate(8);
}

function demoVisible(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.dataset.demo === "1" || localStorage.getItem("audite.perfilDemo") === "1";
}

function DemoMarca({ locale }: { locale: UiLocale }) {
  const visible = useSyncExternalStore(() => () => {}, demoVisible, () => false);
  if (!visible) return null;
  return (
    <p className="neo-chip border-[#C9A96E]/50 text-xs tracking-[0.14em] text-[#C9A96E] uppercase">{tx(locale, "Perfil demo", "Demo profile")}</p>
  );
}

function minutosReales(episodios: Record<string, { positionSeconds: number }>): number | null {
  const lista = Object.values(episodios);
  if (lista.length === 0) return null;
  const segundos = lista.reduce((suma, episodio) => suma + Math.max(0, episodio.positionSeconds || 0), 0);
  return segundos > 0 ? segundos / 60 : null;
}

export function NeoToday() {
  const library = useLibrary();
  const locale = library.settings.uiLocale;
  const episode = playableEpisodes(library.catalog)[0] ?? null;
  const [primero, setPrimero] = useState<PendingEpisode | null>(library.catalog.pendientes.find((item) => item.bookId === "gn") ?? null);
  useEffect(() => {
    if (primero) return;
    let cancelado = false;
    void fetch("/api/libro/gn")
      .then((respuesta) => (respuesta.ok ? respuesta.json() : null))
      .then((dato: { episodios?: PendingEpisode[] } | null) => {
        if (!cancelado) setPrimero(dato?.episodios?.[0] ?? null);
      })
      .catch(() => undefined);
    return () => {
      cancelado = true;
    };
  }, [primero]);
  const id = episode?.id ?? primero?.id ?? "gn-01";
  const obra = obraDeEpisodio(id);
  const dias = listeningDayCount(library.progress.listenedOn ?? []);
  const minutos = minutosReales(library.progress.episodes);
  const oidos = obrasVisibles().filter((item) => (library.progress.episodes[item.episodio]?.positionSeconds ?? 0) > 0).length;
  const totalGenesis = obrasVisibles().length;
  const hayEscucha = dias > 0 || minutos != null;

  return (
    <main id="contenido" className="mx-auto w-full max-w-lg px-4 pt-4 pb-44">
      <div className="flex items-center justify-between">
        <p className="font-display text-3xl">{tx(locale, "Hoy", "Today")}</p>
        <DemoMarca locale={locale} />
      </div>
      <article className="neo-card relative mt-4 overflow-hidden text-[#F4ECE2]">
        <div className="absolute inset-0 bg-[#100E0C]">
          {obra ? <ObraFoto obra={obra} className="h-full w-full object-cover opacity-80" /> : null}
          <div className="absolute inset-0 bg-gradient-to-t from-[#100E0C] via-[#100E0C]/75 to-[#100E0C]/25" />
        </div>
        <div className="relative flex min-h-64 flex-col justify-end p-5">
          <p className="text-xs tracking-[0.16em] text-[#C9A96E] uppercase">{obra ? rotuloObra(obra, locale) : t(locale, "statusPreparing")}</p>
          <h1 className="mt-2 text-2xl leading-tight">
            {episode ? nombreCorto(episode, locale) : rotuloEpisodio(primero ?? { id }, locale) ?? t(locale, "listenComingTitle")}
          </h1>
          <p className="mt-2 text-sm text-[#F4ECE2]">{episode ? episode.scriptureRangeLabel : t(locale, "statusPreparing")}</p>
          <div className="mt-4 flex gap-2">
            {episode ? (
              <Link href="/ahora" onClick={() => toque(library.reduceMotion)} className="inline-flex min-h-11 items-center rounded-2xl bg-[#E0C48A] px-4 text-sm text-[#100E0C]">
                {t(locale, "catalogListen")}
              </Link>
            ) : (
              <Link href={`/${locale}/catalogo/${id}`} className="inline-flex min-h-11 items-center rounded-2xl bg-[#E0C48A] px-4 text-sm text-[#100E0C]">
                {t(locale, "seeEpisode")}
              </Link>
            )}
          </div>
        </div>
      </article>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <Metrica etiqueta={t(locale, "todayDays")} valor={hayEscucha ? String(dias) : "—"} nota={hayEscucha ? tx(locale, "días reales", "real days") : tx(locale, "Sin escucha", "No listening yet")} />
        <Metrica etiqueta={tx(locale, "Minutos", "Minutes")} valor={minutos == null ? "—" : minutos < 10 ? minutos.toFixed(1) : minutos.toFixed(0)} nota={minutos == null ? tx(locale, "Sin posición", "No position") : tx(locale, "oídos", "heard")} />
        <Metrica etiqueta={tx(locale, "La Biblia", "The Bible")} valor="—" nota={tx(locale, "Sin duración total", "No total duration")} />
        <Metrica etiqueta="Génesis" valor={oidos > 0 ? `${oidos}/${totalGenesis}` : "—"} nota={oidos > 0 ? tx(locale, "episodios con posición", "episodes with a position") : tx(locale, "Ninguno oído", "None heard")} />
      </div>
      <section className="neo-card mt-3 p-4">
        <p className="text-xs tracking-[0.14em] text-muted uppercase">{tx(locale, "Serie", "Series")}</p>
        {dias === 0 ? (
          <p className="mt-3 text-sm text-muted">{tx(locale, "Aún no hay días de escucha.", "There are no listening days yet.")}</p>
        ) : (
          <div className="mt-3 flex h-10 items-end gap-1" aria-hidden="true">
            {library.progress.listenedOn.slice(-12).map((dia) => (
              <span key={dia} className="h-6 w-2 rounded-full bg-[#C9A96E]" title={dia} />
            ))}
          </div>
        )}
      </section>
      <p className="mt-4 text-sm text-muted">{creditoVisible(library.catalog.fuenteTexto[locale], t(locale, "sourceLabel"), t(locale, "sourcePending"))}</p>
    </main>
  );
}

function Metrica({ etiqueta, valor, nota }: { etiqueta: string; valor: string; nota: string }) {
  return (
    <section className="neo-card p-4">
      <p className="text-xs text-muted">{etiqueta}</p>
      <p className="tabular mt-1 text-3xl text-[#C9A96E]">{valor}</p>
      <p className="mt-1 text-xs text-muted">{nota}</p>
    </section>
  );
}

export function NeoPath() {
  const library = useLibrary();
  const locale = library.settings.uiLocale;
  const books = booksOnTheWay(library.catalog.books);
  const byBook = playableByBook(library.catalog.episodes);
  const dias = listeningDayCount(library.progress.listenedOn ?? []);
  const minutos = minutosReales(library.progress.episodes);
  return (
    <main id="contenido" className="mx-auto w-full max-w-lg px-4 pt-4 pb-44">
      <p className="font-display text-3xl">{t(locale, "navPath")}</p>
      <DemoMarca locale={locale} />
      <section className="neo-card mt-4 p-4">
        <p className="text-sm text-muted">
          {dias === 0 || minutos == null
            ? tx(locale, "Aún no hay ritmo. El final no se puede estimar.", "There is no pace yet. The end cannot be estimated.")
            : tx(locale, "Hay escucha, pero falta la duración del resto de la Biblia. Sin estimación.", "There is listening, but the rest of the Bible has no duration. No estimate.")}
        </p>
      </section>
      {library.path.steps.length === 0 ? <p className="mt-4 text-sm text-muted">{t(locale, "pathEmpty")}</p> : null}
      <ol className="mt-4 space-y-6">
        {(["ot", "nt"] as const).map((testamento) => (
          <li key={testamento}>
            <p className="text-xs tracking-[0.16em] text-muted uppercase">{testamento === "ot" ? t(locale, "testamentOt") : t(locale, "testamentNt")}</p>
            <ol className="mt-2 border-l border-white/15 pl-4">
              {books
                .filter((book) => book.testament === testamento)
                .map((book) => {
                  const state = journeyState(book.id, library.path, library.progress, byBook);
                  const oidos = book.id === "gn" ? obrasVisibles().filter((item) => library.progress.episodes[item.episodio]?.completed).length : 0;
                  return (
                    <li key={book.id} className="relative py-2">
                      <span className={`absolute -left-[1.3rem] top-3 size-2 rounded-full ${state === "ahead" ? "bg-muted" : "bg-[#C9A96E]"}`} />
                      <div className="flex items-baseline justify-between gap-3">
                        <span>{book.name[locale] || book.name.es}</span>
                        <span className="tabular text-xs text-muted">
                          {book.id === "gn" && oidos > 0 ? `${oidos}/22` : t(locale, state === "heard" ? "journeyHeard" : state === "ahead" ? "journeyAhead" : "journeyCurrent")}
                        </span>
                      </div>
                    </li>
                  );
                })}
            </ol>
          </li>
        ))}
      </ol>
    </main>
  );
}

export function NeoLibrary() {
  const { catalog, settings, reduceMotion } = useLibrary();
  const locale = settings.uiLocale;
  const [consulta, setConsulta] = useState("");
  const [testamento, setTestamento] = useState<"todos" | "ot" | "nt">("todos");
  const [estado, setEstado] = useState<"todos" | "preparacion" | "revision" | "propuesto">("todos");
  return (
    <main id="contenido" className="mx-auto w-full max-w-lg px-4 pt-4 pb-44">
      <p className="font-display text-3xl">{t(locale, "navLibrary")}</p>
      <input
        value={consulta}
        onChange={(event) => setConsulta(event.target.value)}
        placeholder={tx(locale, "Buscar libro o episodio", "Search a book or episode")}
        className="neo-card mt-4 min-h-12 w-full bg-transparent px-4 text-base outline-none"
        aria-label={tx(locale, "Buscar", "Search")}
      />
      <div className="mt-3 flex gap-2 overflow-x-auto">
        {(
          [
            ["todos", tx(locale, "Todo", "All")],
            ["ot", t(locale, "testamentOt")],
            ["nt", t(locale, "testamentNt")],
            ["preparacion", t(locale, "statusPreparing")],
            ["revision", t(locale, "statusReview")],
            ["propuesto", t(locale, "statusProposed")],
          ] as const
        ).map(([id, label]) => {
          const activo = id === "ot" || id === "nt" || id === "todos" ? testamento === id : estado === id;
          return (
            <button
              key={id}
              type="button"
              className={`neo-chip shrink-0 ${activo ? "border-[#C9A96E] text-foreground" : "text-muted"}`}
              onClick={() => {
                toque(reduceMotion);
                if (id === "todos" || id === "ot" || id === "nt") setTestamento(id);
                else setEstado(id);
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
      <div className="mt-4">
        <ListaPorLibros catalog={catalog} locale={locale} neo consulta={consulta} filtroTestamento={testamento} estado={estado} />
      </div>
    </main>
  );
}

export function NeoSettings() {
  const { settings, updateSettings, setRate, reduceMotion } = useLibrary();
  const locale = settings.uiLocale;
  return (
    <main id="contenido" className="mx-auto w-full max-w-lg px-4 pt-4 pb-44">
      <p className="font-display text-3xl">{t(locale, "settingsTitle")}</p>
      <Grupo titulo={t(locale, "settingsTheme")}>
        {(["system", "light", "dark"] as const).map((theme) => (
          <Fila key={theme} label={t(locale, theme === "system" ? "settingsThemeSystem" : theme === "light" ? "settingsThemeLight" : "settingsThemeDark")} onClick={() => { toque(reduceMotion); updateSettings({ theme }); }}>
            <span className="tabular text-sm text-[#C9A96E]">{settings.theme === theme ? "●" : ""}</span>
          </Fila>
        ))}
      </Grupo>
      <Grupo titulo={t(locale, "settingsLanguage")}>
        {(["es", "en"] as const).map((uiLocale) => (
          <Fila key={uiLocale} label={t(locale, uiLocale === "es" ? "commonSpanish" : "commonEnglish")} onClick={() => updateSettings({ uiLocale })}>
            <span className="text-sm text-[#C9A96E]">{settings.uiLocale === uiLocale ? "●" : ""}</span>
          </Fila>
        ))}
      </Grupo>
      <Grupo titulo={t(locale, "settingsSpeed")}>
        <div className="flex flex-wrap gap-2 px-4 py-3">
          {([0.75, 1, 1.25, 1.5, 2] as const).map((rate) => (
            <button key={rate} type="button" className={`neo-chip tabular ${settings.rate === rate ? "border-[#C9A96E]" : ""}`} onClick={() => setRate(rate)}>
              {rate}×
            </button>
          ))}
        </div>
      </Grupo>
      <Grupo titulo={tx(locale, "Escucha", "Listening")}>
        <Fila label={t(locale, "settingsMotion")}>
          <Switch checked={settings.reduceMotion} onCheckedChange={(reduceMotion) => updateSettings({ reduceMotion })} aria-label={t(locale, "settingsMotion")} />
        </Fila>
        <Fila label={t(locale, "settingsCaptions")}>
          <Switch checked={settings.captions} onCheckedChange={(captions) => updateSettings({ captions })} aria-label={t(locale, "settingsCaptions")} />
        </Fila>
      </Grupo>
      <Link href="/membresia" className="neo-card mt-4 flex min-h-14 items-center justify-between px-4">
        <span>{t(locale, "navMembership")}</span>
        <span className="text-sm text-muted">{t(locale, "statusPreparing")}</span>
      </Link>
    </main>
  );
}

function Grupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mt-5">
      <h2 className="px-1 text-xs tracking-[0.14em] text-muted uppercase">{titulo}</h2>
      <div className="neo-card mt-2 divide-y divide-white/10">{children}</div>
    </section>
  );
}

function Fila({ label, children, onClick }: { label: string; children: React.ReactNode; onClick?: () => void }) {
  const clase = "flex min-h-14 w-full items-center justify-between gap-3 px-4 text-left";
  if (onClick) {
    return (
      <button type="button" className={clase} onClick={onClick}>
        <span>{label}</span>
        {children}
      </button>
    );
  }
  return (
    <div className={clase}>
      <span>{label}</span>
      {children}
    </div>
  );
}

export function NeoMembership() {
  const { settings } = useLibrary();
  const locale = settings.uiLocale;
  const obra = obraDeEpisodio("gn-05");
  return (
    <main id="contenido" className="mx-auto w-full max-w-lg px-4 pt-4 pb-44">
      <p className="font-display text-3xl">{t(locale, "membershipTitle")}</p>
      <article className="neo-card relative mt-4 overflow-hidden text-[#F4ECE2]">
        <div className="absolute inset-0 bg-[#100E0C]">{obra ? <ObraFoto obra={obra} className="h-full w-full object-cover opacity-70" /> : null}</div>
        <div className="relative bg-gradient-to-t from-[#100E0C] via-[#100E0C]/80 to-[#100E0C]/20 p-5">
          <p className="text-xs tracking-[0.16em] text-[#C9A96E] uppercase">{t(locale, "statusPreparing")}</p>
          <h1 className="mt-2 text-2xl">{tx(locale, "Plan anual", "Annual plan")}</h1>
          <p className="mt-2 text-sm text-[#F4ECE2]">{t(locale, "membershipNoPrice")}</p>
        </div>
      </article>
      <p className="mt-4 text-sm text-muted">{t(locale, "membershipBody")}</p>
      {obra ? <div className="mt-4"><Placa obra={obra} lang={locale} /></div> : null}
    </main>
  );
}
