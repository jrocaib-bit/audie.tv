"use client";

import { formatClock, frameAt, nombreCorto, t, type MessageKey } from "@audite/domain";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
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
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-border bg-background/95 backdrop-blur md:hidden"
    >
      {links.map((link) => {
        const current = active(pathname, link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={current ? "page" : undefined}
            className={`flex min-h-14 items-center justify-center px-1 text-center text-xs ${current ? "text-foreground" : "text-muted"}`}
          >
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
  if (pathname === "/ahora" || esRutaPublica(pathname) || !player.episodeId || player.status === "idle") return null;
  const episode = catalog.episodes.find((item) => item.id === player.episodeId);
  const frame = frameAt(catalog.cues, catalog.captions, player.globalTime, true);
  const artwork = catalog.artworks.find((item) => item.id === frame.artworkId);
  const playing = player.status === "playing";
  return (
    <div className="fixed inset-x-0 bottom-14 z-40 border-t border-border bg-background/95 backdrop-blur md:bottom-0">
      <div className="mx-auto flex w-full max-w-5xl items-center gap-3 px-3 py-2">
        <Link href="/ahora" className="flex min-w-0 flex-1 items-center gap-3" aria-label={t(locale, "openNow")}>
          {artwork ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={artwork.publicPath} alt="" className="h-12 w-12 bg-[#141210] object-contain" />
          ) : (
            <span className="h-12 w-12 bg-[#141210]" />
          )}
          <span className="min-w-0">
            <span className="block truncate font-serif text-lg leading-tight">{episode ? nombreCorto(episode, locale) : ""}</span>
            <span className="block text-xs text-muted tabular-nums">
              {formatClock(player.globalTime)} / {formatClock(player.duration)}
            </span>
          </span>
        </Link>
        <button
          type="button"
          onClick={toggle}
          className="min-h-11 min-w-11 rounded-full bg-primary px-4 text-sm text-primary-foreground"
          aria-label={playing ? t(locale, "playerPause") : t(locale, "playerPlay")}
        >
          {playing ? t(locale, "playerPause") : t(locale, "playerPlay")}
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
    <footer className="border-t border-border">
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
      <div className={publicPage ? "flex-1" : "flex-1 pb-40 md:pb-28"}>{children}</div>
      <SiteFooter />
    </div>
  );
}
