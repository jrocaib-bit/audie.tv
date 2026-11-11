"use client";

import { COLOR_HEX, diaLiturgico, formatClock, nombreCorto, playableEpisodes, t } from "@audite/domain";
import { Pause, Play } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useRef } from "react";
import { obraDeEpisodio, obraWebp } from "@audite/content/obras";
import { Mark, Wordmark } from "@/components/brand";
import { useLibrary } from "@/components/library";
import { fechaDeCuando } from "@/lib/cuando";
import { medir } from "@/lib/medicion";
import { irAlReproductor } from "@/lib/movimiento";
import { esRutaPublica } from "@/sitio/i18n";

const links = [
  { href: "/escuchar", es: "Inicio", en: "Home" },
  { href: "/buscar", es: "Buscar", en: "Search" },
  { href: "/biblioteca", es: "Biblioteca", en: "Library" },
];

function active(pathname: string, href: string): boolean {
  if (href === "/escuchar") return pathname === "/" || pathname === "/escuchar";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname();
  const { settings } = useLibrary();
  const locale = settings.uiLocale;
  if (pathname === "/ahora" || esRutaPublica(pathname)) return null;
  return (
    <header className="sticky top-0 z-40 hidden border-b border-border bg-background/85 backdrop-blur md:block">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:bg-card focus:px-3 focus:py-2"
      >
        {t(locale, "skip")}
      </a>
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-5 py-3">
        <Link href="/escuchar" className="flex items-center gap-2.5 text-foreground">
          <Mark />
          <Wordmark locale={locale} />
        </Link>
        <nav aria-label={t(locale, "navLabel")} className="hidden gap-1 md:flex">
          {links.map((link) => {
            const current = active(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={current ? "page" : undefined}
                className={`inline-flex min-h-11 items-center rounded-full px-3 text-sm ${current ? "bg-foreground text-background" : "text-muted"}`}
              >
                {locale === "en" ? link.en : link.es}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

export function VeloCromo() {
  const pathname = usePathname();
  if (pathname === "/ahora" || pathname === "/anio" || pathname === "/coche" || pathname === "/compartir" || esRutaPublica(pathname)) return null;
  return <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 h-52 bg-gradient-to-t from-background from-35% via-background/80 to-transparent md:hidden" />;
}

export function TabBar() {
  const pathname = usePathname();
  const { settings } = useLibrary();
  const locale = settings.uiLocale;
  if (pathname === "/ahora" || pathname === "/anio" || pathname === "/coche" || pathname === "/compartir" || esRutaPublica(pathname)) return null;
  return (
    <nav
      aria-label={t(locale, "wordmark")}
      className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-3 rounded-3xl border border-border bg-background/80 py-1 backdrop-blur-md md:hidden"
    >
      {links.map((link) => {
        const current = active(pathname, link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={current ? "page" : undefined}
            className={`audite-pulso flex min-h-12 flex-col items-center justify-center gap-1 text-[11px] ${current ? "text-foreground" : "text-muted"}`}
          >
            <span className={`h-0.5 w-4 rounded-full ${current ? "bg-acento" : "bg-transparent"}`} />
            {locale === "en" ? link.en : link.es}
          </Link>
        );
      })}
    </nav>
  );
}

export function MiniPlayer() {
  const pathname = usePathname();
  const { catalog, player, settings, toggle } = useLibrary();
  const locale = settings.uiLocale;
  const router = useRouter();
  const cuando = useSearchParams().get("cuando");
  const origen = useRef(0);
  const colorDia = COLOR_HEX[diaLiturgico(useMemo(() => fechaDeCuando(cuando), [cuando])).color];
  if (pathname === "/ahora" || pathname === "/anio" || pathname === "/coche" || pathname === "/compartir" || esRutaPublica(pathname)) return null;
  const episode = catalog.episodes.find((item) => item.id === player.episodeId);
  const listo = playableEpisodes(catalog)[0] ?? null;
  const activo = Boolean(episode && player.episodeId && player.status !== "idle");
  const visible = episode ?? listo;
  const playing = player.status === "playing";
  const fraccion = player.duration > 0 ? Math.min(1, player.globalTime / player.duration) : 0;
  return (
    <div
      className="fixed inset-x-3 bottom-20 z-40 touch-none md:bottom-4"
      onPointerDown={(event) => { origen.current = event.clientY; }}
      onPointerUp={(event) => { if (origen.current - event.clientY > 42) router.push("/ahora"); }}
    >
      <div className="neo-card relative mx-auto flex w-full max-w-lg items-center gap-3 overflow-hidden bg-background/75 px-3 py-2 backdrop-blur-md">
        <span className="absolute inset-x-0 bottom-0 h-0.5 bg-foreground/10">
          <span className="block h-full transition-[width] duration-300" style={{ width: `${fraccion * 100}%`, background: colorDia }} />
        </span>
        <Link href="/ahora" className="audite-pulso flex min-h-11 min-w-0 flex-1 items-center gap-3" aria-label={t(locale, "openNow")} onClick={(event) => { event.preventDefault(); irAlReproductor(router.push); }}>
          {obraDeEpisodio(episode?.id ?? "gn-01") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={obraWebp(obraDeEpisodio(episode?.id ?? "gn-01")!)} alt="" className="audite-portada size-11 shrink-0 rounded-2xl object-cover" />
          ) : (
            <span className="size-11 shrink-0 rounded-2xl bg-[#0C0B09]" />
          )}
          <span className="min-w-0">
            <span className="font-display block truncate text-base leading-tight">{visible ? nombreCorto(visible, locale) : (locale === "en" ? "Soon" : "Pronto")}</span>
            {activo || visible?.scriptureRangeLabel ? (
              <span className="tabular block truncate text-xs text-muted">
                {activo ? `${formatClock(player.globalTime)} / ${formatClock(player.duration)}` : visible?.scriptureRangeLabel}
              </span>
            ) : null}
          </span>
        </Link>
        {listo && !activo ? (
          <Link href="/ahora" aria-label={t(locale, "playerPlay")} className="audite-pulso inline-flex size-11 items-center justify-center rounded-full bg-[#C9A96E] text-[#100E0C]" onClick={(event) => { event.preventDefault(); irAlReproductor(router.push); }}>
            <Play strokeWidth={1.5} className="size-5" />
          </Link>
        ) : (
          <button
            type="button"
            disabled={!activo}
            onClick={toggle}
            className={`audite-pulso inline-flex size-11 items-center justify-center rounded-full bg-[#C9A96E] text-[#100E0C] disabled:cursor-not-allowed disabled:bg-transparent disabled:text-muted ${playing ? "play-respira" : ""}`}
            aria-label={activo ? (playing ? t(locale, "playerPause") : t(locale, "playerPlay")) : t(locale, "statusPreparing")}
          >
            {playing ? <Pause strokeWidth={1.5} className="size-5" /> : <Play strokeWidth={1.5} className="size-5" />}
          </button>
        )}
      </div>
    </div>
  );
}

export function SiteFooter() {
  const pathname = usePathname();
  const { settings } = useLibrary();
  const locale = settings.uiLocale;
  if (pathname === "/ahora" || esRutaPublica(pathname)) return null;
  return (
    <footer className="hidden border-t border-border md:block">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-5 py-8 text-sm text-muted">
        <Link href="/es" className="inline-flex min-h-11 items-center" aria-label="Audite">
          <Wordmark locale={locale} className="h-6 w-auto" />
        </Link>
        <Link href="/ayuda" className="underline decoration-border underline-offset-4">{locale === "en" ? "Help" : "Ayuda"}</Link>
        <Link href="/contacto" className="underline decoration-border underline-offset-4">{locale === "en" ? "Contact" : "Contacto"}</Link>
        <a href="mailto:soporte@audite.tv" className="inline-flex min-h-11 items-center" onClick={() => medir("cta_clicked", { form_id: "soporte", cta_id: "mailto_soporte", ubicacion: "pie", idioma: locale, plataforma: "web" })}>soporte@audite.tv</a>
        <p>La voz y la música están generadas con IA.</p>
        <Link href="/es/privacidad" className="underline decoration-border underline-offset-4">
          {locale === "en" ? "Privacy" : "Privacidad"}
        </Link>
        <Link href="/aviso-legal" className="underline decoration-border underline-offset-4">
          {locale === "en" ? "Legal notice" : "Aviso legal"}
        </Link>
        <Link href="/membresia" className="underline decoration-border underline-offset-4">
          {t(locale, "navMembership")}
        </Link>
      </div>
    </footer>
  );
}

export function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { reduceMotion } = useLibrary();
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <div key={pathname} className={reduceMotion ? "flex-1" : "audite-fundido flex-1"}>{children}</div>
      <SiteFooter />
    </div>
  );
}
