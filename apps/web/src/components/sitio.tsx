import { loadAppCatalog } from "@audite/content/app-catalog";
import { obraDeEpisodio, obrasVisibles, rotuloObra } from "@audite/content/obras";
import { creditoVisible, nombreEpisodio, textoOPendiente, textosAlta } from "@audite/domain";
import Link from "next/link";
import { Wordmark } from "@/components/brand";
import { ListaPorLibros } from "@/components/lista-libros";
import { ObraFoto, Placa } from "@/components/placa";
import { portadaDeReto } from "@audite/content/obras-creditos";
import { RETOS } from "@/lib/retos";
import { BarraFija, CtaPar, Planes } from "@/components/conversion";
import { TarjetaCuadro } from "@/components/v2/fichas";
import { RecordarIdioma, SelectorIdioma } from "@/components/selector-idioma";
import { copiaSitio, type SitioCopy } from "@/sitio/i18n";

function idiomaUi(lang: string): "es" | "en" {
  return lang === "en" ? "en" : "es";
}

export function SitioHeader({ lang, copy, sobreObra = false }: { lang: string; copy: SitioCopy; sobreObra?: boolean }) {
  const ui = idiomaUi(lang);
  return (
    <header className={sobreObra ? "absolute inset-x-0 top-0 z-20" : "bg-[#100E0C]"}>
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4 md:px-8">
        <Link href={`/${lang}`} className="inline-flex min-h-11 items-center">
          <Wordmark locale={ui} tono="blanco" className="h-8 w-auto md:h-9" />
        </Link>
        <nav className="flex items-center gap-4 text-sm text-[#F4ECE2]">
          <Link href={`/${lang}`} className="hidden min-h-11 items-center md:inline-flex">
            {copy.navHome}
          </Link>
          <Link href={`/${lang}/catalogo`} className="hidden min-h-11 items-center md:inline-flex">
            {copy.navCatalog}
          </Link>
          <Link href={`/${lang}/membresia`} className="hidden min-h-11 items-center lg:inline-flex">
            {copy.navMembership}
          </Link>
          <Link href={`/${lang}/entrar`} className="inline-flex min-h-11 items-center">
            {copy.ctaSign}
          </Link>
          <SelectorIdioma lang={lang} claro={sobreObra} />
        </nav>
      </div>
    </header>
  );
}

export function SitioHome({ lang }: { lang: string }) {
  const copy = copiaSitio(lang);
  const ui = idiomaUi(lang);
  const legal = textosAlta(lang);
  const fuente = loadAppCatalog().fuenteTexto[ui];
  const portada = obraDeEpisodio("gn-01");
  const obras = obrasVisibles();
  const catalogo = loadAppCatalog();
  const adviento = portadaDeReto("adviento-isaias");
  if (!copy || !portada) return null;
  const credito = creditoVisible(fuente, "", "");
  return (
    <>
      <RecordarIdioma />
      <SitioHeader lang={lang} copy={copy} sobreObra />
      <main className="bg-[#100E0C] pb-28 text-[#F4ECE2] md:pb-0">
        <section id="hero" className="camino-tramo relative min-h-[100svh] bg-[#100E0C]">
          <div className="absolute inset-0 overflow-hidden">
            <ObraFoto obra={portada} priority className="h-full w-full object-cover" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#100E0C] via-[#100E0C]/55 to-[#100E0C]/10" />
          <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-6xl flex-col justify-end px-5 pt-32 pb-16 md:px-8">
            <h1 className="font-display text-[clamp(2.75rem,8.6vw,7.25rem)] leading-[0.92] text-[#F4ECE2]">
              {copy.homeTitle.split("\n").map((linea) => (
                <span key={linea} className="block whitespace-nowrap">{linea}</span>
              ))}
            </h1>
            <p className="mt-5 max-w-md text-lg text-[#F4ECE2]">{copy.homeLede}</p>
            <CtaPar lang={lang} etiqueta={copy.homeCta} ghost={copy.ctaGhost} />
          </div>
        </section>
        {obras.slice(1, 4).map((obra) => (
          <section key={obra.id} className="camino-tramo relative min-h-[100svh] bg-[#100E0C]">
            <div className="absolute inset-0">
              <ObraFoto obra={obra} className="h-full w-full object-cover" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#100E0C] via-[#100E0C]/45 to-[#100E0C]/10" />
            <div className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-6xl flex-col justify-end px-5 pb-16 md:px-8">
              <h2 className="font-display max-w-3xl text-5xl leading-[0.95] text-[#F4ECE2] md:text-7xl">{obra.escena[ui]}</h2>
              <CtaPar lang={lang} etiqueta={copy.homeCta} ghost={copy.ctaGhost} />
            </div>
          </section>
        ))}
        <section className="bg-[#100E0C] py-14">
          <h2 className="font-display px-5 text-3xl md:px-8 md:text-5xl">{copy.railBooks}</h2>
          <div className="estante mt-5 flex gap-3 overflow-x-auto px-5 pb-2 md:px-8">
            {obras.map((obra) => {
              const episodio = catalogo.pendientes.find((item) => item.id === obra.episodio);
              const corto = episodio?.tituloCorto?.[ui] || episodio?.etiqueta?.[ui] || obra.escena[ui];
              return (
                <TarjetaCuadro key={obra.id} href={`/${lang}/catalogo/${obra.episodio}`} episodioId={obra.episodio} titulo={corto || obra.escena[ui]} pronto prontoTexto={copy.pending} />
              );
            })}
          </div>
          <div className="px-5 md:px-8">
            <CtaPar lang={lang} etiqueta={copy.homeCta} ghost={copy.ctaGhost} />
          </div>
        </section>
        <section className="bg-[#100E0C] py-10">
          <h2 className="font-display px-5 text-3xl md:px-8 md:text-5xl">{copy.railPaths}</h2>
          <div className="estante mt-5 flex gap-3 overflow-x-auto px-5 pb-2 md:px-8">
            {obras.filter((_, indice) => indice % 5 === 0).map((obra) => (
              <TarjetaCuadro key={obra.id} href={`/${lang}/catalogo/${obra.episodio}`} episodioId={obra.episodio} titulo={obra.escena[ui]} pronto prontoTexto={copy.pending} />
            ))}
          </div>
        </section>
        <section className="bg-[#100E0C] py-10">
          <h2 className="font-display px-5 text-3xl md:px-8 md:text-5xl">{copy.railChallenges}</h2>
          <div className="estante mt-5 flex gap-3 overflow-x-auto px-5 pb-2 md:px-8">
            {RETOS.map((reto) => {
              const poster = portadaDeReto(reto.id);
              const titulo = (reto.tituloCorto ?? reto.titulo)[ui];
              return poster ? (
                <Link key={reto.id} href={`/reto/${reto.id}`} className="w-44 shrink-0 snap-start">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={poster.src.cuadrado} alt="" className="aspect-square w-full object-cover" />
                  <span className="mt-2 block font-display text-base leading-tight">{titulo}</span>
                </Link>
              ) : (
                <TarjetaCuadro key={reto.id} href={`/reto/${reto.id}`} episodioId={reto.obra} titulo={titulo} pronto prontoTexto={copy.pending} />
              );
            })}
          </div>
        </section>
        <section id="precios" className="bg-[#100E0C] px-5 py-20 md:px-8">
          <div className="mx-auto w-full max-w-6xl">
            <Planes lang={lang} cta={copy.homeCta} riesgo={copy.ctaRisk} />
          </div>
        </section>
        {adviento ? (
          <section className="relative min-h-[88svh] bg-[#100E0C]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={adviento.src.ancho} alt="" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#100E0C] via-[#100E0C]/40 to-transparent" />
            <div className="relative z-10 mx-auto flex min-h-[88svh] w-full max-w-6xl flex-col justify-end px-5 pb-14 md:px-8">
              <h2 className="font-display text-5xl text-[#F4ECE2] md:text-7xl">{copy.adventTitle}</h2>
              <Link href="/reto/adviento-isaias" className="mt-8 inline-flex min-h-12 w-fit items-center rounded-full bg-[#C9A96E] px-6 text-[#100E0C]">{copy.ctaAdvent}</Link>
            </div>
          </section>
        ) : null}
      </main>
      <footer className="bg-[#100E0C] text-[#F4ECE2]">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-16 md:grid-cols-4 md:px-8">
          <div>
            <p className="text-sm text-[#B7AB9C]">{ui === "en" ? "Language" : "Idioma"}</p>
            <SelectorIdioma lang={lang} claro />
          </div>
          <div className="grid content-start gap-2">
            <p className="text-sm text-[#B7AB9C]">Audite</p>
            <Link href="/escuchar" className="inline-flex min-h-11 items-center">{copy.appLink}</Link>
            <Link href={`/${lang}/catalogo`} className="inline-flex min-h-11 items-center">{copy.navCatalog}</Link>
          </div>
          <div className="grid content-start gap-2">
            <p className="text-sm text-[#B7AB9C]">{ui === "en" ? "Help" : "Ayuda"}</p>
            <Link href={`/${lang}/creditos`} className="inline-flex min-h-11 items-center">{ui === "en" ? "Credits" : "Créditos"}</Link>
            <Link href={`/${lang}/membresia`} className="inline-flex min-h-11 items-center">{copy.navMembership}</Link>
          </div>
          <div className="grid content-start gap-2">
            <p className="text-sm text-[#B7AB9C]">{legal.condiciones}</p>
            <Link href={`/${lang}/condiciones`} className="inline-flex min-h-11 items-center">{legal.condiciones}</Link>
            <Link href={`/${lang}/privacidad`} className="inline-flex min-h-11 items-center">{legal.privacidad}</Link>
          </div>
        </div>
        <div className="px-5 md:px-8">
          <CtaPar lang={lang} etiqueta={copy.homeCta} ghost={copy.ctaGhost} />
          {credito ? <p className="mt-8 max-w-xl text-sm text-[#B7AB9C]">{credito}</p> : null}
        </div>
        <div className="mt-8 overflow-hidden">
          <p className="font-display px-2 text-[28vw] leading-[0.78] tracking-[-0.05em] text-[#F4ECE2]" aria-hidden="true">AUDITE</p>
        </div>
      </footer>
      <BarraFija lang={lang} copy={copy} />
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
        <p className="mt-4 text-lg">{copy.catalogIntro}</p>
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
          <Planes lang={lang} cta={copy.homeCta} riesgo={copy.ctaRisk} />
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
