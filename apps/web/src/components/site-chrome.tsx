"use client";

import { formatClock, nombreCorto, playableEpisodes, t, type MessageKey } from "@audite/domain";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { obraDeEpisodio, obraWebp } from "@audite/content/obras";
import { Mark, Wordmark } from "@/components/brand";
import { useLibrary } from "@/components/library";
import { esRutaPublica } from "@/sitio/i18n";

const links: Array<{ href: string; key: MessageKey }> = [
  { href: "/escuchar", key: "navListen" },
  { href: "/camino", key: "navPath" },
  { href: "/biblioteca", key: "navLibrary" },
  { href: "/ajustes", key: "navSettings" },
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
                {t(locale, link.key)}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

export function TabBar() {
  const pathname = usePathname();
  const { settings } = useLibrary();
  const locale = settings.uiLocale;
  if (pathname === "/ahora" || esRutaPublica(pathname)) return null;
  return (
    <nav
      aria-label={t(locale, "wordmark")}
      className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-4 rounded-3xl border border-white/10 bg-background/80 py-1 backdrop-blur-md md:hidden"
    >
      {links.map((link) => {
        const current = active(pathname, link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={current ? "page" : undefined}
            className={`flex min-h-12 flex-col items-center justify-center gap-1 text-[11px] ${current ? "text-foreground" : "text-muted"}`}
          >
            <span className={`h-0.5 w-4 rounded-full ${current ? "bg-[#C9A96E]" : "bg-transparent"}`} />
            {t(locale, link.key)}
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
  if (pathname === "/ahora" || esRutaPublica(pathname)) return null;
  const episode = catalog.episodes.find((item) => item.id === player.episodeId);
  const listo = playableEpisodes(catalog)[0] ?? null;
  const activo = Boolean(episode && player.episodeId && player.status !== "idle");
  const visible = episode ?? listo;
  const playing = player.status === "playing";
  return (
    <div className="fixed inset-x-3 bottom-20 z-40 md:bottom-4">
      <div className="neo-card mx-auto flex w-full max-w-lg items-center gap-3 bg-background/75 px-3 py-2 backdrop-blur-md">
        <Link href="/ahora" className="flex min-h-11 min-w-0 flex-1 items-center gap-3" aria-label={t(locale, "openNow")}>
          {obraDeEpisodio(episode?.id ?? "gn-01") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={obraWebp(obraDeEpisodio(episode?.id ?? "gn-01")!)} alt="" className="size-11 shrink-0 rounded-2xl object-cover" />
          ) : (
            <span className="size-11 shrink-0 rounded-2xl bg-[#0C0B09]" />
          )}
          <span className="min-w-0">
            <span className="block truncate text-sm">{visible ? nombreCorto(visible, locale) : t(locale, "statusPreparing")}</span>
            <span className="tabular block text-xs text-muted">
              {activo ? `${formatClock(player.globalTime)} / ${formatClock(player.duration)}` : visible ? visible.scriptureRangeLabel : "—"}
            </span>
          </span>
        </Link>
        <button
          type="button"
          disabled={!activo}
          onClick={toggle}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-2xl bg-[#E0C48A] px-3 text-sm text-[#100E0C] disabled:cursor-not-allowed disabled:bg-transparent disabled:text-muted"
          aria-label={activo ? (playing ? t(locale, "playerPause") : t(locale, "playerPlay")) : t(locale, "statusPreparing")}
        >
          {activo ? (playing ? t(locale, "playerPause") : t(locale, "playerPlay")) : "–"}
        </button>
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
        <p>{t(locale, "footerPilot")}</p>
        <p>{t(locale, "footerLocal")}</p>
        <Link href="/es" className="inline-flex min-h-11 items-center" aria-label="Audite">
          <Wordmark locale={locale} className="h-6 w-auto" />
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
  const publicPage = pathname === "/ahora" || esRutaPublica(pathname);
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <div className={publicPage ? "flex-1" : "flex-1"}>{children}</div>
      <SiteFooter />
    </div>
  );
}
