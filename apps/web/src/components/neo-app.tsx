"use client";

import { idiomaContenido,
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
import { obraDeEpisodio, rotuloObra } from "@audite/content/obras";
import recuento from "../../../../content/canon/recuento.json";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { Mark, Wordmark } from "@/components/brand";
import { ListaPorLibros } from "@/components/lista-libros";
import { useLibrary } from "@/components/library";
import { ObraFoto, Placa } from "@/components/placa";
import { Switch } from "@/components/ui/switch";
import { formatoNumero } from "@/lib/numeros";

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
    <p className="kicker rounded-full border border-acento px-3 py-1 text-acento">{tx(locale, "Perfil demo", "Demo profile")}</p>
  );
}

function MarcaFila({ locale, extra }: { locale: UiLocale; extra?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Link href={`/${locale}`} aria-label="Audite" className="inline-flex min-h-11 min-w-0 items-center gap-2">
        <Mark className="size-8 shrink-0 rounded-lg" />
        <Wordmark locale={locale} className="h-5 w-auto" />
      </Link>
      {extra}
    </div>
  );
}

const TOTAL_BIBLIA = (recuento as { total: number }).total;
const POR_LIBRO = (recuento as { porLibro: Record<string, number> }).porLibro;

function escuchado(episodio: { positionSeconds: number; completed?: boolean } | undefined): boolean {
  if (!episodio) return false;
  return episodio.completed === true || episodio.positionSeconds > 0;
}

function oidosDeLibro(bookId: string, episodios: Record<string, { positionSeconds: number; completed?: boolean }>): number {
  const prefijo = `${bookId}-`;
  return Object.entries(episodios).filter(([id, episodio]) => id.startsWith(prefijo) && escuchado(episodio)).length;
}

function oidosEnTotal(episodios: Record<string, { positionSeconds: number; completed?: boolean }>): number {
  return Object.keys(POR_LIBRO).reduce((suma, bookId) => suma + oidosDeLibro(bookId, episodios), 0);
}

function semana(dias: readonly string[]): boolean[] {
  const conjunto = new Set(dias);
  const hoy = new Date();
  return Array.from({ length: 7 }, (_, indice) => {
    const fecha = new Date(hoy);
    fecha.setDate(hoy.getDate() - (6 - indice));
    const iso = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;
    return conjunto.has(iso);
  });
}

function saludo(locale: UiLocale, ahora = new Date()): string {
  const hora = ahora.getHours();
  if (locale === "en") {
    if (hora < 12) return "Good morning";
    if (hora < 20) return "Good afternoon";
    return "Good evening";
  }
  if (hora < 12) return "Buenos días";
  if (hora < 20) return "Buenas tardes";
  return "Buenas noches";
}

function Cabecera({ locale, titulo }: { locale: UiLocale; titulo: string }) {
  return (
    <div>
      <MarcaFila locale={locale} extra={<DemoMarca locale={locale} />} />
      <h1 className="font-display mt-2 text-3xl leading-none">{titulo}</h1>
    </div>
  );
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
  const oidos = oidosEnTotal(library.progress.episodes);
  const oidosGenesis = oidosDeLibro("gn", library.progress.episodes);
  const posicion = library.progress.episodes[id]?.positionSeconds ?? 0;
  const duracion = episode?.durationSeconds ?? 0;
  const avanceEpisodio = duracion > 0 ? Math.min(1, posicion / duracion) : 0;
  const demo = useSyncExternalStore(() => () => {}, demoVisible, () => false);
  const esTono = Boolean(episode && demo);

  return (
    <main id="contenido" className="app-clear mx-auto w-full max-w-lg px-4 pt-3">
      <MarcaFila
        locale={locale}
        extra={
          <Link href="/ajustes" aria-label={t(locale, "navSettings")} className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-border text-sm">
            A
          </Link>
        }
      />
      <p className="mt-2 truncate text-sm text-muted">{saludo(locale)}</p>
      <div className="mt-1 flex items-end justify-between gap-3">
        <h1 className="font-display text-4xl leading-none">{tx(locale, "Hoy", "Today")}</h1>
        <DemoMarca locale={locale} />
      </div>
      <article className="neo-card relative mt-3 overflow-hidden text-[#F4ECE2]">
        <div className="absolute inset-0 bg-[#0C0B09]">
          {obra ? <ObraFoto obra={obra} priority className="h-full w-full object-cover" /> : null}
          <div className="absolute inset-0 bg-gradient-to-t from-[#100E0C]/95 via-[#100E0C]/25 to-[#100E0C]/10" />
        </div>
        <div className="relative flex flex-col justify-end px-4 pt-3 pb-3">
          <div className="mb-2 h-px w-8 bg-[#C9A96E]" />
          <p className="kicker truncate text-[#C9A96E]">{obra ? rotuloObra(obra, locale) : t(locale, "statusPreparing")}</p>
          <h2 className="font-display mt-1 text-2xl leading-tight">
            {episode ? nombreCorto(episode, locale) : rotuloEpisodio(primero ?? { id }, locale) ?? t(locale, "listenComingTitle")}
          </h2>
          <p className="font-display-regular mt-1 truncate text-lg text-[#F4ECE2]">
            {episode ? episode.scriptureRangeLabel : primero ? primero.etiqueta?.[idiomaContenido(locale)] || primero.rango?.replace("-", "–") || "" : ""}
          </p>
          {!esTono && duracion > 0 ? <p className="mt-1 text-sm text-[#F4ECE2]">{`${Math.max(1, Math.round(duracion / 60))} min`}</p> : null}
          {duracion > 0 ? (
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/20" aria-hidden="true">
              <div className="h-full rounded-full bg-[#E0C48A]" style={{ width: `${avanceEpisodio * 100}%` }} />
            </div>
          ) : null}
          <div className="mt-3 flex items-center gap-2">
            <span className="shrink-0 rounded-full border border-[#F4ECE2]/40 px-3 py-1 text-xs whitespace-nowrap text-[#F4ECE2]">
              {esTono ? "Demo" : episode ? tx(locale, "Con audio", "With audio") : t(locale, "statusPreparing")}
            </span>
            {episode ? (
              <Link href="/ahora" onClick={() => toque(library.reduceMotion)} className="inline-flex min-h-11 items-center rounded-2xl bg-acento px-4 text-sm text-acento-ink">
                {t(locale, "catalogListen")}
              </Link>
            ) : (
              <Link href={`/${locale}/catalogo/${id}`} className="inline-flex min-h-11 items-center rounded-2xl bg-acento px-4 text-sm text-acento-ink">
                {t(locale, "seeEpisode")}
              </Link>
            )}
          </div>
        </div>
      </article>
      <section className="neo-card mt-2 px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="cifra text-3xl">{oidos}/{TOTAL_BIBLIA}</p>
            <p className="mt-2 truncate text-sm">{tx(locale, "Episodios", "Episodes")}</p>
          </div>
          <Anillo fraccion={oidos / TOTAL_BIBLIA} />
        </div>
        <div className="mt-3 border-t border-border pt-3">
          <div className="flex items-baseline justify-between gap-3">
            <p className="font-display truncate text-lg leading-none">Génesis</p>
            <p className="cifra shrink-0 text-lg text-muted">{oidosGenesis}/{POR_LIBRO.gn ?? 0}</p>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-foreground/10">
            <div className="h-full rounded-full bg-acento" style={{ width: `${((POR_LIBRO.gn ?? 0) > 0 ? oidosGenesis / (POR_LIBRO.gn ?? 1) : 0) * 100}%` }} />
          </div>
        </div>
      </section>
      <div className="mt-2 grid grid-cols-2 gap-3">
        <Metrica etiqueta={tx(locale, "Días", "Days")} valor={String(dias)}>
          <Semana dias={semana(library.progress.listenedOn ?? [])} />
        </Metrica>
        <Metrica etiqueta={tx(locale, "Minutos", "Minutes")} valor={minutosTexto(library.progress.episodes, locale)} />
      </div>
      <p className="mt-44 text-sm text-muted">{creditoVisible(library.catalog.fuenteTexto[idiomaContenido(locale)], t(locale, "sourceLabel"), t(locale, "sourcePending"))}</p>
    </main>
  );
}

function minutosTexto(episodios: Record<string, { positionSeconds: number }>, locale: UiLocale): string {
  const segundos = Object.values(episodios).reduce((suma, episodio) => suma + Math.max(0, episodio.positionSeconds || 0), 0);
  if (segundos <= 0) return formatoNumero(locale, 0, 0);
  const minutos = segundos / 60;
  return formatoNumero(locale, minutos, minutos < 10 ? 1 : 0);
}

function Metrica({ etiqueta, valor, children }: { etiqueta: string; valor: string; children?: React.ReactNode }) {
  return (
    <section className="neo-card px-4 py-3">
      <p className="cifra text-3xl">{valor}</p>
      <p className="mt-2 truncate text-sm">{etiqueta}</p>
      {children ? <div className="mt-3">{children}</div> : null}
    </section>
  );
}

function Anillo({ fraccion }: { fraccion: number }) {
  const radio = 16;
  const circunferencia = 2 * Math.PI * radio;
  const avance = circunferencia * Math.min(1, Math.max(0, fraccion));
  return (
    <svg viewBox="0 0 40 40" className="size-11 shrink-0" aria-hidden="true">
      <circle cx="20" cy="20" r={radio} fill="none" stroke="currentColor" className="text-foreground/15" strokeWidth="3" />
      <circle cx="20" cy="20" r={radio} fill="none" className="text-acento" stroke="currentColor" strokeWidth="3" strokeDasharray={`${avance} ${circunferencia}`} strokeLinecap="round" transform="rotate(-90 20 20)" />
    </svg>
  );
}

function Semana({ dias }: { dias: boolean[] }) {
  return (
    <div className="flex h-8 items-end gap-1" aria-hidden="true">
      {dias.map((activo, indice) => (
        <span key={indice} className={`w-1.5 rounded-full ${activo ? "h-8 bg-acento" : "h-2 bg-foreground/15"}`} />
      ))}
    </div>
  );
}

export function NeoPath() {
  const library = useLibrary();
  const locale = library.settings.uiLocale;
  const books = booksOnTheWay(library.catalog.books);
  return (
    <main id="contenido" className="app-clear mx-auto w-full max-w-lg px-4 pt-4">
      <Cabecera locale={locale} titulo={t(locale, "navPath")} />
      {library.path.steps.length === 0 ? <p className="mt-4 text-sm text-muted">{t(locale, "pathEmpty")}</p> : null}
      <ol className="mt-4 space-y-6">
        {(["ot", "nt"] as const).map((testamento) => (
          <li key={testamento}>
            <p className="kicker text-muted">{testamento === "ot" ? t(locale, "testamentOt") : t(locale, "testamentNt")}</p>
            <ol className="mt-2 border-l border-border pl-4">
              {books
                .filter((book) => book.testament === testamento)
                .map((book) => {
                  const state = journeyState(book.id, library.path, library.progress, playableByBook(library.catalog.episodes));
                  const total = POR_LIBRO[book.id] ?? 0;
                  const oidos = oidosDeLibro(book.id, library.progress.episodes);
                  return (
                    <li key={book.id} className="relative py-2">
                      <span className={`absolute -left-[1.3rem] top-4 size-2 rounded-full ${oidos > 0 || state !== "ahead" ? "bg-acento" : "bg-foreground/20"}`} />
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="font-display truncate text-lg leading-tight">{book.name[idiomaContenido(locale)] || book.name.es}</span>
                        <span className="tabular shrink-0 text-xs text-muted">{oidos}/{total}</span>
                      </div>
                      <div className="mt-1 h-1 overflow-hidden rounded-full bg-foreground/10">
                        <div className="h-full rounded-full bg-acento" style={{ width: total > 0 ? `${(oidos / total) * 100}%` : "0%" }} />
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
    <main id="contenido" className="app-clear mx-auto w-full max-w-lg px-4 pt-4">
      <Cabecera locale={locale} titulo={t(locale, "navLibrary")} />
      <input
        value={consulta}
        onChange={(event) => setConsulta(event.target.value)}
        placeholder={tx(locale, "Buscar libro o episodio", "Search a book or episode")}
        className="neo-card mt-4 min-h-12 w-full bg-transparent px-4 text-base outline-none"
        aria-label={tx(locale, "Buscar", "Search")}
      />
      <div className="mt-3 flex flex-wrap gap-2">
        {(
          [
            ["todos", tx(locale, "Todo", "All")],
            ["ot", tx(locale, "Antiguo", "Old")],
            ["nt", tx(locale, "Nuevo", "New")],
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
              className={`neo-chip shrink-0 ${activo ? "border-acento text-foreground" : "text-muted"}`}
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
    <main id="contenido" className="app-clear mx-auto w-full max-w-lg px-4 pt-2">
      <Cabecera locale={locale} titulo={t(locale, "navSettings")} />
      <Grupo titulo={t(locale, "settingsTheme")}>
        {(["system", "light", "dark"] as const).map((theme) => (
          <Fila key={theme} label={t(locale, theme === "system" ? "settingsThemeSystem" : theme === "light" ? "settingsThemeLight" : "settingsThemeDark")} onClick={() => { toque(reduceMotion); updateSettings({ theme }); }}>
            <span className="text-sm text-acento">{settings.theme === theme ? "●" : ""}</span>
          </Fila>
        ))}
      </Grupo>
      <Grupo titulo={t(locale, "settingsLanguage")}>
        {(["es", "en"] as const).map((uiLocale) => (
          <Fila key={uiLocale} label={t(locale, uiLocale === "es" ? "commonSpanish" : "commonEnglish")} onClick={() => updateSettings({ uiLocale })}>
            <span className="text-sm text-acento">{settings.uiLocale === uiLocale ? "●" : ""}</span>
          </Fila>
        ))}
      </Grupo>
      <Grupo titulo={t(locale, "settingsSpeed")}>
        <div className="grid grid-cols-5 gap-2 px-4 py-2">
          {([0.75, 1, 1.25, 1.5, 2] as const).map((rate) => (
            <button key={rate} type="button" className={`tabular inline-flex min-h-11 items-center justify-center rounded-full border px-1 text-sm ${settings.rate === rate ? "border-acento bg-acento text-acento-ink" : "border-border"}`} onClick={() => setRate(rate)}>
              {formatoNumero(locale, rate)}×
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
      <Link href="/leer" className="neo-card mt-4 flex min-h-11 items-center justify-between px-4">
        <span className="font-display text-lg">{tx(locale, "Lectura", "Reading")}</span>
        <span className="text-sm text-muted">{tx(locale, "Texto de prueba", "Test text")}</span>
      </Link>
      <Link href="/referencias" className="neo-card mt-4 flex min-h-11 items-center justify-between px-4">
        <span className="font-display text-lg">{tx(locale, "Al margen", "Margin")}</span>
        <span className="text-sm text-muted">OpenBible</span>
      </Link>
      <Link href="/notas" className="neo-card mt-4 flex min-h-11 items-center justify-between px-4">
        <span className="font-display text-lg">{tx(locale, "Notas", "Notes")}</span>
        <span className="text-sm text-muted">{tx(locale, "En este aparato", "On this device")}</span>
      </Link>
      <Link href="/avisos" className="neo-card mt-4 flex min-h-11 items-center justify-between px-4">
        <span className="font-display text-lg">{tx(locale, "Avisos", "Reminders")}</span>
        <span className="text-sm text-muted">{tx(locale, "Solo locales", "Local only")}</span>
      </Link>
      <Link href="/descargas" className="neo-card mt-4 flex min-h-11 items-center justify-between px-4">
        <span className="font-display text-lg">{tx(locale, "Descargas", "Downloads")}</span>
        <span className="text-sm text-muted">{tx(locale, "Solo en la app", "App only")}</span>
      </Link>
      <Link href="/membresia" className="neo-card mt-4 flex min-h-14 items-center justify-between px-4">
        <span>{t(locale, "navMembership")}</span>
        <span className="text-sm text-muted">{t(locale, "statusPreparing")}</span>
      </Link>
    </main>
  );
}

function Grupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="mt-2">
      <h2 className="kicker px-1 text-muted">{titulo}</h2>
      <div className="neo-card mt-2 divide-y divide-border">{children}</div>
    </section>
  );
}

function Fila({ label, children, onClick }: { label: string; children: React.ReactNode; onClick?: () => void }) {
  const clase = "flex min-h-11 w-full items-center justify-between gap-3 px-4 text-left";
  if (onClick) {
    return (
      <button type="button" className={clase} onClick={onClick}>
        <span className="min-w-0 flex-1">{label}</span>
        <span className="shrink-0">{children}</span>
      </button>
    );
  }
  return (
    <div className={clase}>
      <span className="min-w-0 flex-1">{label}</span>
      <span className="shrink-0">{children}</span>
    </div>
  );
}

export function NeoMembership() {
  const { settings } = useLibrary();
  const locale = settings.uiLocale;
  const obra = obraDeEpisodio("gn-05");
  return (
    <main id="contenido" className="app-clear mx-auto w-full max-w-lg px-4 pt-4">
      <Cabecera locale={locale} titulo={t(locale, "navMembership")} />
      <article className="neo-card relative mt-4 overflow-hidden text-[#F4ECE2]">
        <div className="absolute inset-0 bg-[#100E0C]">{obra ? <ObraFoto obra={obra} className="h-full w-full object-cover opacity-70" /> : null}</div>
        <div className="relative bg-gradient-to-t from-[#100E0C] via-[#100E0C]/80 to-[#100E0C]/20 p-5">
          <p className="kicker text-[#C9A96E]">{t(locale, "statusPreparing")}</p>
          <h2 className="font-display mt-2 text-3xl leading-tight">{tx(locale, "Plan anual", "Annual plan")}</h2>
          <p className="font-display-regular mt-2 text-2xl text-[#F4ECE2]">{t(locale, "membershipNoPrice")}</p>
        </div>
      </article>
      <p className="mt-4 text-sm text-muted">{t(locale, "membershipBody")}</p>
      {obra ? <div className="mt-4"><Placa obra={obra} lang={locale} /></div> : null}
    </main>
  );
}
