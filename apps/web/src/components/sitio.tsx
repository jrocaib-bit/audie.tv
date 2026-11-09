import { loadAppCatalog } from "@audite/content/app-catalog";
import { obraDeEpisodio, obrasVisibles, rotuloObra } from "@audite/content/obras";
import { creditoVisible, nombreEpisodio, textoOPendiente } from "@audite/domain";
import Link from "next/link";
import { Wordmark } from "@/components/brand";
import { ListaPorLibros } from "@/components/lista-libros";
import { ObraFoto, Placa } from "@/components/placa";
import { copiaSitio, idiomasPublicos, type SitioCopy } from "@/sitio/i18n";

function idiomaUi(lang: string): "es" | "en" {
  return lang === "en" ? "en" : "es";
}

export function SitioHeader({ lang, copy, sobreObra = false }: { lang: string; copy: SitioCopy; sobreObra?: boolean }) {
  const ui = idiomaUi(lang);
  return (
    <header className={sobreObra ? "absolute inset-x-0 top-0 z-20" : "border-b border-border"}>
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4 md:px-8">
        <Link href={`/${lang}`} className="inline-flex min-h-11 items-center">
          <Wordmark locale={ui} tono={sobreObra ? "blanco" : "auto"} className="h-8 w-auto md:h-9" />
        </Link>
        <nav className={`flex w-full items-center justify-between text-sm sm:w-auto sm:justify-start sm:gap-x-5 ${sobreObra ? "text-[#F4ECE2]" : ""}`}>
          <Link href={`/${lang}`} className="inline-flex min-h-11 items-center">
            {copy.navHome}
          </Link>
          <Link href={`/${lang}/catalogo`} className="inline-flex min-h-11 items-center">
            {copy.navCatalog}
          </Link>
          <Link href={`/${lang}/membresia`} className="inline-flex min-h-11 items-center">
            {copy.navMembership}
          </Link>
          {idiomasPublicos.map((idioma) => (
            <Link
              key={idioma}
              href={`/${idioma}`}
              hrefLang={idioma}
              className={`inline-flex min-h-11 items-center text-xs uppercase tracking-[0.14em] ${idioma === lang ? (sobreObra ? "text-[#C9A96E]" : "text-acento") : sobreObra ? "text-[#B7AB9C]" : "text-muted"}`}
            >
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
  const ui = idiomaUi(lang);
  const fuente = loadAppCatalog().fuenteTexto[ui];
  const portada = obraDeEpisodio("gn-01");
  const obras = obrasVisibles();
  if (!copy || !portada) return null;
  return (
    <>
      <SitioHeader lang={lang} copy={copy} sobreObra />
      <main>
        <section className="relative min-h-[100svh] bg-[#0C0B09] text-[#F4ECE2]">
          <div className="absolute inset-0 overflow-hidden">
            <ObraFoto obra={portada} priority mover className="h-full w-full object-cover" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#100E0C]/80 via-[#100E0C]/35 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#100E0C] via-[#100E0C]/55 to-transparent" />
          <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-6xl flex-col justify-end px-5 pt-40 pb-10 md:px-8 md:pt-28 md:pb-14">
            <div className="max-w-3xl bg-gradient-to-t from-[#100E0C]/90 via-[#100E0C]/75 to-transparent px-1 py-4">
            <p className="kicker text-[#C9A96E]">{rotuloObra(portada, ui)}</p>
            <h1 className="font-display mt-4 max-w-4xl text-5xl leading-[0.95] text-[#F4ECE2] md:text-7xl">{copy.homeTitle}</h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-[#F4ECE2]">{copy.homeLede}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={`/${lang}/catalogo`} className="inline-flex min-h-12 items-center rounded-full bg-[#C9A96E] px-6 text-[#100E0C]">
                {copy.homeCta}
              </Link>
              <Link href={`/${lang}/membresia`} className="inline-flex min-h-12 items-center rounded-full border border-[#F4ECE2]/40 px-6 text-[#F4ECE2]">
                {copy.navMembership}
              </Link>
            </div>
            <div className="mt-10 max-w-xl">
              <Placa obra={portada} lang={ui} />
            </div>
            </div>
          </div>
        </section>
        <section className="bg-background px-5 py-16 md:px-8">
          <div className="mx-auto grid w-full max-w-6xl gap-12 md:grid-cols-2">
            <div>
              <h2 className="font-display text-4xl">{copy.dailyTitle}</h2>
              <p className="mt-4 max-w-md leading-relaxed text-muted">{copy.dailyBody}</p>
            </div>
            <div>
              <h2 className="font-display text-4xl">{copy.pathTitle}</h2>
              <p className="mt-4 max-w-md leading-relaxed text-muted">{copy.pathBody}</p>
            </div>
          </div>
          <ul className="mx-auto mt-14 flex w-full max-w-6xl gap-3 overflow-x-auto pb-2">
            {obras.map((obra) => (
              <li key={obra.id} className="w-44 shrink-0">
                <Link href={`/${lang}/catalogo/${obra.episodio}`} className="block min-h-11">
                  <span className="relative block aspect-[3/4] overflow-hidden bg-[#0C0B09]">
                    <ObraFoto obra={obra} className="h-full w-full object-cover" />
                  </span>
                  <span className="mt-2 block text-xs tracking-[0.14em] text-brand uppercase">{rotuloObra(obra, ui)}</span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mx-auto mt-12 w-full max-w-6xl text-sm text-muted">{creditoVisible(fuente, copy.aboutTitle, copy.sourcePending)}</p>
        </section>
      </main>
    </>
  );
}

export function SitioCatalogo({ lang }: { lang: string }) {
  const copy = copiaSitio(lang);
  const catalogo = loadAppCatalog();
  if (!copy) return null;
  const ui = idiomaUi(lang);
  const obras = obrasVisibles();
  return (
    <>
      <SitioHeader lang={lang} copy={copy} />
      <main className="mx-auto w-full max-w-6xl px-5 py-12 md:px-8 md:py-16">
        <p className="kicker">{copy.navCatalog}</p>
        <h1 className="font-display mt-3 text-5xl md:text-6xl">{copy.catalogTitle}</h1>
        <p className="mt-4 max-w-2xl text-muted">{copy.catalogIntro}</p>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {obras.map((obra) => {
            const episodio = catalogo.pendientes.find((item) => item.id === obra.episodio);
            const titulo = episodio ? nombreEpisodio(episodio, ui) : obra.escena[ui];
            const estado = episodio?.propuesta ? copy.proposed : episodio?.presentacion === "revision" ? copy.review : copy.pending;
            return (
              <li key={obra.id}>
                <Link href={`/${lang}/catalogo/${obra.episodio}`} className="group block min-h-11 overflow-hidden bg-[#0C0B09] text-[#F4ECE2]">
                  <span className="relative block aspect-[4/5] overflow-hidden">
                    <ObraFoto obra={obra} className="h-full w-full object-cover" />
                    <span className="absolute inset-0 bg-gradient-to-t from-[#100E0C] via-[#100E0C]/10 to-transparent" />
                    <span className="absolute inset-x-0 bottom-0 p-4">
                      <span className="kicker text-[#C9A96E]">{rotuloObra(obra, ui)}</span>
                      <span className="mt-2 block font-serif text-3xl leading-tight">{textoOPendiente(titulo, copy.pending)}</span>
                      <span className="mt-2 block text-sm text-[#B7AB9C]">{estado}</span>
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="mt-16">
          <ListaPorLibros catalog={catalogo} locale={ui} />
        </div>
      </main>
    </>
  );
}

export function SitioMembresia({ lang }: { lang: string }) {
  const copy = copiaSitio(lang);
  const obra = obraDeEpisodio("gn-05");
  if (!copy || !obra) return null;
  const ui = idiomaUi(lang);
  return (
    <>
      <SitioHeader lang={lang} copy={copy} />
      <main className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-12 md:grid-cols-[1.1fr_0.9fr] md:px-8 md:py-16">
        <div>
          <p className="kicker">{copy.navMembership}</p>
          <h1 className="font-display mt-3 text-5xl md:text-6xl">{copy.membershipTitle}</h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed">{copy.membershipBody}</p>
          <p className="mt-4 max-w-xl text-muted">{copy.noPrice}</p>
          <Link href="/escuchar" className="mt-8 inline-flex min-h-12 items-center rounded-full bg-primary px-6 text-primary-foreground">
            {copy.appLink}
          </Link>
        </div>
        <div className="relative min-h-80 overflow-hidden bg-[#0C0B09]">
          <ObraFoto obra={obra} className="h-full w-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 p-4">
            <Placa obra={obra} lang={ui} />
          </div>
        </div>
      </main>
    </>
  );
}
