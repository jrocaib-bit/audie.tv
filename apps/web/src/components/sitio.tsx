import { loadAppCatalog } from "@audite/content/app-catalog";
import { creditoVisible, textoOPendiente } from "@audite/domain";
import Link from "next/link";
import { Mark, Wordmark } from "@/components/brand";
import { ListaPorLibros } from "@/components/lista-libros";
import { copiaSitio, idiomasPublicos, type SitioCopy } from "@/sitio/i18n";

export function SitioHeader({ lang, copy }: { lang: string; copy: SitioCopy }) {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-4 px-5 py-4">
        <Link href={`/${lang}`} className="flex items-center gap-2.5 text-foreground">
          <Mark />
          <Wordmark locale={lang === "en" ? "en" : "es"} />
        </Link>
        <nav className="flex flex-wrap items-center gap-4 text-sm">
          <Link href={`/${lang}`}>{copy.navHome}</Link>
          <Link href={`/${lang}/catalogo`}>{copy.navCatalog}</Link>
          <Link href={`/${lang}/membresia`}>{copy.navMembership}</Link>
          {idiomasPublicos.map((idioma) => (
            <Link key={idioma} href={`/${idioma}`} hrefLang={idioma} className={idioma === lang ? "text-foreground" : "text-muted"}>
              {idioma}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function SitioHome({ lang }: { lang: string }) {
  const copy = copiaSitio(lang);
  const fuente = loadAppCatalog().fuenteTexto[lang === "en" ? "en" : "es"];
  if (!copy) return null;
  return (
    <>
      <SitioHeader lang={lang} copy={copy} />
      <main className="mx-auto w-full max-w-3xl px-5 py-14">
        <p className="kicker">{copy.homeKicker}</p>
        <h1 className="mt-3 font-serif text-5xl leading-tight md:text-6xl">{copy.homeTitle}</h1>
        <p className="mt-6 text-lg leading-relaxed text-muted">{copy.homeLede}</p>
        <section className="mt-12">
          <h2 className="font-serif text-3xl">{copy.dailyTitle}</h2>
          <p className="mt-3 text-muted">{copy.dailyBody}</p>
        </section>
        <section className="mt-10">
          <h2 className="font-serif text-3xl">{copy.pathTitle}</h2>
          <p className="mt-3 text-muted">{copy.pathBody}</p>
        </section>
        <p className="mt-10 text-muted">{creditoVisible(fuente, copy.aboutTitle, copy.sourcePending)}</p>
        <Link href={`/${lang}/catalogo`} className="mt-10 inline-flex min-h-12 items-center rounded-full bg-primary px-5 text-primary-foreground">
          {copy.homeCta}
        </Link>
      </main>
    </>
  );
}

export function SitioCatalogo({ lang }: { lang: string }) {
  const copy = copiaSitio(lang);
  const catalogo = loadAppCatalog();
  if (!copy) return null;
  const uiLang = lang === "en" ? "en" : "es";
  const pendiente = copy.pending;
  return (
    <>
      <SitioHeader lang={lang} copy={copy} />
      <main className="mx-auto w-full max-w-3xl px-5 py-14">
        <h1 className="font-serif text-5xl">{copy.catalogTitle}</h1>
        <p className="mt-4 text-muted">{copy.catalogIntro}</p>
        {catalogo.episodes.length > 0 ? (
          <ul className="mt-8 space-y-3">
            {catalogo.episodes.map((episodio) => (
              <li key={episodio.id} className="border border-border bg-card p-4">
                <p className="text-sm text-muted">{copy.ready}</p>
                <p className="font-serif text-3xl">{textoOPendiente(episodio.title, pendiente)}</p>
                <p className="text-sm text-muted">{episodio.scriptureRangeLabel}</p>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="mt-8">
          <ListaPorLibros catalog={catalogo} locale={uiLang} />
        </div>
      </main>
    </>
  );
}

export function SitioMembresia({ lang }: { lang: string }) {
  const copy = copiaSitio(lang);
  if (!copy) return null;
  return (
    <>
      <SitioHeader lang={lang} copy={copy} />
      <main className="mx-auto w-full max-w-3xl px-5 py-14">
        <h1 className="font-serif text-5xl">{copy.membershipTitle}</h1>
        <p className="mt-6 text-lg leading-relaxed">{copy.membershipBody}</p>
        <p className="mt-4 text-muted">{copy.noPrice}</p>
        <Link href="/escuchar" className="mt-8 inline-block underline decoration-border underline-offset-4">
          {copy.appLink}
        </Link>
      </main>
    </>
  );
}
